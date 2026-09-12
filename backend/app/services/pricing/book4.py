"""Book4.xlsx rates. Numbers only from worksheet 16-04-26."""

from __future__ import annotations

RULE_VERSION = "book4-16-04-26"
MANUAL = "Pricing rule not available in Book4 — manual pricing required."
TYPE_D_MANUAL = "Type D has no Book4 conversion amount. Pricing not available / manual pricing required."
MATERIAL_CLASSIFICATION = (
    "BOM contains material kg that Book4 PP/PE buckets cannot classify. "
    "Pricing rule not available in Book4 — manual pricing required."
)
PRINT_QTY_BOUNDARY = (
    "Quantity 500 falls into the undefined printing boundary. "
    "Book4 has bands for less than 500 and more than 500 only."
)
FOOD_LOOP_BLOCK = (
    "1-Loop and 2-Loop options are not available with Food Grade specifications; "
    "therefore we cannot provide a quote."
)

PP_PLATTS = 1485
PP_FOB = 35
PP_UV = 50
PP_RM_PER_T = PP_PLATTS + PP_FOB + PP_UV  # 1570
PE_RM_PER_T = 1940

SURCHARGE_USA = 75
SURCHARGE_FOOD_GRADE = 250
SURCHARGE_SHUTTLE_8 = 50
SURCHARGE_ATTACHMENT_1 = 100
SURCHARGE_ATTACHMENT_2 = 150
SURCHARGE_TWO_LOOP = 50

TYPE_C_EXTRA = {
    "U+2 Panel": 600,
    "Circular": 650,
    "Q-Bag": 700,
}

MIN_KG = {
    "U+2 Panel": 1.50,
    "Circular": 1.75,
    "Q-Bag": 2.20,
}

# (design, loops, complication) -> USD/t
CONVERSION_ROWS: list[tuple[str, str, str, int]] = [
    ("U+2 Panel", "Corner", "Builder", 700),
    ("U+2 Panel", "Corner", "Complicated without Dust Proof", 1000),
    ("U+2 Panel", "Corner", "Complicated with Dust Proof", 1100),
    ("U+2 Panel", "Corner", "Without Shape Loosely Inserted.", 1000),
    ("U+2 Panel", "Corner", "With Shape Loosely Inserted.", 1100),
    ("U+2 Panel", "Corner", "With Flenze Shape", 1150),
    ("Circular", "X-Corner", "Builder", 950),
    ("Circular", "X-Corner", "Complicated without Dust Proof", 1050),
    ("Circular", "X-Corner", "Complicated with Dust Proof", 1150),
    ("Circular", "X-Corner", "Without Shape Loosely Inserted.", 1050),
    ("Circular", "X-Corner", "With Shape Loosely Inserted.", 1150),
    ("Circular", "X-Corner", "Bottom Running Loops", 1250),
    ("Q-Bag", "Corner", "Complicated without Dust Proof", 1050),
    ("Q-Bag", "Corner", "Complicated with Dust Proof", 1150),
    ("Q-Bag", "X-Corner", "Complicated without Dust Proof", 1150),
    ("Q-Bag", "X-Corner", "Complicated with Dust Proof", 1250),
    ("1 Loop", "1 Loop", "Loosely Inserted Liner", 1000),
    ("1 Loop", "1 Loop", "Suspended Liner", 1050),
    ("1 Loop", "1 Loop", "Sewn Liner at Boottom", 1150),
    ("1 Loop", "1+4 Corner Loops", "Without Liner or Shape Liner", 1450),
    ("1 Loop", "1+4 X- Corner Loops", "Without Liner or Shape Liner", 1550),
    ("Fusion", "X-Corner", "Complicated", 2000),
    ("Ventilated", "Corner", "Without Leno/Rachael Skirt", 1100),
]

PRINT_MATRIX = {
    "lt500": {
        "cliche": 0.44,
        "1S/1C": 0.10,
        "1S/2C": 0.12,
        "2S/2C": 0.14,
        "1S/3C": 0.16,
        "2S/3C": 0.18,
        "4S/2C": 0.20,
        "4S/3C": 0.21,
    },
    "gt500": {
        "cliche": 0.10,
        "1S/1C": 0.05,
        "1S/2C": 0.07,
        "2S/2C": 0.09,
        "1S/3C": 0.08,
        "2S/3C": 0.10,
        "4S/2C": 0.14,
        "4S/3C": 0.15,
    },
}

PRINT_TYPE_MAP = {
    "1s1c": "1S/1C",
    "1s/1c": "1S/1C",
    "1s2c": "1S/2C",
    "1s/2c": "1S/2C",
    "2s2c": "2S/2C",
    "2s/2c": "2S/2C",
    "1s3c": "1S/3C",
    "1s/3c": "1S/3C",
    "2s3c": "2S/3C",
    "2s/3c": "2S/3C",
    "4s2c": "4S/2C",
    "4s/2c": "4S/2C",
    "4s3c": "4S/3C",
    "4s/3c": "4S/3C",
}

ADDONS = {
    "Tyvek Safety Label": {"rate": 0.07, "unit": "pcs", "plus_rm": None, "bom_heading": None},
    "Pallets": {"rate": 0.10, "unit": "pcs", "plus_rm": None, "bom_heading": None},
    "Tabbing": {"rate": 0.40, "unit": "pcs", "plus_rm": None, "bom_heading": None},
    "Gluing Standard": {"rate": 0.65, "unit": "pcs", "plus_rm": None, "bom_heading": None},
    "B-Lock/Cable Tie": {"rate": 0.15, "unit": "pcs", "plus_rm": None, "bom_heading": None},
    "MF Webbing": {"rate": 100.0, "unit": "per_ton", "plus_rm": None, "bom_heading": None},
    "Colour Fabric": {"rate": 100.0, "unit": "per_ton", "plus_rm": None, "bom_heading": None},
    "Colour Webbing": {"rate": 50.0, "unit": "per_ton", "plus_rm": None, "bom_heading": None},
    "Felt": {"rate": 5500.0, "unit": "per_ton", "plus_rm": None, "bom_heading": "Felt"},
    "Leno Fabric": {"rate": 2000.0, "unit": "per_ton", "plus_rm": "PP", "bom_heading": None},
    "Rachael Fabric": {"rate": 2500.0, "unit": "per_ton", "plus_rm": "PP", "bom_heading": None},
    "Alu Liner": {"rate": 4600.0, "unit": "per_ton", "plus_rm": "PE", "bom_heading": "Liner"},
    "Migratory Antistatic": {"rate": 1650.0, "unit": "per_ton", "plus_rm": "PE", "bom_heading": None},
    "Permanent Antistatic": {"rate": 2800.0, "unit": "per_ton", "plus_rm": "PE", "bom_heading": None},
    "Conductive Liner": {"rate": 3800.0, "unit": "per_ton", "plus_rm": "PE", "bom_heading": "Liner"},
    "Baffle Liner Bag PE": {"rate": 4000.0, "unit": "per_ton", "plus_rm": "PE", "bom_heading": "Liner"},
    "Net Baffle (PP-$1600)": {"rate": 4700.0, "unit": "per_ton", "plus_rm": "PP", "bom_heading": None},
}
