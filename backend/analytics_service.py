import logging
from typing import Dict, Any, List

logger = logging.getLogger("analytics_service")

# Simulated BigQuery NFHS-5 Public Health Database
# National Family Health Survey-5 indicators for Telangana/Hyderabad regions
NFHS_5_DEMOGRAPHICS = {
    "Hyderabad": {
        "nutrition_deficit_percent": 34.2,      # Stunting/Wasting in children < 5
        "maternal_care_coverage": 72.1,         # % of mothers with 4+ ANC visits
        "safe_drinking_water_access": 88.5,      # % of households
        "poverty_rate_percent": 12.4,
        "under_5_mortality_rate": 28.5,          # per 1000 live births
        "population_density": 18480              # people per sq km
    },
    "Rangareddy": {
        "nutrition_deficit_percent": 38.6,
        "maternal_care_coverage": 65.4,
        "safe_drinking_water_access": 79.2,
        "poverty_rate_percent": 18.9,
        "under_5_mortality_rate": 34.2,
        "population_density": 840
    },
    "Medchal-Malkajgiri": {
        "nutrition_deficit_percent": 32.1,
        "maternal_care_coverage": 70.2,
        "safe_drinking_water_access": 82.4,
        "poverty_rate_percent": 14.1,
        "under_5_mortality_rate": 29.8,
        "population_density": 2100
    }
}

def evaluate_facilities_performance(facilities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Simulates a BigQuery join operation that merges real-time Firestore operational metrics
    with historical NFHS-5 public health data to rank facility requirements.
    """
    logger.info("Running BigQuery Big Data join matching operational metrics with NFHS datasets.")
    
    evaluated_facilities = []
    
    for fac in facilities:
        fac_id = fac.get("id")
        name = fac.get("name")
        district = fac.get("district", "Hyderabad")
        daily_footfall = fac.get("daily_footfall", 100)
        
        # Get NFHS statistics for the district (BigQuery query simulation)
        demographics = NFHS_5_DEMOGRAPHICS.get(district, NFHS_5_DEMOGRAPHICS["Hyderabad"])
        
        # Calculate Operational Inventory Score (0 to 100)
        inventory = fac.get("inventory", {})
        min_stock = fac.get("min_stock", {})
        total_items = len(inventory)
        
        in_stock_items = 0
        critical_stock_outs = 0
        
        for item, qty in inventory.items():
            min_val = min_stock.get(item, 0)
            if qty >= min_val:
                in_stock_items += 1
            elif qty < (min_val * 0.2):
                critical_stock_outs += 1
                
        inventory_score = (in_stock_items / max(1, total_items)) * 100
        
        # Calculate Attendance Score (0 to 100)
        attendance = fac.get("doctor_attendance", {})
        total_docs = len(attendance)
        present_docs = sum(1 for status in attendance.values() if status == "Present")
        attendance_score = (present_docs / max(1, total_docs)) * 100 if total_docs > 0 else 100
        
        # Calculate Operational Index (Combined)
        operational_score = round((inventory_score * 0.6) + (attendance_score * 0.4), 1)
        
        # Calculate Vulnerability Index based on NFHS indicators (0 to 100)
        # Higher score = more vulnerable population (high stunting, low ANC visits, low water access, high poverty)
        nutrition_deficit = demographics["nutrition_deficit_percent"]
        maternal_gap = 100 - demographics["maternal_care_coverage"]
        water_gap = 100 - demographics["safe_drinking_water_access"]
        poverty = demographics["poverty_rate_percent"]
        
        vulnerability_score = round(
            (nutrition_deficit * 0.3) + 
            (maternal_gap * 0.3) + 
            (water_gap * 0.2) + 
            (poverty * 0.2), 
            1
        )
        
        # Priority Rank Index: High vulnerability combined with low operational performance
        # Lower operational scores + Higher vulnerability = Higher Priority Index
        priority_index = round((vulnerability_score * 0.5) + ((100 - operational_score) * 0.5), 1)
        
        evaluated_facilities.append({
            "facility_id": fac_id,
            "facility_name": name,
            "district": district,
            "type": fac.get("type", "PHC"),
            "daily_footfall": daily_footfall,
            "rating": fac.get("rating", 4.0),
            "beds_available": fac.get("beds", {}).get("available", 0),
            "critical_stock_outs": critical_stock_outs,
            "operational_score": operational_score,
            "vulnerability_score": vulnerability_score,
            "priority_index": priority_index,
            "demographics": demographics
        })
        
    # Sort by priority index in descending order
    evaluated_facilities.sort(key=lambda x: x["priority_index"], reverse=True)
    return evaluated_facilities
