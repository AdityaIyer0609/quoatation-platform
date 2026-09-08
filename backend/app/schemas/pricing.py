from pydantic import BaseModel, ConfigDict, Field

from app.schemas.bom import BomCustomerSpec, BomPreviewResponse


class PricingOptions(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    usa_market: bool = Field(default=False, alias="usaMarket")
    shuttle_8: bool = Field(default=False, alias="shuttle8")
    attachment_count: int = Field(default=0, alias="attachmentCount")
    addons: list[str] = Field(default_factory=list)
    complication: str | None = None
    bag_design: str | None = Field(default=None, alias="bagDesign")
    loop_pattern: str | None = Field(default=None, alias="loopPattern")


class PricingLineOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    code: str
    label: str
    amount_per_bag: float | None = Field(alias="amountPerBag")
    amount_total: float | None = Field(default=None, alias="amountTotal")
    unit: str = ""
    rate: float | None = None
    kg: float | None = None
    note: str = ""


class PricingIssue(BaseModel):
    code: str
    message: str


class PricingPreviewResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    currency: str = "USD"
    source: str = "book4"
    quantity: int
    rule_version: str = Field(default="book4-16-04-26", alias="ruleVersion")
    pp_rm_rate: float = Field(alias="ppRmRate")
    pe_rm_rate: float = Field(alias="peRmRate")
    total_kg_per_bag: float = Field(alias="totalKgPerBag")
    pp_kg: float = Field(alias="ppKg")
    pe_kg: float = Field(alias="peKg")
    unclassified_kg: float = Field(alias="unclassifiedKg")
    material_lines: list[dict] = Field(default_factory=list, alias="materialLines")
    bag_design: str | None = Field(default=None, alias="bagDesign")
    loops: str | None = None
    complication: str | None = None
    conversion_rate_per_ton: float | None = Field(default=None, alias="conversionRatePerTon")
    pp_material_cost: float | None = Field(alias="ppMaterialCost")
    pe_material_cost: float | None = Field(alias="peMaterialCost")
    conversion_cost: float | None = Field(alias="conversionCost")
    surcharges: list[PricingLineOut] = Field(default_factory=list)
    addons: list[PricingLineOut] = Field(default_factory=list)
    printing: PricingLineOut | None = None
    unit_price: float | None = Field(alias="unitPrice")
    total_amount: float | None = Field(alias="totalAmount")
    warnings: list[str] = Field(default_factory=list)
    errors: list[PricingIssue] = Field(default_factory=list)
    requires_manual_pricing: bool = Field(alias="requiresManualPricing")
    priced: bool


class PricingPreviewRequest(BaseModel):
    specification: BomCustomerSpec
    bom: BomPreviewResponse | None = None
    options: PricingOptions = Field(default_factory=PricingOptions)


class ComplicationCandidate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    complication: str
    rate_per_ton: int = Field(alias="ratePerTon")


class ComplicationPickerResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    bag_design: str | None = Field(default=None, alias="bagDesign")
    loops: str | None = None
    lookup_design: str | None = Field(default=None, alias="lookupDesign")
    lookup_loops: str | None = Field(default=None, alias="lookupLoops")
    uses_circular_x_corner_plus_75: bool = Field(default=False, alias="usesCircularXCornerPlus75")
    needs_picker: bool = Field(alias="needsPicker")
    auto_mapped: str | None = Field(default=None, alias="autoMapped")
    candidates: list[ComplicationCandidate] = Field(default_factory=list)
