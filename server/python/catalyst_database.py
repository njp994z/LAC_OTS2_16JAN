# catalyst_database.py
# Catalyst properties database for SO2 oxidation catalysts

from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class CatalystProperties:
    name: str
    manufacturer: str
    shape: str
    nominal_size_mm: float
    bulk_density_kg_m3: float
    void_fraction: float
    surface_area_m2_g: float
    activity_fresh: float
    activity_aged: float
    max_temp_C: float
    min_inlet_temp_C: float
    notes: str = ""

CATALYST_DATABASE: Dict[str, CatalystProperties] = {
    "MECS CS120": CatalystProperties(
        name="MECS CS120",
        manufacturer="MECS (DuPont)",
        shape="Ring",
        nominal_size_mm=12.0,
        bulk_density_kg_m3=460,
        void_fraction=0.45,
        surface_area_m2_g=2.5,
        activity_fresh=1.05,
        activity_aged=0.85,
        max_temp_C=640,
        min_inlet_temp_C=385,
        notes="Standard Cs-promoted ring catalyst for Pass 1-3"
    ),
    "MECS GR330": CatalystProperties(
        name="MECS GR330",
        manufacturer="MECS (DuPont)",
        shape="Ring",
        nominal_size_mm=10.0,
        bulk_density_kg_m3=480,
        void_fraction=0.42,
        surface_area_m2_g=3.0,
        activity_fresh=1.10,
        activity_aged=0.90,
        max_temp_C=620,
        min_inlet_temp_C=370,
        notes="High-activity Cs-promoted catalyst for Pass 1-2"
    ),
    "MECS LP120": CatalystProperties(
        name="MECS LP120",
        manufacturer="MECS (DuPont)",
        shape="Ring",
        nominal_size_mm=12.0,
        bulk_density_kg_m3=420,
        void_fraction=0.48,
        surface_area_m2_g=2.8,
        activity_fresh=1.15,
        activity_aged=0.95,
        max_temp_C=600,
        min_inlet_temp_C=360,
        notes="Low-temperature startup catalyst for Pass 4-5"
    ),
    "Topsoe VK38": CatalystProperties(
        name="Topsoe VK38",
        manufacturer="Topsoe",
        shape="Daisy",
        nominal_size_mm=10.0,
        bulk_density_kg_m3=470,
        void_fraction=0.44,
        surface_area_m2_g=2.6,
        activity_fresh=1.08,
        activity_aged=0.88,
        max_temp_C=630,
        min_inlet_temp_C=380,
        notes="Standard V2O5 catalyst with K2O promoter"
    ),
    "Topsoe VK59": CatalystProperties(
        name="Topsoe VK59",
        manufacturer="Topsoe",
        shape="Daisy",
        nominal_size_mm=9.0,
        bulk_density_kg_m3=450,
        void_fraction=0.46,
        surface_area_m2_g=3.2,
        activity_fresh=1.12,
        activity_aged=0.92,
        max_temp_C=610,
        min_inlet_temp_C=365,
        notes="High-activity Cs-promoted catalyst"
    ),
    "Topsoe VK69": CatalystProperties(
        name="Topsoe VK69",
        manufacturer="Topsoe",
        shape="Daisy",
        nominal_size_mm=9.0,
        bulk_density_kg_m3=440,
        void_fraction=0.47,
        surface_area_m2_g=3.5,
        activity_fresh=1.18,
        activity_aged=0.98,
        max_temp_C=590,
        min_inlet_temp_C=350,
        notes="Low-temperature Cs-promoted catalyst for Pass 4-5"
    ),
    "BASF O4-115": CatalystProperties(
        name="BASF O4-115",
        manufacturer="BASF",
        shape="Ring",
        nominal_size_mm=11.5,
        bulk_density_kg_m3=465,
        void_fraction=0.43,
        surface_area_m2_g=2.7,
        activity_fresh=1.06,
        activity_aged=0.86,
        max_temp_C=635,
        min_inlet_temp_C=382,
        notes="Standard V2O5/K2O catalyst"
    ),
    "BASF O4-116": CatalystProperties(
        name="BASF O4-116",
        manufacturer="BASF",
        shape="Ring",
        nominal_size_mm=10.0,
        bulk_density_kg_m3=455,
        void_fraction=0.45,
        surface_area_m2_g=3.1,
        activity_fresh=1.14,
        activity_aged=0.94,
        max_temp_C=605,
        min_inlet_temp_C=362,
        notes="Cs-promoted high-activity catalyst"
    ),
}

def get_catalyst(name: str) -> CatalystProperties:
    if name in CATALYST_DATABASE:
        return CATALYST_DATABASE[name]
    raise ValueError(f"Unknown catalyst: {name}. Available: {list(CATALYST_DATABASE.keys())}")

def get_catalyst_list() -> list:
    return list(CATALYST_DATABASE.keys())

def get_catalyst_info(name: str) -> dict:
    cat = get_catalyst(name)
    return {
        "name": cat.name,
        "manufacturer": cat.manufacturer,
        "shape": cat.shape,
        "nominal_size_mm": cat.nominal_size_mm,
        "bulk_density_kg_m3": cat.bulk_density_kg_m3,
        "void_fraction": cat.void_fraction,
        "surface_area_m2_g": cat.surface_area_m2_g,
        "activity_fresh": cat.activity_fresh,
        "activity_aged": cat.activity_aged,
        "max_temp_C": cat.max_temp_C,
        "min_inlet_temp_C": cat.min_inlet_temp_C,
        "notes": cat.notes
    }
