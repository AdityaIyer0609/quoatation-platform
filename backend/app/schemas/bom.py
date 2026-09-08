from pydantic import BaseModel, ConfigDict, Field


class BomCustomerSpec(BaseModel):
    """Customer-facing FIBC specification. Maps internally to ERP header/Bom1/Bom3 keys."""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    product_type: str = Field(default="FIBC Bulk Bag", alias="productType")
    product_category: str = Field(default="Type A — Standard", alias="productCategory")
    construction_type: str = Field(alias="constructionType")
    body_style: str = Field(default="Standard", alias="bodyStyle")
    body_grade: str = Field(default="Standard", alias="bodyGrade")
    size_type: str = Field(default="INNER", alias="sizeType")
    length: str
    width: str
    height: str
    swl: str = "1000"
    sf_ratio: str = Field(default="5:1", alias="sfRatio")
    fabric_colour: str = Field(default="White", alias="fabricColour")
    body_gsm: str = Field(alias="bodyGsm")
    body_lami: str = Field(default="0", alias="bodyLami")
    same_fabric_for_panels: bool = Field(default=True, alias="sameFabricForPanels")
    top_gsm: str = Field(default="", alias="topGsm")
    top_lami: str = Field(default="", alias="topLami")
    bottom_gsm: str = Field(default="", alias="bottomGsm")
    bottom_lami: str = Field(default="", alias="bottomLami")
    side_gsm: str = Field(default="", alias="sideGsm")
    side_lami: str = Field(default="", alias="sideLami")
    top_type: str = Field(default="Open Top", alias="topType")
    bottom_type: str = Field(default="Flat Bottom", alias="bottomType")
    duffle_height: str = Field(default="", alias="duffleHeight")
    conical_top: str = Field(default="", alias="conicalTop")
    top_spout_type: str = Field(default="Standard", alias="topSpoutType")
    top_spout_dia: str = Field(default="", alias="topSpoutDia")
    top_spout_height: str = Field(default="", alias="topSpoutHeight")
    top_spout_gsm: str = Field(default="", alias="topSpoutGsm")
    top_spout_lami: str = Field(default="", alias="topSpoutLami")
    top_spout_count: str = Field(default="1", alias="topSpoutCount")
    top_spout_edge_hemming: bool = Field(default=False, alias="topSpoutEdgeHemming")
    bottom_spout_type: str = Field(default="Standard", alias="bottomSpoutType")
    bottom_spout_dia: str = Field(default="", alias="bottomSpoutDia")
    bottom_spout_height: str = Field(default="", alias="bottomSpoutHeight")
    bottom_spout_gsm: str = Field(default="", alias="bottomSpoutGsm")
    bottom_spout_lami: str = Field(default="", alias="bottomSpoutLami")
    bottom_spout_count: str = Field(default="1", alias="bottomSpoutCount")
    bottom_spout_edge_hemming: bool = Field(default=False, alias="bottomSpoutEdgeHemming")
    loop_enabled: bool = Field(default=True, alias="loopEnabled")
    loop_type: str = Field(default="4 lift loops", alias="loopType")
    loop_construction: str = Field(default="Cross Corner", alias="loopConstruction")
    loop_gsm: str = Field(default="40", alias="loopGsm")
    loop_length: str = Field(default="30", alias="loopLength")
    loop_width: str = Field(default="5", alias="loopWidth")
    loop_count: str = Field(default="4", alias="loopCount")
    loop_till_bottom: bool = Field(default=False, alias="loopTillBottom")
    drop_loop: bool = Field(default=False, alias="dropLoop")
    drop_loop_length: str = Field(default="", alias="dropLoopLength")
    liner_enabled: bool = Field(default=False, alias="linerEnabled")
    liner_material: str = Field(default="LD", alias="linerMaterial")
    liner_type: str = Field(default="Gusseted Liner", alias="linerType")
    liner_micron: str = Field(default="", alias="linerMicron")
    doc_pouch: bool = Field(default=False, alias="docPouch")
    doc_type: str = Field(default="A4 / Vertical Open", alias="docType")
    doc_length: str = Field(default="30", alias="docLength")
    doc_width: str = Field(default="22", alias="docWidth")
    doc_micron: str = Field(default="100", alias="docMicron")
    doc_unit: str = Field(default="CM", alias="docUnit")
    doc_count: str = Field(default="1", alias="docCount")
    label: bool = False
    label_length: str = Field(default="10", alias="labelLength")
    label_width: str = Field(default="8", alias="labelWidth")
    label_micron: str = Field(default="100", alias="labelMicron")
    printing: str = ""
    quantity: str
    notes: str = ""
    delivery_location: str = Field(default="", alias="deliveryLocation")
    double_fold_body: bool = Field(default=False, alias="doubleFoldBody")
    double_fold_top: bool = Field(default=False, alias="doubleFoldTop")
    double_fold_bottom: bool = Field(default=False, alias="doubleFoldBottom")
    tunnel_design: str = Field(default="", alias="tunnelDesign")
    tunnel_gsm: str = Field(default="", alias="tunnelGsm")
    tunnel_lami: str = Field(default="", alias="tunnelLami")
    top_spout_tie_gsm: str = Field(default="", alias="topSpoutTieGsm")
    top_spout_tie_size: str = Field(default="", alias="topSpoutTieSize")
    top_spout_tie_remarks: str = Field(default="", alias="topSpoutTieRemarks")
    top_spout_tie_count: str = Field(default="", alias="topSpoutTieCount")
    bottom_spout_tie_gsm: str = Field(default="", alias="bottomSpoutTieGsm")
    bottom_spout_tie_size: str = Field(default="", alias="bottomSpoutTieSize")
    bottom_spout_tie_remarks: str = Field(default="", alias="bottomSpoutTieRemarks")
    bottom_spout_tie_count: str = Field(default="", alias="bottomSpoutTieCount")
    top_iris_tie_count: str = Field(default="", alias="topIrisTieCount")
    bottom_iris_tie_count: str = Field(default="", alias="bottomIrisTieCount")
    filler_cord: bool = Field(default=False, alias="fillerCord")
    filler_cord_gpm: str = Field(default="", alias="fillerCordGpm")
    filler_cord_top: bool = Field(default=False, alias="fillerCordTop")
    filler_cord_bottom: bool = Field(default=False, alias="fillerCordBottom")
    filler_cord_body: bool = Field(default=False, alias="fillerCordBody")
    filler_cord_top_spout: bool = Field(default=False, alias="fillerCordTopSpout")
    filler_cord_bottom_spout: bool = Field(default=False, alias="fillerCordBottomSpout")
    filler_cord_top_type: str = Field(default="single", alias="fillerCordTopType")
    filler_cord_bottom_type: str = Field(default="single", alias="fillerCordBottomType")
    filler_cord_body_type: str = Field(default="single", alias="fillerCordBodyType")
    filler_cord_top_spout_type: str = Field(default="single", alias="fillerCordTopSpoutType")
    filler_cord_bottom_spout_type: str = Field(default="single", alias="fillerCordBottomSpoutType")
    thread_colour: str = Field(default="", alias="threadColour")
    thread_type: str = Field(default="", alias="threadType")

    # Legacy display fields kept so existing quotes still parse.
    fabric: str = "Virgin PP Woven"
    gsm: str = ""
    liner: str = ""
    loops: str = ""
    accessories: list[str] = Field(default_factory=list)
    bottom_construction: str = Field(default="", alias="bottomConstruction")
    top_construction: str = Field(default="", alias="topConstruction")


class BomLineOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    heading: str
    gsm: str = ""
    lamination: str = ""
    colour: str = ""
    fabric_size: str = Field(default="", alias="fabricSize")
    cut_size: str = Field(default="", alias="cutSize")
    total_mtr: float | None = Field(default=None, alias="totalMtr")
    total_kg: float | None = Field(default=None, alias="totalKg")
    remarks: str = ""


class BomPreviewResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    lines: list[BomLineOut]
    total_kg_per_bag: float = Field(alias="totalKgPerBag")
    total_material_kg: float = Field(alias="totalMaterialKg")
    quantity: float
    construction: str
    size_type: str = Field(alias="sizeType")
    dimensions: str
    warnings: list[str] = Field(default_factory=list)
    source: str = "erp-port"


class BomPreviewRequest(BaseModel):
    specification: BomCustomerSpec


