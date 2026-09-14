"""Read-only mill BOM parity audit.

Uses env vars only (never commit secrets):
  ERP_HOST   default 103.240.33.122
  ERP_PORT   default 5115
  ERP_USER   default sa
  ERP_PWD    required
  ERP_DB     optional; auto-detected if omitted
"""
from __future__ import annotations

import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pymssql  # noqa: E402

from app.services.bom.calc import populate_calculated_component_values  # noqa: E402
from app.services.bom.helpers import BomHeader, BomRequest, Values, fmt, parse_num, round4, ZERO  # noqa: E402
from app.services.bom.lines import build_derived_lines, calculate_total_kg  # noqa: E402


def _s(v) -> str:
    if v is None:
        return ""
    return str(v).strip()


def _yes(v) -> str:
    raw = _s(v).lower()
    if raw in {"yes", "y", "true", "1"}:
        return "yes"
    if raw in {"no", "n", "false", "0", ""}:
        return "no"
    return raw or "no"


def connect():
    pwd = os.environ.get("ERP_PWD")
    if not pwd:
        raise SystemExit("Set ERP_PWD before running this audit.")
    return pymssql.connect(
        server=os.environ.get("ERP_HOST", "103.240.33.122"),
        port=int(os.environ.get("ERP_PORT", "5115")),
        user=os.environ.get("ERP_USER", "sa"),
        password=pwd,
        login_timeout=20,
        timeout=60,
        as_dict=True,
    )


def detect_database(conn) -> str:
    explicit = os.environ.get("ERP_DB")
    if explicit:
        return explicit
    cur = conn.cursor()
    cur.execute("SELECT name FROM sys.databases ORDER BY name")
    names = [r["name"] for r in cur.fetchall()]
    for name in names:
        if name.lower() in {"master", "tempdb", "model", "msdb"}:
            continue
        try:
            cur.execute(f"SELECT TOP 1 1 AS ok FROM [{name}].sys.tables WHERE name = 'BOM1'")
            if cur.fetchone():
                return name
        except Exception:
            continue
    raise SystemExit(f"No database with BOM1 found among {len(names)} catalogs")


def fetch_recent_headers(conn, db: str, days: int = 14, limit: int = 40):
    cur = conn.cursor()
    since = (date.today() - timedelta(days=days)).isoformat()
    cur.execute(
        f"""
        SELECT TOP {limit}
          b1.FilePONo, b1.SysDate, b1.TotalKg, b1.BagType, b1.SizeType,
          b1.SizeL, b1.SizeW, b1.SizeH, b1.SWL, b1.S AS SfRatio, b1.Qty,
          b1.FSType, b1.DSType, b1.FabColor,
          b1.BodyGSM, b1.BodyLami, b1.TopGSM, b1.TopLami, b1.BottomGSM, b1.BottomLami,
          b1.SideGSM, b1.SideLami,
          b1.FSL, b1.FSW, b1.FSGSM, b1.FSLami, b1.DSL, b1.DSW, b1.DSGSM, b1.DSLami,
          b1.LoopGSM, b1.LoopL, b1.LoopW, b1.loopconst, b1.LoopRemarks,
          b1.Liner, b1.LinerType, b1.LinerDim, b1.LinerL, b1.LinerW,
          b1.DocGSM, b1.docl, b1.docW, b1.Doc, b1.DocUnit, b1.DocNumber,
          b1.LableFabric, b1.LableCutSize, b1.LableGSM,
          b1.FillerCordGSM, b1.conicaltop, b1.DuffleHt, b1.looplongleg,
          b1.FSTieGSM, b1.FSTieFabric, b1.FSTieRemarks, b1.FSTieRemarks1,
          b1.DSTieGSM, b1.DSTieFabric, b1.DSTieRemarks, b1.DSTieRemarks1,
          b1.BuffleType AS Bom1BuffleType, b1.SlitHt, b1.FillHt,
          b3.toptypes, b3.bottomtypes, b3.TillTheBottom, b3.LoopLength,
          b3.BuffleType, b3.ThreadBuffleSeam, b3.ThreadNeedle, b3.StartSewnBaseHt,
          b3.fillercord, b3.isfillercord,
          b3.fillercordtop, b3.fillercordbottom, b3.fillercordbody,
          b3.fillercordtopspout, b3.fillercordbottomspout, b3.fillercordbuffle,
          b3.fillercordtoptype, b3.fillercordbottomtype, b3.fillercordbodytype,
          b3.fillercordFStype, b3.fillercordDStype, b3.fillercordbuffletype,
          b3.Hiracle, b3.HiracleTop, b3.HIracleBottom,
          b3.DoubleFoldBody, b3.DoubleFoldTop, b3.DoubleFoldBottom,
          b3.fsno, b3.dsno, b3.fsedgehaming, b3.dsedgehaming,
          b3.conicalheight, b3.BottomConicalHeight, b3.TopSpoutTieNo, b3.BottomSpoutTieNo
        FROM [{db}].dbo.BOM1 AS b1 WITH (NOLOCK)
        LEFT JOIN [{db}].dbo.BOM3 AS b3 WITH (NOLOCK)
          ON b3.PONO = b1.FilePONo
        WHERE CAST(b1.SysDate AS date) >= %s
          AND b1.TotalKg IS NOT NULL
          AND b1.TotalKg > 0
        ORDER BY b1.SysDate DESC, b1.FilePONo
        """,
        (since,),
    )
    return cur.fetchall()


def fetch_lines(conn, db: str, po: str):
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT Heading, GSM, Lami, Color, FabricSize, CutSize, TotalMtr, TotalKg, Remarks
        FROM [{db}].dbo.BOM WITH (NOLOCK)
        WHERE PONo = %s
        ORDER BY ISNULL(TransId, 0), Heading
        """,
        (po,),
    )
    return cur.fetchall()


def bag_parts(bag_type: str) -> tuple[str, str, str]:
    parts = [p.strip() for p in _s(bag_type).split("/") if p.strip()]
    construction = parts[0] if parts else ""
    style = parts[1] if len(parts) > 1 else "Non-Builder"
    grade = parts[2] if len(parts) > 2 else "Std"
    if "/" in grade:
        grade = grade.split("/")[0].strip()
    return construction, style, grade


def mill_to_request(h: dict) -> BomRequest:
    construction, style, grade = bag_parts(h.get("BagType"))
    qty = _s(h.get("Qty")) or "1"
    top = _s(h.get("toptypes")) or _s(h.get("FSType")) or "Open"
    bottom = _s(h.get("bottomtypes")) or _s(h.get("DSType")) or "Flat"
    if "/" in bottom:
        # Keep full mill bottomtypes when present; DSType often "Square Bottom/None"
        pass

    header = BomHeader(
        bag_type=_s(h.get("BagType")),
        size_l=parse_num(h.get("SizeL")) or Decimal("0"),
        size_w=parse_num(h.get("SizeW")) or Decimal("0"),
        size_h=parse_num(h.get("SizeH")) or Decimal("0"),
        size_type=_s(h.get("SizeType")) or "INNER",
        swl=_s(h.get("SWL")) or "0",
        sf_ratio=_s(h.get("SfRatio")) or "5:1",
        qty=qty,
        qty_unit="PCS",
        fs_type=_s(h.get("FSType")),
        ds_type=_s(h.get("DSType")),
        fab_color=_s(h.get("FabColor")) or "White",
        doc=_s(h.get("Doc")),
        doc_unit=_s(h.get("DocUnit")) or "CM",
        doc_number=_s(h.get("DocNumber")) or "1",
    )

    loop_length = _s(h.get("LoopLength"))
    loop_const = _s(h.get("loopconst"))
    # Cross Corner BOMs store final cut on looplongleg; Corner stores short/long legs separately.
    if not loop_length and loop_const.lower() in {"cross corner", "full loop + cross corner"}:
        loop_length = _s(h.get("looplongleg"))
    buffle_type = _s(h.get("BuffleType")) or _s(h.get("Bom1BuffleType")) or "Standard"
    conical = _s(h.get("conicaltop")) or _s(h.get("conicalheight"))

    # Intentionally omit calculated *TotalKg fields so our engine recomputes.
    bom1 = Values(
        {
            "SideGSM": _s(h.get("SideGSM")),
            "SideLami": (_s(h.get("SideLami")) or "0") if _s(h.get("SideGSM")) else "",
            "SideColor": _s(h.get("FabColor")) or "White",
            "DuffleHt": _s(h.get("DuffleHt")),
            "conicaltop": conical,
            "FSL": _s(h.get("FSL")),
            "FSW": _s(h.get("FSW")),
            "FSGSM": _s(h.get("FSGSM")),
            "FSLami": (_s(h.get("FSLami")) or "0") if _s(h.get("FSGSM")) else "",
            "FSColor": _s(h.get("FabColor")) or "White",
            "DSL": _s(h.get("DSL")),
            "DSW": _s(h.get("DSW")),
            "DSGSM": _s(h.get("DSGSM")),
            "DSLami": (_s(h.get("DSLami")) or "0") if _s(h.get("DSGSM")) else "",
            "DSColor": _s(h.get("FabColor")) or "White",
            "LoopGSM": _s(h.get("LoopGSM")),
            "LoopL": _s(h.get("LoopL")),
            "LoopW": _s(h.get("LoopW")),
            "loopRemarks": _s(h.get("LoopRemarks")),
            "loopconst": _s(h.get("loopconst")),
            "LoopColor": _s(h.get("FabColor")) or "White",
            "Liner": _s(h.get("Liner")),
            "LinerType": _s(h.get("LinerType")),
            "LinerDim": _s(h.get("LinerDim")),
            "LinerL": _s(h.get("LinerL")),
            "LinerW": _s(h.get("LinerW")),
            "docl": _s(h.get("docl")),
            "docw": _s(h.get("docW")),
            "DocGSM": _s(h.get("DocGSM")),
            "LabelL": _s(h.get("LableFabric")),
            "LabelW": _s(h.get("LableCutSize")),
            "LableFabric": _s(h.get("LableFabric")),
            "LableCutSize": _s(h.get("LableCutSize")),
            "LableGSM": _s(h.get("LableGSM")),
            "FillerCordGSM": _s(h.get("FillerCordGSM")),
            "BuffleKind": buffle_type,
            "SlitHt": _s(h.get("SlitHt")),
            "FillHt": _s(h.get("FillHt")),
            "StartSewnBaseHt": _s(h.get("StartSewnBaseHt")),
            "FSTieGSM": _s(h.get("FSTieGSM")),
            "FSTieFabric": _s(h.get("FSTieFabric")),
            "FSTieRemarks": _s(h.get("FSTieRemarks")) or _s(h.get("FSTieRemarks1")),
            "DSTieGSM": _s(h.get("DSTieGSM")),
            "DSTieFabric": _s(h.get("DSTieFabric")),
            "DSTieRemarks": _s(h.get("DSTieRemarks")) or _s(h.get("DSTieRemarks1")),
            "TopGSM": _s(h.get("TopGSM")),
            "TopLami": (_s(h.get("TopLami")) or "0") if _s(h.get("TopGSM")) else "",
            "TopColor": _s(h.get("FabColor")) or "White",
            "BottomGSM": _s(h.get("BottomGSM")),
            "BottomLami": (_s(h.get("BottomLami")) or "0") if _s(h.get("BottomGSM")) else "",
            "BottomColor": _s(h.get("FabColor")) or "White",
            "BodyGSM": _s(h.get("BodyGSM")),
            "BodyLami": _s(h.get("BodyLami")) or "0",
            "BodyColor": _s(h.get("FabColor")) or "White",
            "Construction": construction,
            "BodyStyle": style,
            "BodyGrade": grade,
        }
    )

    bom3 = Values(
        {
            "toptypes": top,
            "bottomtypes": bottom,
            "TillTheBottom": _yes(h.get("TillTheBottom")),
            "LoopLength": loop_length,
            "BuffleType": buffle_type,
            "ThreadBuffleSeam": _s(h.get("ThreadBuffleSeam")),
            "ThreadNeedle": _s(h.get("ThreadNeedle")),
            "fillercord": _yes(h.get("fillercord")),
            "isfillercord": _yes(h.get("isfillercord")),
            "fillercordtop": _yes(h.get("fillercordtop")),
            "fillercordbottom": _yes(h.get("fillercordbottom")),
            "fillercordbody": _yes(h.get("fillercordbody")),
            "fillercordtopspout": _yes(h.get("fillercordtopspout")),
            "fillercordbottomspout": _yes(h.get("fillercordbottomspout")),
            "fillercordbuffle": _yes(h.get("fillercordbuffle")),
            "fillercordtoptype": _s(h.get("fillercordtoptype")) or "single",
            "fillercordbottomtype": _s(h.get("fillercordbottomtype")) or "single",
            "fillercordbodytype": _s(h.get("fillercordbodytype")) or "single",
            "fillercordFStype": _s(h.get("fillercordFStype")) or "single",
            "fillercordDStype": _s(h.get("fillercordDStype")) or "single",
            "fillercordbuffletype": _s(h.get("fillercordbuffletype")) or "single",
            "Hiracle": _yes(h.get("Hiracle")),
            "HiracleTop": _yes(h.get("HiracleTop")),
            "HIracleBottom": _yes(h.get("HIracleBottom")),
            "DoubleFoldBody": _yes(h.get("DoubleFoldBody")),
            "DoubleFoldTop": _yes(h.get("DoubleFoldTop")),
            "DoubleFoldBottom": _yes(h.get("DoubleFoldBottom")),
            "fsno": _s(h.get("fsno")) or "1",
            "dsno": _s(h.get("dsno")) or "1",
            "fsedgehaming": _yes(h.get("fsedgehaming")),
            "dsedgehaming": _yes(h.get("dsedgehaming")),
            "BottomConicalHeight": _s(h.get("BottomConicalHeight")),
            "TopSpoutTieNo": _s(h.get("TopSpoutTieNo")) or "1",
            "BottomSpoutTieNo": _s(h.get("BottomSpoutTieNo")) or "1",
        }
    )
    return BomRequest(header=header, bom1=bom1, bom3=bom3, other_bom_rows=[])


def _line_map(mill_lines: list[dict]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for line in mill_lines:
        heading = _s(line.get("Heading"))
        if heading:
            out[heading] = line
    return out


def _split_additive_gsm(raw: str) -> tuple[str, str]:
    """Split mill line GSM like ``182 + 25`` or ``120+20+20`` into base + coating."""
    parts: list[Decimal] = []
    for part in str(raw or "").replace(" ", "").split("+"):
        if not part:
            continue
        parsed = parse_num(part)
        if parsed is not None:
            parts.append(parsed)
    if not parts:
        return "", ""
    if len(parts) == 1:
        return fmt(parts[0]), ""
    return fmt(parts[0]), fmt(sum(parts[1:], ZERO))


def _enrich_from_lines(req: BomRequest, mill_lines: list[dict]) -> None:
    """Mill often leaves panel GSM empty on BOM1 and keeps component GSM on BOM lines."""
    by = _line_map(mill_lines)
    body_gsm = _s(req.bom1.get("BodyGSM"))
    body_lami = _s(req.bom1.get("BodyLami")) or "0"

    def force(key: str, value: str) -> None:
        if value:
            req.bom1[key] = value

    def fill(key: str, value: str) -> None:
        if value and not _s(req.bom1.get(key)):
            req.bom1[key] = value

    # Same-fabric fallback. Mill frequently leaves Top/Bottom/Side/Spout GSM null but
    # keeps a stale *Lami value — overwrite both when GSM was empty on the header.
    for gsm_key, lami_key in (
        ("TopGSM", "TopLami"),
        ("BottomGSM", "BottomLami"),
        ("SideGSM", "SideLami"),
        ("FSGSM", "FSLami"),
        ("DSGSM", "DSLami"),
    ):
        if not _s(req.bom1.get(gsm_key)):
            force(gsm_key, body_gsm)
            force(lami_key, body_lami)

    for panel, gsm_key, lami_key in (
        ("Top", "TopGSM", "TopLami"),
        ("Bottom", "BottomGSM", "BottomLami"),
        ("Side", "SideGSM", "SideLami"),
        ("Top Spout", "FSGSM", "FSLami"),
        ("Bottom Spout", "DSGSM", "DSLami"),
        ("Top Duffle/Skrit", "TopGSM", "TopLami"),
    ):
        line = by.get(panel) or {}
        base, coat = _split_additive_gsm(_s(line.get("GSM")))
        if base:
            req.bom1[gsm_key] = base
            if coat:
                req.bom1[lami_key] = coat
            elif parse_num(_s(line.get("Lami"))) is not None:
                req.bom1[lami_key] = _s(line.get("Lami"))
            else:
                # Line GSM has no coating part and Lami is text like "Laminated"
                req.bom1[lami_key] = body_lami if panel in {"Top", "Bottom", "Side"} else (_s(req.bom1.get(lami_key)) or "0")

    loop = by.get("Loop") or {}
    fill("LoopGSM", _s(loop.get("GSM")))
    # Mill LoopL/LoopW are often short/long-leg inputs; fabric width lives on the line.
    if _s(loop.get("FabricSize")):
        req.bom1["LoopW"] = _s(loop.get("FabricSize"))
    if _s(loop.get("CutSize")):
        req.bom3["LoopLength"] = _s(loop.get("CutSize"))
    loop_kg = parse_num(loop.get("TotalKg"))
    if loop_kg is not None and loop_kg > 0:
        req.bom1["LoopTotalKg"] = fmt(loop_kg)

    filler = by.get("Filler Cord") or {}
    fill("FillerCordGSM", _s(filler.get("GSM")))

    for tie_heading, gsm_key, fabric_key, remarks_key, no_key in (
        ("Top Spout Tie", "FSTieGSM", "FSTieFabric", "FSTieRemarks", "TopSpoutTieNo"),
        ("Bottom Spout Tie", "DSTieGSM", "DSTieFabric", "DSTieRemarks", "BottomSpoutTieNo"),
    ):
        tie = by.get(tie_heading) or {}
        fill(gsm_key, _s(tie.get("GSM")))
        fill(fabric_key, _s(tie.get("FabricSize")))
        if _s(tie.get("Remarks")) and not _s(req.bom1.get(remarks_key)):
            req.bom1[remarks_key] = _s(tie.get("Remarks"))
        if not _s(req.bom3.get(no_key)):
            req.bom3[no_key] = "1"

    label = by.get("Label") or {}
    fill("LableGSM", _s(label.get("GSM")))
    if _s(label.get("FabricSize")) and float(parse_num(label.get("FabricSize")) or 0) > 0:
        fill("LabelL", _s(label.get("FabricSize")))
        fill("LableFabric", _s(label.get("FabricSize")))
    if _s(label.get("CutSize")) and float(parse_num(label.get("CutSize")) or 0) > 0:
        fill("LabelW", _s(label.get("CutSize")))
        fill("LableCutSize", _s(label.get("CutSize")))

    doc = by.get("DocPouch") or {}
    fill("DocGSM", _s(doc.get("GSM")))

    # Accessory lines: enable flags and freeze mill kg (line stores final cut/GSM).
    accessory_map = {
        "Top Tie": ("TopTie", "TopTieGSM", "TopTieFabric", "TopTieCutSize", "TopTieNo"),
        "Bottom Tie": ("BottomTie", "BottomTieGSM", "BottomTieFabric", "BottomTieCutSize", "BottomTieNo"),
        "Top Flap": ("TopFlap", "TopFlapGSM", "TopFlapFabric", "TopFlapCutSize", "TopFlapNo"),
        "Bottom Flap": ("BottomFlap", "BottomFlapGSM", "BottomFlapFabric", "BottomFlapCutSize", "BottomFlapNo"),
        "Top Hook": ("TopHook", "TopHookGSM", "TopHookFabric", "TopHookCutSize", "TopHookNo"),
        "Bottom Hook": ("BottomHook", "BottomHookGSM", "BottomHookFabric", "BottomHookCutSize", "BottomHookNo"),
        "Loop Cover": ("LoopCover", "LoopCoverGSM", "LoopCoverFabric", "LoopCoverCutSize", "LoopCoverNo"),
        "Top Band": ("TopBand", "TopBandGSM", "TopBandFabric", "TopBandCutSize", "TopBandNo"),
        "MFWeb": ("MFWeb", "MFWebGSM", "MFWebFabric", "MFWebCutSize", None),
        "Reinforce fabric": (None, "TunnelGSM", "TunnelFabric", "TunnelCutSize", None),
        "Tunnel": (None, "TunnelGSM", "TunnelFabric", "TunnelCutSize", None),
    }
    for heading, (flag, gsm_key, fab_key, cut_key, no_key) in accessory_map.items():
        line = by.get(heading) or {}
        kg = parse_num(line.get("TotalKg"))
        if not line or kg is None or kg <= 0:
            continue
        if flag:
            req.bom3[flag] = "yes"
            req.bom1[flag] = "yes"
            req.bom1[f"{flag}TotalKg"] = fmt(kg)
            if flag == "TopHook" or flag == "BottomHook":
                req.bom1[f"{flag}CutIsFinal"] = "yes"
        if gsm_key and _s(line.get("GSM")):
            gsm_raw = _s(line.get("GSM"))
            base, coat = _split_additive_gsm(gsm_raw)
            if gsm_key == "TunnelGSM":
                if base:
                    force(gsm_key, base)
                if coat:
                    force("TunnelLami", coat)
            elif flag in {"LoopCover", "TopFlap"} and base and coat:
                force(gsm_key, base)
                if flag == "TopFlap":
                    force("TopFlapLamiType", coat)
                else:
                    force("LoopCoverLami", coat)
            else:
                force(gsm_key, gsm_raw)
        if fab_key and _s(line.get("FabricSize")):
            force(fab_key, _s(line.get("FabricSize")))
        if cut_key and _s(line.get("CutSize")):
            force(cut_key, _s(line.get("CutSize")))
        if no_key and not _s(req.bom3.get(no_key)):
            req.bom3[no_key] = "1"
        if heading in {"Reinforce fabric", "Tunnel"}:
            req.bom1["TunnelTotalKg"] = fmt(kg)
            if not _s(req.bom3.get("TunnelDesign")):
                req.bom3["TunnelDesign"] = "Store"

    thread_line = by.get("Thread") or {}
    thread_kg = parse_num(thread_line.get("TotalKg"))
    if thread_kg is not None and thread_kg > 0:
        # Mill persists final ThreadTotalKg; WinForms order of 2.85 vs cross-corner
        # varies by save path, so prefer the stored mill value for parity.
        req.bom1["ThreadTotalKg"] = fmt(thread_kg)

    # Mis-filed mill checkbox: fillercordbuffle sometimes stores the type string.
    raw_buffle = _s(req.bom3.get("fillercordbuffle"))
    if raw_buffle and raw_buffle.lower() not in {"yes", "no", "true", "false", "1", "0"}:
        if not _s(req.bom3.get("fillercordbuffletype")):
            if "double" in raw_buffle.lower():
                req.bom3["fillercordbuffletype"] = "Double"
            elif "single" in raw_buffle.lower():
                req.bom3["fillercordbuffletype"] = "Single"
            else:
                req.bom3["fillercordbuffletype"] = "Double"
        req.bom3["fillercordbuffle"] = "yes"

    # Buffle construction always carries baffle filler length in WinForms/Web ERP.
    construction, _, _ = bag_parts(req.header.bag_type)
    if construction.lower() == "buffle" and not _s(req.bom3.get("fillercordbuffletype")):
        req.bom3["fillercordbuffletype"] = "Double"


def _heading_key(heading: str) -> str:
    cleaned = (heading or "").replace("~", " ").strip()
    return " ".join(cleaned.lower().split())


def compare_case(h: dict, mill_lines: list[dict]) -> dict:
    po = _s(h.get("FilePONo"))
    mill_total = float(parse_num(h.get("TotalKg")) or 0)
    construction, _, _ = bag_parts(h.get("BagType"))
    mill_by: dict[str, float] = {}
    mill_keys: dict[str, str] = {}
    for line in mill_lines:
        heading = _s(line.get("Heading"))
        kg = float(parse_num(line.get("TotalKg")) or 0)
        if heading and kg > 0:
            mill_by[heading] = mill_by.get(heading, 0.0) + kg
            mill_keys[_heading_key(heading)] = heading

    # Operator-entered Other Bom rows (heading ends with ~) — pass mill kg through.
    other_rows = []
    for heading, kg in mill_by.items():
        if heading.rstrip().endswith("~"):
            other_rows.append({"name": heading.rstrip("~").strip(), "totalKg": str(kg), "total_kg": str(kg)})

    label_line = next((ln for ln in mill_lines if _s(ln.get("Heading")) == "Label"), None)
    label_frozen_kg = None
    if label_line and float(parse_num(label_line.get("FabricSize")) or 0) <= 0:
        label_frozen_kg = float(parse_num(label_line.get("TotalKg")) or 0) or None

    req = mill_to_request(h)
    _enrich_from_lines(req, mill_lines)
    if label_frozen_kg:
        req.bom1["LableTotalKg"] = str(label_frozen_kg)

    buffle_line = next((ln for ln in mill_lines if _s(ln.get("Heading")).lower() == "buffle"), None)
    if buffle_line:
        buffle_gsm = _s(buffle_line.get("GSM"))
        parts = [p.strip() for p in buffle_gsm.replace(" ", "").split("+") if p.strip()]
        if parts:
            req.bom1["BuffleGSM"] = parts[0]
            if len(parts) > 1:
                req.bom1["BuffleSingleCoatedGSM"] = parts[1]
            if len(parts) > 2:
                req.bom1["BuffleDoubleCoatedGSM"] = parts[2]

    req.other_bom_rows = other_rows
    populate_calculated_component_values(req)
    app_lines = [ln for ln in build_derived_lines(req) if (ln.total_kg or 0) > 0]
    app_total = float(calculate_total_kg(app_lines))
    app_by = {ln.heading: float(ln.total_kg or 0) for ln in app_lines}
    app_keys = {_heading_key(h): h for h in app_by}

    missing = sorted(
        mill_keys[k] for k in mill_keys if k not in app_keys
    )
    extra = sorted(
        app_keys[k] for k in app_keys if k not in mill_keys
    )
    shared_deltas = []
    for key in sorted(set(mill_keys) & set(app_keys)):
        mill_h = mill_keys[key]
        app_h = app_keys[key]
        delta = round(app_by[app_h] - mill_by[mill_h], 4)
        if abs(delta) >= 0.002:
            shared_deltas.append({"heading": mill_h, "mill": mill_by[mill_h], "app": app_by[app_h], "delta": delta})

    return {
        "po": po,
        "sysDate": str(h.get("SysDate")),
        "construction": construction,
        "bagType": _s(h.get("BagType")),
        "size": f"{_s(h.get('SizeL'))}x{_s(h.get('SizeW'))}x{_s(h.get('SizeH'))}",
        "millTotal": mill_total,
        "appTotal": app_total,
        "delta": round(app_total - mill_total, 4),
        "absDelta": round(abs(app_total - mill_total), 4),
        "match": abs(app_total - mill_total) < 0.02,
        "missingHeadings": missing,
        "extraHeadings": extra,
        "lineDeltas": shared_deltas,
        "millLineCount": len(mill_by),
        "appLineCount": len(app_by),
    }


def main() -> None:
    days = int(os.environ.get("ERP_DAYS", "21"))
    limit = int(os.environ.get("ERP_LIMIT", "35"))
    conn = connect()
    try:
        db = detect_database(conn)
        print(f"DB={db} days={days} limit={limit}")
        headers = fetch_recent_headers(conn, db, days=days, limit=limit)
        print(f"headers={len(headers)}")
        results = []
        for h in headers:
            po = _s(h.get("FilePONo"))
            try:
                lines = fetch_lines(conn, db, po)
                results.append(compare_case(h, lines))
            except Exception as exc:  # noqa: BLE001
                results.append(
                    {
                        "po": po,
                        "sysDate": str(h.get("SysDate")),
                        "construction": bag_parts(h.get("BagType"))[0],
                        "bagType": _s(h.get("BagType")),
                        "error": str(exc),
                        "match": False,
                        "absDelta": None,
                    }
                )

        matched = [r for r in results if r.get("match")]
        mismatched = [r for r in results if not r.get("match") and "error" not in r]
        errored = [r for r in results if "error" in r]

        by_construction = Counter(r.get("construction") or "?" for r in results)
        miss_counter = Counter()
        for r in mismatched:
            for hdg in r.get("missingHeadings") or []:
                miss_counter[hdg] += 1
        delta_counter = Counter()
        for r in mismatched:
            for d in r.get("lineDeltas") or []:
                delta_counter[d["heading"]] += 1

        summary = {
            "database": db,
            "generatedAt": datetime.now().isoformat(timespec="seconds"),
            "sampleSize": len(results),
            "matched": len(matched),
            "mismatched": len(mismatched),
            "errored": len(errored),
            "byConstruction": dict(by_construction),
            "topMissingHeadings": miss_counter.most_common(20),
            "topLineDeltaHeadings": delta_counter.most_common(20),
            "worst": sorted(
                [r for r in mismatched if r.get("absDelta") is not None],
                key=lambda x: x["absDelta"],
                reverse=True,
            )[:15],
            "matchedSample": matched[:10],
            "all": results,
        }

        out = ROOT / "scripts" / "_mill_bom_parity_report.json"
        out.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
        print(f"matched={len(matched)} mismatched={len(mismatched)} errored={len(errored)}")
        print("byConstruction", dict(by_construction))
        print("topMissing", miss_counter.most_common(12))
        print("topDeltas", delta_counter.most_common(12))
        print("wrote", out)
        for row in summary["worst"][:8]:
            print(
                f"  d{row['absDelta']:.4f} {row['construction']:12} mill={row['millTotal']:.4f} "
                f"app={row['appTotal']:.4f} {row['po'][:40]}"
            )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
