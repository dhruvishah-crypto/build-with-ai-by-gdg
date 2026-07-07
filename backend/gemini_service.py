import os
import json
import math
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types

logger = logging.getLogger("gemini_service")

# Haversine formula to compute distance between two lat/lng coordinates in km
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def calculate_heuristics_fallback(facilities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Fallback optimization algorithm representing core AI routing logic.
    Calculates stock warning, routes surplus drugs to nearest deficit centers,
    and identifies administrative flags.
    """
    logger.info("Computing heuristics fallback for district optimization.")
    
    stock_out_warnings = []
    redistribution_recommendations = []
    admin_flags = []

    # 1. Compute warnings & find surplus/deficit pools
    # structure: { medicine_name: [ { facility_id, surplus_qty } ] }
    surplus_pool = {}
    # structure: { medicine_name: [ { facility_id, deficit_qty } ] }
    deficit_pool = {}

    for fac in facilities:
        fac_id = fac.get("id")
        name = fac.get("name")
        inventory = fac.get("inventory", {})
        min_stock = fac.get("min_stock", {})
        
        # Check doctor absenteeism
        attendance = fac.get("doctor_attendance", {})
        total_docs = len(attendance)
        absent_docs = sum(1 for status in attendance.values() if status in ["Absent", "On Leave"])
        
        if total_docs > 0 and absent_docs == total_docs:
            admin_flags.append({
                "facility_id": fac_id,
                "facility_name": name,
                "type": "Doctor Absenteeism",
                "description": f"Critical: All {total_docs} doctors are absent ({', '.join(attendance.keys())}). No physician on duty.",
                "urgency": "Critical"
            })
        elif total_docs > 0 and (absent_docs / total_docs) >= 0.5:
            admin_flags.append({
                "facility_id": fac_id,
                "facility_name": name,
                "type": "Doctor Shortage",
                "description": f"Warning: {absent_docs} out of {total_docs} doctors are absent today.",
                "urgency": "High"
            })

        # Check beds availability
        beds = fac.get("beds", {})
        total_beds = beds.get("total", 0)
        avail_beds = beds.get("available", 0)
        if total_beds > 0 and avail_beds == 0:
            admin_flags.append({
                "facility_id": fac_id,
                "facility_name": name,
                "type": "Bed Occupancy",
                "description": "Alert: No hospital beds available. Capacity at 100%.",
                "urgency": "High"
            })

        # Check Stock levels
        for med, qty in inventory.items():
            min_val = min_stock.get(med, 0)
            if qty < min_val:
                deficit_qty = min_val - qty
                urgency = "High" if qty < (min_val * 0.2) else "Medium"
                
                # Estimate remaining days based on daily footfall
                # Assume 10% of visitors require this specific medicine
                daily_demand = max(1.0, fac.get("daily_footfall", 100) * 0.08)
                days_left = round(qty / daily_demand, 1)

                stock_out_warnings.append({
                    "facility_id": fac_id,
                    "facility_name": name,
                    "medicine": med,
                    "current_stock": qty,
                    "min_stock": min_val,
                    "days_remaining_estimate": days_left,
                    "urgency": urgency
                })
                
                if med not in deficit_pool:
                    deficit_pool[med] = []
                deficit_pool[med].append({
                    "facility_id": fac_id,
                    "facility_name": name,
                    "latitude": fac.get("latitude"),
                    "longitude": fac.get("longitude"),
                    "deficit_qty": deficit_qty
                })
            elif qty > min_val:
                surplus_qty = qty - min_val
                if surplus_qty > 20: # Only count significant surplus
                    if med not in surplus_pool:
                        surplus_pool[med] = []
                    surplus_pool[med].append({
                        "facility_id": fac_id,
                        "facility_name": name,
                        "latitude": fac.get("latitude"),
                        "longitude": fac.get("longitude"),
                        "surplus_qty": surplus_qty
                    })

    # 2. Match deficit with nearest surplus
    for med, deficits in deficit_pool.items():
        surpluses = surplus_pool.get(med, [])
        if not surpluses:
            continue
        
        for def_item in deficits:
            # Sort surpluses by distance to this deficit center
            def_lat, def_lng = def_item["latitude"], def_item["longitude"]
            
            scored_surpluses = []
            for sur_item in surpluses:
                dist = haversine_distance(def_lat, def_lng, sur_item["latitude"], sur_item["longitude"])
                scored_surpluses.append((dist, sur_item))
            
            scored_surpluses.sort(key=lambda x: x[0]) # Ascending by distance
            
            # Formulate transfer recommendations from nearest surplus facilities
            needed = def_item["deficit_qty"]
            for dist, sur_item in scored_surpluses:
                if needed <= 0 or sur_item["surplus_qty"] <= 0:
                    continue
                
                transfer_qty = min(needed, sur_item["surplus_qty"])
                sur_item["surplus_qty"] -= transfer_qty
                needed -= transfer_qty
                
                redistribution_recommendations.append({
                    "from_facility_id": sur_item["facility_id"],
                    "from_facility_name": sur_item["facility_name"],
                    "to_facility_id": def_item["facility_id"],
                    "to_facility_name": def_item["facility_name"],
                    "medicine": med,
                    "transfer_quantity": int(transfer_qty),
                    "distance_km": dist,
                    "reason": f"Redistribute surplus {med} to cover deficit ({def_item['facility_name']} needs {def_item['deficit_qty']})."
                })

    return {
        "stock_out_warnings": stock_out_warnings,
        "redistribution_recommendations": redistribution_recommendations,
        "admin_flags": admin_flags
    }

def analyze_district_state(facilities: List[Dict[str, Any]], active_transfers: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Feeds district operational state to Gemini for generating optimization decisions,
    or falls back to heuristics optimization model.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        logger.info("GEMINI_API_KEY environment variable not found. Using local optimization algorithms.")
        return calculate_heuristics_fallback(facilities)
    
    try:
        # Initialize Google GenAI Client
        # The new Google GenAI SDK imports 'genai' client.
        client = genai.Client()
        
        prompt = f"""
You are a public health supply chain optimization model for a district.
Given the operational database of clinics (facilities) and active transfers:

FACILITIES DATABASE:
{json.dumps(facilities, indent=2)}

ACTIVE TRANSFERS:
{json.dumps(active_transfers or [], indent=2)}

Compute the following three segments and return them strictly in JSON format matching the schema below.
Ensure you calculate distances between facilities logically (using coordinates to see which is closer).
Prefer routing medicines from a closer surplus facility over a farther one.

JSON Schema Output:
{{
  "stock_out_warnings": [
    {{
      "facility_id": "string",
      "facility_name": "string",
      "medicine": "string",
      "current_stock": number,
      "min_stock": number,
      "days_remaining_estimate": number,
      "urgency": "High" | "Medium"
    }}
  ],
  "redistribution_recommendations": [
    {{
      "from_facility_id": "string",
      "from_facility_name": "string",
      "to_facility_id": "string",
      "to_facility_name": "string",
      "medicine": "string",
      "transfer_quantity": number,
      "distance_km": number,
      "reason": "string"
    }}
  ],
  "admin_flags": [
    {{
      "facility_id": "string",
      "facility_name": "string",
      "type": "Doctor Absenteeism" | "Doctor Shortage" | "Bed Occupancy" | "Stock Depletion",
      "description": "string",
      "urgency": "Critical" | "High"
    }}
  ]
}}

Reasoning Guidelines:
- Warnings: Include medicines where current_stock is below min_stock. Calculate remaining days using current stock and daily footfall estimates.
- Recommendations: Resolve shortages by moving stocks from nearby clinics that have active inventory exceeding their min_stock.
- Admin Flags: Trigger flags when all doctors are absent (Doctor Absenteeism), >50% doctors are absent (Doctor Shortage), available beds are 0 (Bed Occupancy), or several vital medications are depleted.
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        result_text = response.text.strip()
        parsed_result = json.loads(result_text)
        logger.info("Successfully received optimization response from Gemini API.")
        return parsed_result
        
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}. Reverting to local heuristic optimizations.")
        return calculate_heuristics_fallback(facilities)
