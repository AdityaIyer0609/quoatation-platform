# Customer pricing rule mapping (Book4)

**Status: approved decisions (2026-09-08). Implementation must follow this document.**

Source: `Book4.xlsx`, worksheet `16-04-26`. Sole commercial bible.  
Currency: **USD**.  
BOM kg comes from the existing BOM engine. Pricing **does not** change BOM formulas.

If Book4 does not define a rate or quantity:  
**“Pricing rule not available in Book4 — manual pricing required.”**  
Do not fill gaps with industry knowledge.

---

## Final $/bag formula (approved)

```
PP RM $/t     = 1485 + 35 + 50 = 1570
PE RM $/t     = 1940

PP kg         = BOM kg classified as PP (see § Material kg)
PE/Liner kg   = BOM kg classified as PE/Liner
Total bag kg  = BOM totalKgPerBag

Material cost $/bag     = PP kg × 1570 / 1000
                        + PE/Liner kg × 1940 / 1000

Conversion cost $/bag   = Total bag kg × conversion_rate_usd_per_t / 1000

Per-ton surcharge $/bag = Total bag kg × surcharge_usd_per_t / 1000
Per-piece addon $/bag   = addon_rate_usd_per_pc
Per-ton addon $/bag     = addon_kg × addon_rate_usd_per_t / 1000
Plus RM addon $/bag     = addon_kg × addon_rate_usd_per_t / 1000
                        + addon_kg × applicable_RM_usd_per_t / 1000

Printing $/bag          = cliché[qty band] + print_type[qty band]
                          (matrix only; $0 if UnPrinted)

Unit price $/bag        = material + conversion + surcharges
                        + addons + printing

Quote total             = unit price × quantity
```

No other pricing logic.

`conversion_rate_usd_per_t` is the Book4 design-table rate only.  
USA / food grade / shuttle / attachments / 2-loop / Type C are **separate surcharge lines**, not folded into that lookup.

---

## 1. Raw material (Book4 D2:I3)

| Input | Cell | USD/t |
|---|---|---|
| PP Platts South Asia | E3 | 1485 |
| FOB | F3 | 35 |
| UV | G3 | 50 |
| PP Total/Ton | H3 = E3+F3+G3 | **1570** |
| PE(Liner) | I3 | **1940** |

UV is always in H3 on the sheet; it is not optional.

---

## 2. Material kg from BOM (verified — do **not** use total − liner)

**Rejected:** `PP kg = totalKgPerBag − Liner kg`. WinForms does **not** treat every non-liner line as PP.

### Evidence

1. **WinForms `frmBOM_NEW.print()`** sums **all** component weights into `TotalKg` (body, sides, top/bottom, spouts, ties, ropes, loops, liner, liner baffle, doc pouch, labels, tunnel, baffle, filler cord, felt, MF web, thread, inner skins, …). Accessories **are** in total bag kg.
2. The same form’s **commented Group A/B commercial block** (`frmBOM_NEW.cs` ~9676–9710) did **not** use total − liner:
   - Group A (then × `textRMPP` PP RM): `TotalKg − Liner − Doc − FillerCord − (Felt in one filler-cord case)`.
   - Group B (× `textRMPE`): **Liner only**.
   - Doc pouch was **removed from PP** and **not** put in PE Group B.
3. **Web ERP / Python BOM** (same formulas as `BomCreationService`):
   - Woven fabric / loop / tie lines: GSM or grm cut formulas → PP textile.
   - **Liner:** micron × `ResolveLinerDensity` (LD/LLD **0.92**, HD **0.94**, ALU **1.1**).
   - **DocPouch:** micron × **0.92** (film), not liner.
   - **Label:** 0.92 or Tyvek density 1 — not woven PP, not liner.
4. Book4 PE cell is **PE(Liner)**. That matches the **Liner** line for LD/LLD/HD only. ALU is a separate Book4 addon, not the PE RM rate.

### Pricing buckets (this engine)

| Bucket | Rule |
|---|---|
| PP kg | Sum of headings classified **PP** below |
| PE/Liner kg | **Liner** heading **and** liner material is LD, LLD, or HD |
| Unclassified kg | Any other positive line kg |
| Total bag kg | BOM `totalKgPerBag` (conversion / min-weight / per-ton surcharges) |

If **unclassified kg > 0**, do **not** auto-price: Book4 PP/PE RM must not be applied to an unconfirmed polymer. Conversion still uses total bag kg **only if** a conversion row exists; the commercial unit price stays unset (`requiresManualPricing`).

Rule version frozen on quotes: `book4-16-04-26`.

### BOM line / component | Material category | PP kg? | PE/Liner kg? | Evidence/source

| BOM line | Category | PP? | PE/Liner? | Evidence |
|---|---|---|---|---|
| Body | PP woven | Yes | No | WinForms body GSM formula; ERP `PopulateCalculatedBodyValues` |
| Side | PP woven | Yes | No | Same fabric GSM family |
| Top | PP woven | Yes | No | Top GSM formula |
| Top Spout | PP woven | Yes | No | Filling-spout fabric GSM |
| Top Spout Tie | PP webbing | Yes | No | Tie grm/cut (loop-family) |
| Bottom | PP woven | Yes | No | Bottom GSM |
| Bottom Spout | PP woven | Yes | No | Discharge-spout fabric GSM |
| Bottom Spout Tie | PP webbing | Yes | No | Tie family |
| Loop | PP webbing | Yes | No | Loop GSM/grm formula |
| IRIS Tie | PP webbing | Yes | No | Tie family |
| Top Flap | PP woven | Yes | No | Extra fabric GSM |
| Buffle | PP woven | Yes | No | Baffle fabric GSM (ERP heading spelling) |
| Loop Cover | PP woven | Yes | No | Extra fabric |
| Inner Skin | PP woven | Yes | No | Extra fabric |
| Tunnel / Reinforce fabric | PP woven | Yes | No | Tunnel GSM |
| Thread | PP (sewing) | Yes | No | In WinForms Group A **remainder** (after subtracting liner/doc/filler/felt) × RMPP |
| Liner (LD / LLD / HD) | PE film | No | **Yes** | Liner micron × 0.92/0.94; Book4 PE(Liner); WinForms Group B |
| Liner (ALU) | Aluminium liner | No | **No** | Density 1.1; Book4 Alu Liner addon, not PE 1940. Unclassified for RM |
| DocPouch | PE film (pouch) | No | **No** | ERP × 0.92; WinForms **subtracted from PP**, not added to Group B PE. Unclassified |
| Label | Film or Tyvek | No | **No** | Density 0.92 or 1; not in Book4 PE(Liner). Unclassified |
| Felt | Felt (addon) | No | No | WinForms sometimes excluded from PP Group A; Book4 Felt $/t addon. Unclassified for RM |
| Filler Cord | Cord | No | No | WinForms subtracted from PP Group A. Unclassified |
| Any other heading | Unknown | No | No | Do not invent. Unclassified |

Python BOM headings that exist today are the rows above (`backend/app/services/bom/lines.py`). WinForms can emit additional lines (ropes, petal, hooks, MF web, inner box, …) that this customer engine does not generate; if they appear later they stay **unclassified**.

If a Book4 addon needs a **named** material quantity (Felt, Leno, Rachael, Alu liner, baffle, net baffle) and the BOM has **no matching line kg**, **flag** and do not invent kg.

**Per-ton addons that do not name a distinct BOM component** (Colour Fabric, Colour Webbing, MF Webbing) use **total bag kg**, same basis as conversion. Book4 does not give another kg basis.

**Plus RM overlap warning:** base material already charges PP/PE RM on classified kg. A Plus RM addon that uses the same kg adds RM again as specified. The engine **warns** when addon kg overlaps base PP/PE kg; it does not deduct (Book4 does not say to deduct).

Applicable RM for Plus RM:

| Addon | RM rate |
|---|---|
| Leno Fabric, Rachael Fabric, Net Baffle (PP-…) | PP 1570 $/t |
| Alu Liner, Migratory/Permanent Antistatic, Conductive Liner, Baffle Liner Bag PE | PE 1940 $/t |

Net Baffle **rate cell is $4700/t**. The “PP-$1600” in the label is **not** used as a rate.

---

## 3. Bag design mapping (customer → Book4)

| Customer / BOM | Book4 Bag Design |
|---|---|
| `constructionType` Circular | Circular |
| `constructionType` UPanel / U-Panel | U+2 Panel |
| `constructionType` 4 Panel / 4-Panel | U+2 Panel (no distinct 4 Panel rate in Book4) |
| `constructionType` Q-Bag | Q-Bag |
| `constructionType` Fusion | Fusion |
| `constructionType` Ventilated **or** `bodyStyle` = Ventilated | Ventilated |
| `constructionType` is 1 Loop **or** `loopCount` = 1 | 1 Loop |
| Request `options.bagDesign` | Exact Book4 name, overrides above |

Priority if several apply: explicit `options.bagDesign` → 1 Loop (explicit) → Fusion / Q-Bag / Ventilated tokens → Circular / U+2.

**Not mapped:** ERP `Buffle`, `Tunnel`, `Sulzer`, etc. → no Book4 design → manual.

---

## 4. Loop mapping

| Customer `loopConstruction` | Book4 Loops |
|---|---|
| Corner | Corner |
| Cross Corner | X-Corner |

**U+2 Panel + X-Corner (Book4 note 9, literal):**  
Do **not** use U+2 Corner rate + 75.  
Use **Circular + X-Corner conversion for the same complication**, then **+$75/t**.

Example: UPanel, Cross Corner, Builder → Circular Builder **950** + **75** = **1025** $/t.  
Not U+2 Builder 700 + 75 = 775.

If Circular has no row for that complication, U+2 X-Corner cannot be priced.

**1 Loop design** uses Book4 loop labels (`1 Loop`, `1+4 Corner Loops`, `1+4 X- Corner Loops`).  
`loopCount = 1` maps to loops = `1 Loop` only. **1+4** rows are used only when `options.loopPattern` is that exact Book4 string.

`Full Loop + Cross Corner` and any other loop string: no rule.

---

## 5. Complication mapping (explicit only)

Book4 has one complication per conversion row. Do **not** infer Dust Proof, loosely inserted, sewn liner, or bottom-running loops from unrelated fields.

| Book4 complication | Apply when |
|---|---|
| Builder | `bodyStyle` = `Builder` |
| With Flenze Shape | `linerType` contains `Flenze` (catalog: `Form Fit Flenze Liner`) |
| Suspended Liner | `linerType` is `Suspended` (1 Loop table) |
| *(exact string)* | `options.complication` equals a Book4 complication cell |

**Not mapped (remain unresolved):**

- Complicated without Dust Proof  
- Complicated with Dust Proof  
- Without Shape Loosely Inserted.  
- With Shape Loosely Inserted.  
- Bottom Running Loops  
- Loosely Inserted Liner  
- Sewn Liner at Boottom  
- Without Liner or Shape Liner  
- Complicated (Fusion label)  
- Without Leno/Rachael Skirt  

**Lookup when complication is missing:**

- If **exactly one** Book4 row exists for (design, loops), use that row (Fusion X-Corner; Ventilated Corner).  
- If **several** rows exist, return manual — do not default to Builder or “complicated”.  
- If **two mapped complications** apply at once (e.g. Builder + Flenze), return manual — Book4 is not additive.

`Non-Builder` is **not** a Book4 complication.

---

## 6. Conversion table (C17:F40)

Rates USD/t, copied from Book4.

### U+2 Panel · Corner

| Complication | Conv./t |
|---|---|
| Builder | 700 |
| Complicated without Dust Proof | 1000 |
| Complicated with Dust Proof | 1100 |
| Without Shape Loosely Inserted. | 1000 |
| With Shape Loosely Inserted. | 1100 |
| With Flenze Shape | 1150 |

### Circular · X-Corner

| Complication | Conv./t |
|---|---|
| Builder | 950 |
| Complicated without Dust Proof | 1050 |
| Complicated with Dust Proof | 1150 |
| Without Shape Loosely Inserted. | 1050 |
| With Shape Loosely Inserted. | 1150 |
| Bottom Running Loops | 1250 |

Circular + Corner: **no row**.

### Q-Bag

| Loops | Complication | Conv./t |
|---|---|---|
| Corner | Complicated without Dust Proof | 1050 |
| Corner | Complicated with Dust Proof | 1150 |
| X-Corner | Complicated without Dust Proof | 1150 |
| X-Corner | Complicated with Dust Proof | 1250 |

Q-Bag has **no** mapped complication in §5 → auto-price only if `options.complication` is an exact row.

### 1 Loop

| Loops | Complication | Conv./t |
|---|---|---|
| 1 Loop | Loosely Inserted Liner | 1000 |
| 1 Loop | Suspended Liner | 1050 |
| 1 Loop | Sewn Liner at Boottom | 1150 |
| 1+4 Corner Loops | Without Liner or Shape Liner | 1450 |
| 1+4 X- Corner Loops | Without Liner or Shape Liner | 1550 |

### Fusion · X-Corner · Complicated | 2000  

Unique (Fusion, X-Corner) row → used when loops are X-Corner.

### Ventilated · Corner · Without Leno/Rachael Skirt | 1100  

Unique (Ventilated, Corner) row → used when loops are Corner.  
Ventilated + X-Corner: no row.

---

## 7. Surcharges (notes) — exact Book4 amounts only

Applied as **separate** $/t on **total bag kg**. Not invented extras.

| Rule | Condition | USD/t |
|---|---|---|
| USA | `options.usaMarket` = true | +75 |
| Food grade | `bodyGrade` is `FDA` or `UN+FDA` | +250 |
| 8-shuttle | `options.shuttle8` = true | +50 |
| 1 attachment | `options.attachmentCount` = 1 | +100 |
| 2 attachments | `options.attachmentCount` = 2 | +150 |
| 2-loop | `loopCount` = 2 | +50 |
| Type C · U+2 Panel | bag type Type C and design U+2 Panel | +600 |
| Type C · Circular | Type C and Circular | +650 |
| Type C · Q-Bag | Type C and Q-Bag | +700 |

Bag type from `productCategory` (`Type A` / `Type B` / `Type C` / `Type D`).

**Type D:** no conversion chart in Book4. Result: **Pricing not available / manual pricing required.** Do not use Type C or any substitute conversion.

**Type C** on Fusion / Ventilated / 1 Loop: extra not in Book4 → flag that surcharge; quote requires manual pricing.

**Food grade + 1-loop or 2-loop:** Book4 forbids quotes. Engine returns unavailable (not a guessed price).

**KPW / OEL** higher conversion: **no amounts in Book4** — not applied.

**Attachments > 2:** no Book4 rate → flag.

USA / shuttle / attachments are **not** inferred from `deliveryLocation`. They require `options`.

---

## 8. Minimum bag weight (note only — do not change the price)

| Book4 design | Min kg/bag |
|---|---|
| U+2 Panel | 1.50 |
| Circular | 1.75 |
| Q-Bag | 2.20 |

Book4 lists these as a note and mentions extra cost **with no amount**.  
If `totalKgPerBag` is below the min: **warn only**. **Do not** add a surcharge, **do not** block auto-price, **do not** change conversion or RM. Light bags use the same $/t formula as any other bag.  
1 Loop / Fusion / Ventilated have **no** min in Book4 — no min check.

---

## 9. Addons (I18:L34) — exact units

Printing $0.07 / $0.10 (I36:J37) is **not used**.

| Addon | Rate | Unit | Plus RM |
|---|---|---|---|
| Tyvek Safety Label | 0.07 | Pcs | |
| Pallets | 0.10 | Pcs | |
| Tabbing | 0.40 | Pcs | |
| Gluing Standard | 0.65 | Pcs | |
| B-Lock/Cable Tie | 0.15 | Pcs | |
| MF Webbing | 100 | Per Ton | |
| Colour Fabric | 100 | Per Ton | |
| Colour Webbing | 50 | Per Ton | |
| Felt | 5500 | Per Ton | |
| Leno Fabric | 2000 | Per Ton | Yes (PP RM) |
| Rachael Fabric | 2500 | Per Ton | Yes (PP RM) |
| Alu Liner | 4600 | Per Ton | Yes (PE RM) |
| Migratory Antistatic | 1650 | Per Ton | Yes (PE RM) |
| Permanent Antistatic | 2800 | Per Ton | Yes (PE RM) |
| Conductive Liner | 3800 | Per Ton | Yes (PE RM) |
| Baffle Liner Bag PE | 4000 | Per Ton | Yes (PE RM) |
| Net Baffle (PP-$1600) | 4700 | Per Ton | Yes (PP RM) |

**When an addon applies**

| Addon | Auto from spec | Else |
|---|---|---|
| MF Webbing | `loopType` = `MultiFilament` | `options.addons` |
| Alu Liner | `linerEnabled` and `linerMaterial` = `ALU` | `options.addons` |
| Colour Fabric | `fabricColour` is `Blue`, `Green`, or `Black` | `options.addons` |
| Colour Webbing | same colours **and** `loopEnabled` | `options.addons` |
| All others | **never inferred** | exact name in `options.addons` |

White / Milky White / Natural do **not** take colour addons.

Felt / Leno / Rachael / Net Baffle / baffle liner: require BOM line kg (`Felt`, `Buffle` is **not** mapped to Net Baffle). Missing kg → flag.

---

## 10. Printing — matrix only (B42:K44)

Do **not** apply Up to 2S2C $0.07 or Up to 4S4C $0.10.

**Qty bands**

- quantity **< 500** → Less than 500 pcs row  
- quantity **> 500** → More than 500 pcs row  
- quantity **= 500** → **exception**: do not pick a band; require the user to change quantity. Other cost lines may still be computed.

**Print $/bag** = Cliché Cost cell **+** matching print-type cell (both columns are in the matrix).

| Qty | Cliché | 1S/1C | 1S/2C | 2S/2C | 1S/3C | 2S/3C | 4S/2C | 4S/3C |
|---|---|---|---|---|---|---|---|---|
| < 500 | 0.44 | 0.10 | 0.12 | 0.14 | 0.16 | 0.18 | 0.20 | 0.21 |
| > 500 | 0.10 | 0.05 | 0.07 | 0.09 | 0.08 | 0.10 | 0.14 | 0.15 |

| Customer `printing` | Matrix column |
|---|---|
| UnPrinted / empty | **$0** (no matrix row) |
| 1S1C | 1S/1C |
| 1S2C | 1S/2C |
| 2S2C | 2S/2C |
| 2S1C | **no column** → manual |
| Any 3-colour / 4-side string matching a header exactly | that column |
| Other | manual |

---

## 11. Architecture

```
Customer specification
  → BOM engine (unchanged)
  → BOM lines + totalKgPerBag
  → Pricing engine (this service)
  → Breakdown + $/bag + quote total
  → Warnings / manual-pricing flags
```

`POST /api/quotes/pricing/preview`  
Body: `{ specification, bom?, options? }`.  
If `bom` is omitted, the API runs BOM preview first (does not edit BOM code).

Engine must not modify BOM calculation modules.

---

## 12. API breakdown fields

- PP material cost  
- PE/Liner material cost  
- Conversion cost (rate + kg)  
- Each surcharge  
- Each per-piece / per-ton addon  
- Printing  
- Total $/bag  
- Total quote  
- Warnings  
- Errors / unresolved / `requiresManualPricing`

---

## 13. Options the customer spec does not have yet

| Option | Purpose |
|---|---|
| `usaMarket` | USA +$75/t |
| `shuttle8` | 8-shuttle +$50/t |
| `attachmentCount` | 0 / 1 / 2 |
| `addons` | Book4 addon names |
| `complication` | Exact Book4 complication |
| `bagDesign` | Exact Book4 design override |
| `loopPattern` | 1+4 loop labels |

Unspecified options default to **off** (no surcharge), not to a guessed market.

---

## 14. Source cells

RM D2:I3; notes B5:C15; conversion C17:F40; addons I17:L34; print matrix B42:K44.  
I36:J37 printing addons **ignored**.
