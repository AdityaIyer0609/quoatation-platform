"""Build a quotation PDF from frozen quote snapshots. Never recalculates BOM or Book4."""

from __future__ import annotations

from io import BytesIO

from fpdf import FPDF

from app.models import Quote


def _plain(value: object) -> str:
    text = "" if value is None else str(value)
    return (
        text.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u00d7", "x")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
    )


def _money(value: object, *, manual: bool) -> str:
    if manual or value is None or value == "":
        return "Manual pricing"
    try:
        return f"${float(value):,.2f}"
    except (TypeError, ValueError):
        return "Manual pricing"


def _num(value: object, digits: int = 4) -> str:
    if value is None or value == "":
        return "-"
    try:
        return f"{float(value):.{digits}f}"
    except (TypeError, ValueError):
        return _plain(value)


class QuotePdf(FPDF):
    def header(self) -> None:
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 8, "QuoteCraft Manufacturing", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 5, "Quotation", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "", 8)
        self.cell(0, 8, f"Page {self.page_no()}/{{nb}}", align="C")


def render_quote_pdf(quote: Quote) -> bytes:
    bom = quote.bom_snapshot if isinstance(quote.bom_snapshot, dict) else {}
    pricing = quote.pricing_snapshot if isinstance(quote.pricing_snapshot, dict) else {}
    spec = quote.specification if isinstance(quote.specification, dict) else {}
    customer = quote.customer
    manual = bool(pricing.get("requiresManualPricing")) or pricing.get("unitPrice") is None

    pdf = QuotePdf()
    pdf.compress = False
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 8, _plain(quote.number), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Status: {_plain(quote.status)}", new_x="LMARGIN", new_y="NEXT")
    created = quote.created_at.strftime("%d %b %Y") if quote.created_at else "-"
    valid = quote.valid_until.strftime("%d %b %Y") if quote.valid_until else "-"
    pdf.cell(0, 6, f"Date: {created}    Valid until: {valid}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    _heading(pdf, "Customer")
    pdf.set_font("Helvetica", "", 10)
    name = f"{customer.first_name} {customer.last_name}".strip()
    pdf.cell(0, 5, _plain(name), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, _plain(customer.company), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, _plain(customer.email), new_x="LMARGIN", new_y="NEXT")
    if customer.address:
        pdf.cell(0, 5, _plain(customer.address), new_x="LMARGIN", new_y="NEXT")
    city_line = ", ".join(part for part in [customer.city, customer.state, customer.pincode] if part)
    if city_line:
        pdf.cell(0, 5, _plain(city_line), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    _heading(pdf, "Configuration")
    rows = [
        ("Product", spec.get("productType")),
        ("Category", spec.get("productCategory")),
        ("Construction", spec.get("constructionType")),
        ("Body style", spec.get("bodyStyle")),
        ("Size", spec.get("sizeType")),
        (
            "Dimensions",
            f"{spec.get('length', '')} x {spec.get('width', '')} x {spec.get('height', '')} cm",
        ),
        ("SWL", f"{spec.get('swl', '')} kg"),
        ("Safety factor", spec.get("sfRatio")),
        ("Body GSM", spec.get("bodyGsm")),
        ("Lamination", spec.get("bodyLami")),
        ("Top", spec.get("topType")),
        ("Bottom", spec.get("bottomType")),
        ("Loops", spec.get("loopType") if spec.get("loopEnabled") else "None"),
        ("Liner", spec.get("linerType") if spec.get("linerEnabled") else "None"),
        ("Printing", spec.get("printing")),
        ("Quantity", spec.get("quantity")),
        ("Delivery", spec.get("deliveryLocation")),
    ]
    pdf.set_font("Helvetica", "", 9)
    for label, value in rows:
        pdf.cell(50, 5, _plain(label), border=0)
        pdf.cell(0, 5, _plain(value), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    _heading(pdf, "Material list (frozen BOM)")
    qty = pricing.get("quantity") or bom.get("quantity") or spec.get("quantity") or ""
    kg_bag = bom.get("totalKgPerBag")
    kg_total = bom.get("totalMaterialKg")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 5, f"Quantity: {_plain(qty)}    Weight/bag: {_num(kg_bag)} kg    Total kg: {_num(kg_total)} kg", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 8)
    pdf.cell(40, 5, "Component", border=1)
    pdf.cell(25, 5, "GSM", border=1)
    pdf.cell(30, 5, "kg/bag", border=1, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    for line in bom.get("lines") or []:
        pdf.cell(40, 5, _plain(line.get("heading")), border=1)
        pdf.cell(25, 5, _plain(line.get("gsm")), border=1)
        pdf.cell(30, 5, _num(line.get("totalKg")), border=1, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    currency = _plain(pricing.get("currency") or "USD")
    _heading(pdf, f"Pricing (frozen Book4) - {currency}")
    if manual:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 6, "Manual pricing required. No commercial USD total.", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 8)
        for err in pricing.get("errors") or []:
            message = err.get("message") if isinstance(err, dict) else str(err)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(pdf.epw, 4, _plain(message))
        for warn in pricing.get("warnings") or []:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(pdf.epw, 4, _plain(warn))
        pdf.ln(1)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(80, 5, "PP kg", border=0)
    pdf.cell(0, 5, _num(pricing.get("ppKg")), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(80, 5, "PE / Liner kg", border=0)
    pdf.cell(0, 5, _num(pricing.get("peKg")), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(80, 5, "PP material / bag", border=0)
    pdf.cell(0, 5, _line_money(pricing.get("ppMaterialCost")), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(80, 5, "PE material / bag", border=0)
    pdf.cell(0, 5, _line_money(pricing.get("peMaterialCost")), new_x="LMARGIN", new_y="NEXT")
    conv = pricing.get("conversionCost")
    rate = pricing.get("conversionRatePerTon")
    conv_label = "Conversion / bag"
    if rate is not None:
        conv_label = (
            f"Conversion / bag ({pricing.get('bagDesign') or '-'} / "
            f"{pricing.get('loops') or '-'} / {pricing.get('complication') or '-'} / ${rate}/t)"
        )
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(pdf.epw, 4, _plain(conv_label))
    pdf.cell(80, 5, "Amount", border=0)
    pdf.cell(0, 5, "-" if conv is None else _line_money(conv), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(80, 7, "Unit price")
    pdf.cell(0, 7, _money(pricing.get("unitPrice"), manual=manual), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(80, 7, "Total amount")
    pdf.cell(0, 7, _money(pricing.get("totalAmount"), manual=manual), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(4)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(
        pdf.epw,
        4,
        _plain(
            "This document uses the frozen material list and Book4 pricing snapshot stored with the quotation. "
            f"Lead time: {quote.lead_time}. Payment terms: {quote.payment_terms}."
        ),
    )

    buffer = BytesIO()
    pdf.output(buffer)
    return buffer.getvalue()


def _heading(pdf: QuotePdf, title: str) -> None:
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, _plain(title), new_x="LMARGIN", new_y="NEXT")


def _line_money(value: object) -> str:
    if value is None or value == "":
        return "-"
    try:
        return f"${float(value):,.2f}"
    except (TypeError, ValueError):
        return "-"
