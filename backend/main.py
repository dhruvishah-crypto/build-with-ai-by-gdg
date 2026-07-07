import os
import uuid
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db
from gemini_service import analyze_district_state
from audio_service import transcribe_and_translate_audio
from vision_service import parse_manifest_image
from analytics_service import evaluate_facilities_performance

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title="Smart Health District Optimization API",
    description="Backend API optimizing clinic resources, doctor presence, and stocks across PHCs and CHCs.",
    version="1.0.0"
)

# Enable CORS for the React development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Schemas
class AttendanceUpdate(BaseModel):
    doctor_name: str
    status: str  # "Present", "Absent", "On Leave"

class InventoryUpdate(BaseModel):
    inventory: Dict[str, int]

class BedUpdate(BaseModel):
    total: int
    available: int

class TransferRequest(BaseModel):
    from_facility_id: str
    to_facility_id: str
    medicine: str
    quantity: int

# Endpoints
@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Smart Health Platform API"}

# 1. GET Facilities
@app.get("/api/facilities")
def get_facilities():
    try:
        db = get_db()
        docs = db.collection("facilities").get()
        facilities_list = [doc.to_dict() for doc in docs]
        return facilities_list
    except Exception as e:
        logger.error(f"Error fetching facilities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 2. GET Facility by ID
@app.get("/api/facilities/{facility_id}")
def get_facility(facility_id: str):
    try:
        db = get_db()
        doc = db.collection("facilities").document(facility_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Facility not found")
        return doc.to_dict()
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching facility {facility_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 3. PUT Update Attendance
@app.put("/api/facilities/{facility_id}/attendance")
def update_attendance(facility_id: str, update_data: AttendanceUpdate):
    try:
        db = get_db()
        doc_ref = db.collection("facilities").document(facility_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Facility not found")
        
        facility = doc.to_dict()
        attendance = facility.get("doctor_attendance", {})
        attendance[update_data.doctor_name] = update_data.status
        
        doc_ref.update({"doctor_attendance": attendance})
        return {"message": "Attendance updated successfully", "doctor_attendance": attendance}
    except Exception as e:
        logger.error(f"Error updating attendance for {facility_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. PUT Update Inventory
@app.put("/api/facilities/{facility_id}/inventory")
def update_inventory(facility_id: str, update_data: InventoryUpdate):
    try:
        db = get_db()
        doc_ref = db.collection("facilities").document(facility_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Facility not found")
            
        facility = doc.to_dict()
        inventory = facility.get("inventory", {})
        
        # Merge values
        for med, qty in update_data.inventory.items():
            inventory[med] = qty
            
        doc_ref.update({"inventory": inventory})
        return {"message": "Inventory updated successfully", "inventory": inventory}
    except Exception as e:
        logger.error(f"Error updating inventory for {facility_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 5. PUT Update Beds
@app.put("/api/facilities/{facility_id}/beds")
def update_beds(facility_id: str, update_data: BedUpdate):
    try:
        db = get_db()
        doc_ref = db.collection("facilities").document(facility_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Facility not found")
            
        doc_ref.update({"beds": {"total": update_data.total, "available": update_data.available}})
        return {"message": "Bed occupancy details updated successfully"}
    except Exception as e:
        logger.error(f"Error updating beds for {facility_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 6. GET Live optimization routing recommendations and stock out warnings
@app.get("/api/optimization")
def get_optimization_report():
    try:
        db = get_db()
        facilities_docs = db.collection("facilities").get()
        facilities = [doc.to_dict() for doc in facilities_docs]
        
        transfers_docs = db.collection("inventory_transfers").get()
        transfers = [doc.to_dict() for doc in transfers_docs]
        
        report = analyze_district_state(facilities, transfers)
        return report
    except Exception as e:
        logger.error(f"Error generating optimization report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 7. GET Transfers
@app.get("/api/transfers")
def get_transfers():
    try:
        db = get_db()
        docs = db.collection("inventory_transfers").get()
        transfers_list = [doc.to_dict() for doc in docs]
        # Sort transfers by timestamp (newest first)
        transfers_list.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return transfers_list
    except Exception as e:
        logger.error(f"Error fetching transfers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 8. POST Request Transfer
@app.post("/api/transfers")
def request_transfer(transfer: TransferRequest):
    try:
        db = get_db()
        
        # Verify both facilities exist
        from_doc = db.collection("facilities").document(transfer.from_facility_id).get()
        to_doc = db.collection("facilities").document(transfer.to_facility_id).get()
        
        if not from_doc.exists or not to_doc.exists:
            raise HTTPException(status_code=400, detail="One or both facilities do not exist.")
            
        transfer_id = f"transfer_{uuid.uuid4().hex[:8]}"
        from_fac = from_doc.to_dict()
        to_fac = to_doc.to_dict()
        
        transfer_doc = {
            "id": transfer_id,
            "from_facility_id": transfer.from_facility_id,
            "from_facility_name": from_fac.get("name"),
            "to_facility_id": transfer.to_facility_id,
            "to_facility_name": to_fac.get("name"),
            "medicine": transfer.medicine,
            "quantity": transfer.quantity,
            "status": "Pending",
            "timestamp": "2026-07-07T10:10:00Z"  # Standard current time
        }
        
        db.collection("inventory_transfers").document(transfer_id).set(transfer_doc)
        return transfer_doc
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error requesting transfer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 9. POST Approve Transfer
@app.post("/api/transfers/{transfer_id}/approve")
def approve_transfer(transfer_id: str):
    try:
        db = get_db()
        transfer_ref = db.collection("inventory_transfers").document(transfer_id)
        transfer_doc = transfer_ref.get()
        
        if not transfer_doc.exists:
            raise HTTPException(status_code=404, detail="Transfer record not found.")
            
        transfer = transfer_doc.to_dict()
        if transfer.get("status") == "Approved":
            return {"message": "Transfer was already approved and completed.", "transfer": transfer}
            
        from_id = transfer["from_facility_id"]
        to_id = transfer["to_facility_id"]
        medicine = transfer["medicine"]
        qty = transfer["quantity"]
        
        # Load facilities
        from_ref = db.collection("facilities").document(from_id)
        to_ref = db.collection("facilities").document(to_id)
        
        from_doc = from_ref.get()
        to_doc = to_ref.get()
        
        if not from_doc.exists or not to_doc.exists:
            raise HTTPException(status_code=400, detail="Facilities for this transfer no longer exist.")
            
        from_fac = from_doc.to_dict()
        to_fac = to_doc.to_dict()
        
        from_inventory = from_fac.get("inventory", {})
        to_inventory = to_fac.get("inventory", {})
        
        # Check if source facility has enough stock
        current_source_stock = from_inventory.get(medicine, 0)
        if current_source_stock < qty:
            raise HTTPException(status_code=400, detail=f"Insufficient inventory at source facility. Current: {current_source_stock}, Requested: {qty}")
            
        # Update stock
        from_inventory[medicine] = current_source_stock - qty
        to_inventory[medicine] = to_inventory.get(medicine, 0) + qty
        
        # Write back changes
        from_ref.update({"inventory": from_inventory})
        to_ref.update({"inventory": to_inventory})
        
        # Mark transfer approved
        transfer["status"] = "Approved"
        transfer_ref.update({"status": "Approved"})
        
        logger.info(f"Approved Transfer {transfer_id}: Moved {qty} of {medicine} from {from_id} to {to_id}.")
        return {"message": "Transfer approved and inventory levels adjusted successfully.", "transfer": transfer}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error approving transfer {transfer_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 10. POST Voice Note Processing
@app.post("/api/voice-report")
async def process_voice_report(audio: UploadFile = File(...)):
    try:
        content = await audio.read()
        filename = audio.filename
        
        report_result = transcribe_and_translate_audio(content, filename)
        return report_result
    except Exception as e:
        logger.error(f"Error parsing audio report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 11. POST Manifest Photo Upload
@app.post("/api/manifest-upload")
async def upload_manifest_photo(image: UploadFile = File(...)):
    try:
        content = await image.read()
        extracted_inventory = parse_manifest_image(content)
        return {
            "message": "Manifest processed successfully",
            "extracted_inventory": extracted_inventory
        }
    except Exception as e:
        logger.error(f"Error processing manifest image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 12. GET BigQuery/NFHS Demographic Joined Analytics
@app.get("/api/analytics")
def get_joined_analytics():
    try:
        db = get_db()
        docs = db.collection("facilities").get()
        facilities_list = [doc.to_dict() for doc in docs]
        
        analytics_report = evaluate_facilities_performance(facilities_list)
        return analytics_report
    except Exception as e:
        logger.error(f"Error compiling demographics analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
