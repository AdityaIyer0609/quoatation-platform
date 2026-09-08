from dataclasses import dataclass

from app.schemas import QuoteSpecification


@dataclass(frozen=True)
class BomPreviewResult:
    """Placeholder result until BomCreationService.PreviewAsync is wired in.

    Intentionally contains only customer-facing quantity and estimated weight.
    No ERP or BOM table fields.
    """

    quantity: int
    total_kg: float
    source: str = "mock"


class MockBomPreviewService:
    def preview(self, specification: QuoteSpecification) -> BomPreviewResult:
        quantity = max(0, _as_int(specification.quantity))
        gsm = _as_int(specification.gsm) or 180
        kg_per_unit = 2.4 + gsm / 450
        return BomPreviewResult(
            quantity=quantity,
            total_kg=round(quantity * kg_per_unit, 2),
        )


def _as_int(value: str) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0
