import os
import sys
from database import get_db

def seed_database():
    db = get_db()
    print("Starting database seeding...")

    facilities = {
        "phc_gachibowli": {
            "id": "phc_gachibowli",
            "name": "Gachibowli Primary Health Centre",
            "type": "PHC",
            "latitude": 17.4483,
            "longitude": 78.3741,
            "district": "Rangareddy",
            "doctor_attendance": {
                "Dr. A. Srinivas": "Present",
                "Dr. P. Radhika": "Absent",
                "Dr. K. Naresh": "Present"
            },
            "beds": {
                "total": 10,
                "available": 3
            },
            "inventory": {
                "Paracetamol (500mg)": 80,       # Deficit (min is 200)
                "Amoxicillin (250mg)": 300,      # Surplus (min is 150)
                "ORS Packets": 40,               # Deficit (min is 100)
                "Insulin Vials": 5,              # Deficit (min is 20)
                "Metformin (500mg)": 250,        # Surplus (min is 150)
                "Ibuprofen (400mg)": 90          # Deficit (min is 100)
            },
            "min_stock": {
                "Paracetamol (500mg)": 200,
                "Amoxicillin (250mg)": 150,
                "ORS Packets": 100,
                "Insulin Vials": 20,
                "Metformin (500mg)": 150,
                "Ibuprofen (400mg)": 100
            },
            "daily_footfall": 120,
            "rating": 4.1
        },
        "phc_charminar": {
            "id": "phc_charminar",
            "name": "Charminar Primary Health Centre",
            "type": "PHC",
            "latitude": 17.3616,
            "longitude": 78.4747,
            "district": "Hyderabad",
            "doctor_attendance": {
                "Dr. M. A. Rahaman": "Absent",
                "Dr. Fatima Begum": "Absent"
            },
            "beds": {
                "total": 8,
                "available": 2
            },
            "inventory": {
                "Paracetamol (500mg)": 650,      # Surplus
                "Amoxicillin (250mg)": 50,       # Deficit (min is 150)
                "ORS Packets": 300,              # Surplus
                "Insulin Vials": 35,             # Surplus
                "Metformin (500mg)": 40,         # Deficit (min is 150)
                "Ibuprofen (400mg)": 300         # Surplus
            },
            "min_stock": {
                "Paracetamol (500mg)": 200,
                "Amoxicillin (250mg)": 150,
                "ORS Packets": 100,
                "Insulin Vials": 20,
                "Metformin (500mg)": 150,
                "Ibuprofen (400mg)": 100
            },
            "daily_footfall": 190,
            "rating": 3.8
        },
        "phc_uppal": {
            "id": "phc_uppal",
            "name": "Uppal Primary Health Centre",
            "type": "PHC",
            "latitude": 17.4019,
            "longitude": 78.5602,
            "district": "Medchal-Malkajgiri",
            "doctor_attendance": {
                "Dr. S. K. Rao": "Present",
                "Dr. Lakshmi Devi": "Present"
            },
            "beds": {
                "total": 12,
                "available": 8
            },
            "inventory": {
                "Paracetamol (500mg)": 10,       # Critical Deficit (min is 250)
                "Amoxicillin (250mg)": 80,       # Deficit
                "ORS Packets": 20,               # Critical Deficit
                "Insulin Vials": 2,              # Critical Deficit
                "Metformin (500mg)": 300,        # Surplus
                "Ibuprofen (400mg)": 15           # Critical Deficit
            },
            "min_stock": {
                "Paracetamol (500mg)": 250,
                "Amoxicillin (250mg)": 150,
                "ORS Packets": 120,
                "Insulin Vials": 25,
                "Metformin (500mg)": 150,
                "Ibuprofen (400mg)": 100
            },
            "daily_footfall": 150,
            "rating": 4.3
        },
        "chc_kondapur": {
            "id": "chc_kondapur",
            "name": "Kondapur Community Health Centre",
            "type": "CHC",
            "latitude": 17.4622,
            "longitude": 78.3568,
            "district": "Rangareddy",
            "doctor_attendance": {
                "Dr. J. Geetha": "Present",
                "Dr. V. Prasad": "Present",
                "Dr. R. K. Sen": "Present",
                "Dr. N. Swetha": "Present"
            },
            "beds": {
                "total": 35,
                "available": 14
            },
            "inventory": {
                "Paracetamol (500mg)": 1200,     # Huge Surplus (min is 500)
                "Amoxicillin (250mg)": 450,      # Surplus
                "ORS Packets": 800,              # Huge Surplus (min is 300)
                "Insulin Vials": 100,            # Huge Surplus (min is 50)
                "Metformin (500mg)": 600,        # Surplus
                "Ibuprofen (400mg)": 500         # Surplus
            },
            "min_stock": {
                "Paracetamol (500mg)": 500,
                "Amoxicillin (250mg)": 300,
                "ORS Packets": 300,
                "Insulin Vials": 50,
                "Metformin (500mg)": 300,
                "Ibuprofen (400mg)": 250
            },
            "daily_footfall": 320,
            "rating": 4.5
        },
        "chc_nampally": {
            "id": "chc_nampally",
            "name": "Nampally Community Health Centre",
            "type": "CHC",
            "latitude": 17.3888,
            "longitude": 78.4682,
            "district": "Hyderabad",
            "doctor_attendance": {
                "Dr. Imran Khan": "Present",
                "Dr. S. Siddharth": "Absent",
                "Dr. Mary John": "Present"
            },
            "beds": {
                "total": 30,
                "available": 5
            },
            "inventory": {
                "Paracetamol (500mg)": 150,      # Deficit
                "Amoxicillin (250mg)": 120,      # Deficit
                "ORS Packets": 180,              # Deficit
                "Insulin Vials": 15,             # Deficit
                "Metformin (500mg)": 80,         # Deficit
                "Ibuprofen (400mg)": 450         # Surplus (min is 250)
            },
            "min_stock": {
                "Paracetamol (500mg)": 400,
                "Amoxicillin (250mg)": 300,
                "ORS Packets": 250,
                "Insulin Vials": 40,
                "Metformin (500mg)": 250,
                "Ibuprofen (400mg)": 250
            },
            "daily_footfall": 280,
            "rating": 3.9
        }
    }

    # Write facilities
    for facility_id, facility_data in facilities.items():
        db.collection("facilities").document(facility_id).set(facility_data)
        print(f"Seeded facility: {facility_data['name']}")

    # Write a test inventory transfer record
    test_transfer = {
        "id": "transfer_001",
        "from_facility_id": "chc_kondapur",
        "to_facility_id": "phc_gachibowli",
        "medicine": "Paracetamol (500mg)",
        "quantity": 150,
        "status": "Pending",
        "timestamp": "2026-07-07T10:00:00Z"
    }
    db.collection("inventory_transfers").document("transfer_001").set(test_transfer)
    print("Seeded test inventory transfer.")
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
