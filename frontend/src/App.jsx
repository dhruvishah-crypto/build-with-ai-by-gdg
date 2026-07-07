import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, MapPin, AlertTriangle, TrendingUp, Truck, UserCheck, 
  Volume2, Camera, CheckCircle, RefreshCw, FileText, UploadCloud, 
  ShieldAlert, Sparkles, Clock, ArrowRight, Grid, Map, User, Server, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'staff'
  const [facilities, setFacilities] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [optimization, setOptimization] = useState({
    stock_out_warnings: [],
    redistribution_recommendations: [],
    admin_flags: []
  });
  const [analytics, setAnalytics] = useState([]);
  
  // App-wide loading & status states
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('connecting'); // 'connecting', 'online', 'offline'
  
  // Staff Portal Form State
  const [selectedFacilityId, setSelectedFacilityId] = useState('phc_gachibowli');
  const [attendanceLogs, setAttendanceLogs] = useState({});
  const [inventoryForm, setInventoryForm] = useState({
    "Paracetamol (500mg)": 0,
    "Amoxicillin (250mg)": 0,
    "ORS Packets": 0,
    "Insulin Vials": 0,
    "Metformin (500mg)": 0,
    "Ibuprofen (400mg)": 0
  });
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [voicePreset, setVoicePreset] = useState('');
  
  // Vision manifest state
  const [manifestResult, setManifestResult] = useState(null);
  const [manifestImage, setManifestImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Admin selected facility for detail view
  const [selectedAdminFac, setSelectedAdminFac] = useState(null);

  // Load dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Test Backend Connection
      const healthRes = await fetch(`${API_BASE}/`);
      if (healthRes.ok) {
        setBackendStatus('online');
        
        // Fetch Facilities
        const facRes = await fetch(`${API_BASE}/api/facilities`);
        const facData = await facRes.json();
        setFacilities(facData);
        if (facData.length > 0 && !selectedAdminFac) {
          setSelectedAdminFac(facData[0]);
        }
        
        // Fetch Transfers
        const transRes = await fetch(`${API_BASE}/api/transfers`);
        const transData = await transRes.json();
        setTransfers(transData);
        
        // Fetch Optimization Report
        const optRes = await fetch(`${API_BASE}/api/optimization`);
        const optData = await optRes.json();
        setOptimization(optData);
        
        // Fetch Analytics
        const analyticsRes = await fetch(`${API_BASE}/api/analytics`);
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } else {
        throw new Error('Backend responded with error status');
      }
    } catch (err) {
      console.warn('FastAPI server is not responding. Activating browser simulation fallback...', err);
      setBackendStatus('offline');
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update selected facility form when facility dropdown changes
  useEffect(() => {
    if (facilities.length > 0) {
      const facility = facilities.find(f => f.id === selectedFacilityId);
      if (facility) {
        setAttendanceLogs(facility.doctor_attendance || {});
        setInventoryForm(facility.inventory || {});
      }
    }
  }, [selectedFacilityId, facilities]);

  // Load offline mock data
  const loadMockData = () => {
    // Mimics initial backend values for direct browser evaluation
    const mockFacilities = [
      {
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
        "beds": { "total": 10, "available": 3 },
        "inventory": {
          "Paracetamol (500mg)": 80,
          "Amoxicillin (250mg)": 300,
          "ORS Packets": 40,
          "Insulin Vials": 5,
          "Metformin (500mg)": 250,
          "Ibuprofen (400mg)": 90
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
      {
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
        "beds": { "total": 8, "available": 2 },
        "inventory": {
          "Paracetamol (500mg)": 650,
          "Amoxicillin (250mg)": 50,
          "ORS Packets": 300,
          "Insulin Vials": 35,
          "Metformin (500mg)": 40,
          "Ibuprofen (400mg)": 300
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
      {
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
        "beds": { "total": 12, "available": 8 },
        "inventory": {
          "Paracetamol (500mg)": 10,
          "Amoxicillin (250mg)": 80,
          "ORS Packets": 20,
          "Insulin Vials": 2,
          "Metformin (500mg)": 300,
          "Ibuprofen (400mg)": 15
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
      {
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
        "beds": { "total": 35, "available": 14 },
        "inventory": {
          "Paracetamol (500mg)": 1200,
          "Amoxicillin (250mg)": 450,
          "ORS Packets": 800,
          "Insulin Vials": 100,
          "Metformin (500mg)": 600,
          "Ibuprofen (400mg)": 500
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
      {
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
        "beds": { "total": 30, "available": 5 },
        "inventory": {
          "Paracetamol (500mg)": 150,
          "Amoxicillin (250mg)": 120,
          "ORS Packets": 180,
          "Insulin Vials": 15,
          "Metformin (500mg)": 80,
          "Ibuprofen (400mg)": 450
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
    ];

    const mockTransfers = [
      {
        "id": "transfer_001",
        "from_facility_id": "chc_kondapur",
        "from_facility_name": "Kondapur Community Health Centre",
        "to_facility_id": "phc_gachibowli",
        "to_facility_name": "Gachibowli Primary Health Centre",
        "medicine": "Paracetamol (500mg)",
        "quantity": 150,
        "status": "Pending",
        "timestamp": "2026-07-07T10:00:00Z"
      }
    ];

    const mockOptimization = {
      "stock_out_warnings": [
        { "facility_id": "phc_uppal", "facility_name": "Uppal Primary Health Centre", "medicine": "Paracetamol (500mg)", "current_stock": 10, "min_stock": 250, "days_remaining_estimate": 0.8, "urgency": "High" },
        { "facility_id": "phc_uppal", "facility_name": "Uppal Primary Health Centre", "medicine": "ORS Packets", "current_stock": 20, "min_stock": 120, "days_remaining_estimate": 1.6, "urgency": "High" },
        { "facility_id": "phc_gachibowli", "facility_name": "Gachibowli Primary Health Centre", "medicine": "Paracetamol (500mg)", "current_stock": 80, "min_stock": 200, "days_remaining_estimate": 8.3, "urgency": "Medium" },
        { "facility_id": "phc_charminar", "facility_name": "Charminar Primary Health Centre", "medicine": "Amoxicillin (250mg)", "current_stock": 50, "min_stock": 150, "days_remaining_estimate": 3.3, "urgency": "Medium" }
      ],
      "redistribution_recommendations": [
        { "from_facility_id": "chc_kondapur", "from_facility_name": "Kondapur Community Health Centre", "to_facility_id": "phc_gachibowli", "to_facility_name": "Gachibowli Primary Health Centre", "medicine": "Paracetamol (500mg)", "transfer_quantity": 120, "distance_km": 2.4, "reason": "Kondapur has surplus Paracetamol (1200 units), Gachibowli needs 120 units to hit min stock." },
        { "from_facility_id": "phc_charminar", "from_facility_name": "Charminar Primary Health Centre", "to_facility_id": "phc_uppal", "to_facility_name": "Uppal Primary Health Centre", "medicine": "ORS Packets", "transfer_quantity": 100, "distance_km": 10.3, "reason": "Charminar has surplus ORS (300 units), Uppal needs 100 units." },
        { "from_facility_id": "chc_kondapur", "from_facility_name": "Kondapur Community Health Centre", "to_facility_id": "phc_uppal", "to_facility_name": "Uppal Primary Health Centre", "medicine": "Paracetamol (500mg)", "transfer_quantity": 240, "distance_km": 23.1, "reason": "Kondapur has massive surplus, Uppal has only 10 units." }
      ],
      "admin_flags": [
        { "facility_id": "phc_charminar", "facility_name": "Charminar Primary Health Centre", "type": "Doctor Absenteeism", "description": "Critical: All 2 scheduled doctors are Absent (Dr. M. A. Rahaman, Dr. Fatima Begum). No medical staff present.", "urgency": "Critical" },
        { "facility_id": "chc_nampally", "facility_name": "Nampally Community Health Centre", "type": "Bed Occupancy", "description": "Warning: Available beds critical (5 remaining out of 30 capacity).", "urgency": "High" }
      ]
    };

    const mockAnalytics = [
      {
        "facility_id": "phc_uppal",
        "facility_name": "Uppal Primary Health Centre",
        "district": "Medchal-Malkajgiri",
        "type": "PHC",
        "daily_footfall": 150,
        "rating": 4.3,
        "beds_available": 8,
        "critical_stock_outs": 4,
        "operational_score": 52.0,
        "vulnerability_score": 46.5,
        "priority_index": 77.3,
        "demographics": { "nutrition_deficit_percent": 32.1, "maternal_care_coverage": 70.2, "safe_drinking_water_access": 82.4, "poverty_rate_percent": 14.1, "under_5_mortality_rate": 29.8, "population_density": 2100 }
      },
      {
        "facility_id": "phc_gachibowli",
        "facility_name": "Gachibowli Primary Health Centre",
        "district": "Rangareddy",
        "type": "PHC",
        "daily_footfall": 120,
        "rating": 4.1,
        "beds_available": 3,
        "critical_stock_outs": 3,
        "operational_score": 66.7,
        "vulnerability_score": 51.1,
        "priority_index": 67.2,
        "demographics": { "nutrition_deficit_percent": 38.6, "maternal_care_coverage": 65.4, "safe_drinking_water_access": 79.2, "poverty_rate_percent": 18.9, "under_5_mortality_rate": 34.2, "population_density": 840 }
      },
      {
        "facility_id": "phc_charminar",
        "facility_name": "Charminar Primary Health Centre",
        "district": "Hyderabad",
        "type": "PHC",
        "daily_footfall": 190,
        "rating": 3.8,
        "beds_available": 2,
        "critical_stock_outs": 1,
        "operational_score": 30.0,
        "vulnerability_score": 44.5,
        "priority_index": 57.3,
        "demographics": { "nutrition_deficit_percent": 34.2, "maternal_care_coverage": 72.1, "safe_drinking_water_access": 88.5, "poverty_rate_percent": 12.4, "under_5_mortality_rate": 28.5, "population_density": 18480 }
      },
      {
        "facility_id": "chc_nampally",
        "facility_name": "Nampally Community Health Centre",
        "district": "Hyderabad",
        "type": "CHC",
        "daily_footfall": 280,
        "rating": 3.9,
        "beds_available": 5,
        "critical_stock_outs": 5,
        "operational_score": 56.7,
        "vulnerability_score": 44.5,
        "priority_index": 43.9,
        "demographics": { "nutrition_deficit_percent": 34.2, "maternal_care_coverage": 72.1, "safe_drinking_water_access": 88.5, "poverty_rate_percent": 12.4, "under_5_mortality_rate": 28.5, "population_density": 18480 }
      },
      {
        "facility_id": "chc_kondapur",
        "facility_name": "Kondapur Community Health Centre",
        "district": "Rangareddy",
        "type": "CHC",
        "daily_footfall": 320,
        "rating": 4.5,
        "beds_available": 14,
        "critical_stock_outs": 0,
        "operational_score": 100.0,
        "vulnerability_score": 51.1,
        "priority_index": 25.6,
        "demographics": { "nutrition_deficit_percent": 38.6, "maternal_care_coverage": 65.4, "safe_drinking_water_access": 79.2, "poverty_rate_percent": 18.9, "under_5_mortality_rate": 34.2, "population_density": 840 }
      }
    ];

    setFacilities(mockFacilities);
    setTransfers(mockTransfers);
    setOptimization(mockOptimization);
    setAnalytics(mockAnalytics);
    setSelectedAdminFac(mockFacilities[0]);
  };

  // STAFF PORTAL: Submit Attendance Update
  const handleAttendanceChange = async (docName, status) => {
    const updatedLogs = { ...attendanceLogs, [docName]: status };
    setAttendanceLogs(updatedLogs);

    if (backendStatus === 'online') {
      try {
        const response = await fetch(`${API_BASE}/api/facilities/${selectedFacilityId}/attendance`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doctor_name: docName, status })
        });
        if (response.ok) {
          fetchData();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Simulate locally
      const updatedFacilities = facilities.map(fac => {
        if (fac.id === selectedFacilityId) {
          return { ...fac, doctor_attendance: updatedLogs };
        }
        return fac;
      });
      setFacilities(updatedFacilities);
      recalculateSimulation(updatedFacilities, transfers);
    }
  };

  // STAFF PORTAL: Submit Inventory form updates
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    if (backendStatus === 'online') {
      try {
        const response = await fetch(`${API_BASE}/api/facilities/${selectedFacilityId}/inventory`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventory: inventoryForm })
        });
        if (response.ok) {
          alert("Inventory saved successfully!");
          fetchData();
        }
      } catch (err) {
        alert("Failed to save inventory.");
      }
    } else {
      // Simulate locally
      const updatedFacilities = facilities.map(fac => {
        if (fac.id === selectedFacilityId) {
          return { ...fac, inventory: inventoryForm };
        }
        return fac;
      });
      setFacilities(updatedFacilities);
      recalculateSimulation(updatedFacilities, transfers);
      alert("Inventory synced successfully (local emulation)!");
    }
  };

  // STAFF PORTAL: Simulate Regional Voice Notes
  const handleSimulateVoice = async (presetType) => {
    setIsRecording(true);
    setVoicePreset(presetType);
    
    // Create pre-baked simulated voice file payload
    const dummyBlob = new Blob([new Uint8Array(presetType === 'hi' ? 1000 : 1500)], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', dummyBlob, presetType === 'hi' ? 'hindi_report.wav' : 'telugu_report.wav');

    // Wait a brief second to mimic recording
    setTimeout(async () => {
      setIsRecording(false);
      if (backendStatus === 'online') {
        try {
          const response = await fetch(`${API_BASE}/api/voice-report`, {
            method: 'POST',
            body: formData
          });
          const result = await response.json();
          setVoiceResult(result);
        } catch (err) {
          console.error(err);
        }
      } else {
        // Mock translate
        if (presetType === 'hi') {
          setVoiceResult({
            detected_language: "hi",
            original_transcript: "हमारे यहाँ पेरासिटामोल खत्म हो गया है और आज दो डॉक्टर अनुपस्थित हैं।",
            translated_text: "We have run out of paracetamol here and two doctors are absent today.",
            confidence: 0.95
          });
        } else {
          setVoiceResult({
            detected_language: "te",
            original_transcript: "మాకు వెంటనే ఇన్సులిన్ మరియు ఒఆర్ఎస్ ప్యాకెట్లు కావాలి, స్టాక్ తక్కువగా ఉంది.",
            translated_text: "We need insulin and ORS packets immediately, the stock is running low.",
            confidence: 0.92
          });
        }
      }
    }, 1500);
  };

  // STAFF PORTAL: Handle manifest Image Upload (Vision counting)
  const handleManifestUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setManifestImage(file);
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append('image', file);

    if (backendStatus === 'online') {
      try {
        const response = await fetch(`${API_BASE}/api/manifest-upload`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        setManifestResult(data.extracted_inventory);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      // Offline Simulation
      setTimeout(() => {
        setManifestResult({
          "Paracetamol (500mg)": 240,
          "ORS Packets": 150,
          "Ibuprofen (400mg)": 110
        });
        setIsUploadingImage(false);
      }, 1500);
    }
  };

  // Sync vision extracted stock back into current inventory
  const syncManifestToInventory = () => {
    if (!manifestResult) return;
    
    const merged = { ...inventoryForm };
    Object.entries(manifestResult).forEach(([med, qty]) => {
      merged[med] = qty;
    });
    setInventoryForm(merged);
    setManifestResult(null);
    setManifestImage(null);
    alert("Manifest stocks merged into inventory form! Review and hit 'Update Inventory' to save.");
  };

  // ADMIN PORTAL: Approve Transfer Recommendation
  const handleApproveTransfer = async (rec) => {
    if (backendStatus === 'online') {
      try {
        // Create actual transfer first in Pending state
        const createRes = await fetch(`${API_BASE}/api/transfers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_facility_id: rec.from_facility_id,
            to_facility_id: rec.to_facility_id,
            medicine: rec.medicine,
            quantity: rec.transfer_quantity
          })
        });
        if (createRes.ok) {
          const newTrans = await createRes.json();
          // Approve transfer (which performs DB stock transactions)
          const approveRes = await fetch(`${API_BASE}/api/transfers/${newTrans.id}/approve`, {
            method: 'POST'
          });
          if (approveRes.ok) {
            alert(`Stock transfer approved! ${rec.transfer_quantity} of ${rec.medicine} moved successfully.`);
            fetchData();
          }
        }
      } catch (err) {
        console.error(err);
        alert("Failed to process transfer request.");
      }
    } else {
      // Simulate transfer approval local client logic
      const fromFac = facilities.find(f => f.id === rec.from_facility_id);
      const toFac = facilities.find(f => f.id === rec.to_facility_id);

      if (!fromFac || !toFac) return;

      const fromStock = fromFac.inventory[rec.medicine] || 0;
      if (fromStock < rec.transfer_quantity) {
        alert("Emulation Error: Source facility does not have enough stock anymore.");
        return;
      }

      // Deduct/Add stock
      const updatedFacilities = facilities.map(fac => {
        if (fac.id === rec.from_facility_id) {
          return {
            ...fac,
            inventory: { ...fac.inventory, [rec.medicine]: fromStock - rec.transfer_quantity }
          };
        }
        if (fac.id === rec.to_facility_id) {
          return {
            ...fac,
            inventory: { ...fac.inventory, [rec.medicine]: (fac.inventory[rec.medicine] || 0) + rec.transfer_quantity }
          };
        }
        return fac;
      });

      // Add to transfers list
      const newTransferDoc = {
        id: `trans_${Math.random().toString(36).substr(2, 9)}`,
        from_facility_id: rec.from_facility_id,
        from_facility_name: rec.from_facility_name,
        to_facility_id: rec.to_facility_id,
        to_facility_name: rec.to_facility_name,
        medicine: rec.medicine,
        quantity: rec.transfer_quantity,
        status: "Approved",
        timestamp: new Date().toISOString()
      };

      const updatedTransfers = [newTransferDoc, ...transfers];
      setFacilities(updatedFacilities);
      setTransfers(updatedTransfers);
      
      // Update active selection to match new stock states
      const updatedSelected = updatedFacilities.find(f => f.id === selectedAdminFac?.id);
      if (updatedSelected) {
        setSelectedAdminFac(updatedSelected);
      }

      recalculateSimulation(updatedFacilities, updatedTransfers);
      alert(`Transfer Approved! Moved ${rec.transfer_quantity} of ${rec.medicine} locally.`);
    }
  };

  // Dynamic calculations for offline mode simulation
  const recalculateSimulation = (currentFacs, currentTransfers) => {
    // Re-evaluates warning matrices, routes, and priorities locally on client
    // 1. Stockout warnings
    const warnings = [];
    const recommendations = [];
    const flags = [];

    const surplusPool = {};
    const deficitPool = {};

    currentFacs.forEach(fac => {
      const inventory = fac.inventory || {};
      const min_stock = fac.min_stock || {};
      
      // Doctor absenteeism check
      const attendance = fac.doctor_attendance || {};
      const totalDocs = Object.keys(attendance).length;
      const absentDocs = Object.values(attendance).filter(st => st !== 'Present').length;
      if (totalDocs > 0 && absentDocs === totalDocs) {
        flags.push({
          facility_id: fac.id,
          facility_name: fac.name,
          type: "Doctor Absenteeism",
          description: `Critical: All ${totalDocs} doctors are absent (${Object.keys(attendance).join(', ')}).`,
          urgency: "Critical"
        });
      }

      // Bed depletion check
      if (fac.beds.available === 0) {
        flags.push({
          facility_id: fac.id,
          facility_name: fac.name,
          type: "Bed Occupancy",
          description: "Alert: No hospital beds available.",
          urgency: "High"
        });
      }

      // Inventory check
      Object.entries(inventory).forEach(([med, qty]) => {
        const minVal = min_stock[med] || 0;
        if (qty < minVal) {
          const deficit = minVal - qty;
          warnings.push({
            facility_id: fac.id,
            facility_name: fac.name,
            medicine: med,
            current_stock: qty,
            min_stock: minVal,
            days_remaining_estimate: Math.max(0.5, roundNum(qty / (fac.daily_footfall * 0.08), 1)),
            urgency: qty < (minVal * 0.2) ? "High" : "Medium"
          });

          if (!deficitPool[med]) deficitPool[med] = [];
          deficitPool[med].push({
            facility_id: fac.id,
            facility_name: fac.name,
            lat: fac.latitude,
            lng: fac.longitude,
            deficit_qty: deficit
          });
        } else if (qty > minVal) {
          const surplus = qty - minVal;
          if (surplus > 15) {
            if (!surplusPool[med]) surplusPool[med] = [];
            surplusPool[med].push({
              facility_id: fac.id,
              facility_name: fac.name,
              lat: fac.latitude,
              lng: fac.longitude,
              surplus_qty: surplus
            });
          }
        }
      });
    });

    // Distance routing
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return roundNum(R * c, 2);
    };

    Object.entries(deficitPool).forEach(([med, deficits]) => {
      const surpluses = surplusPool[med] || [];
      if (surpluses.length === 0) return;

      deficits.forEach(defItem => {
        let needed = defItem.deficit_qty;
        
        // Sort surpluses by distance
        const sortedSurpluses = surpluses
          .map(sur => ({ sur, dist: getDistance(defItem.lat, defItem.lng, sur.lat, sur.lng) }))
          .sort((a, b) => a.dist - b.dist);

        sortedSurpluses.forEach(({ sur, dist }) => {
          if (needed <= 0 || sur.surplus_qty <= 0) return;
          const transferQty = Math.min(needed, sur.surplus_qty);
          sur.surplus_qty -= transferQty;
          needed -= transferQty;

          recommendations.push({
            from_facility_id: sur.facility_id,
            from_facility_name: sur.facility_name,
            to_facility_id: defItem.facility_id,
            to_facility_name: defItem.facility_name,
            medicine: med,
            transfer_quantity: transferQty,
            distance_km: dist,
            reason: `Redistribute surplus ${med} to cover deficit (Needs ${defItem.deficit_qty}).`
          });
        });
      });
    });

    setOptimization({
      stock_out_warnings: warnings,
      redistribution_recommendations: recommendations,
      admin_flags: flags
    });

    // Re-join Demographics
    const districtsDemographics = {
      "Hyderabad": { "nutrition_deficit_percent": 34.2, "maternal_care_coverage": 72.1, "safe_drinking_water_access": 88.5, "poverty_rate_percent": 12.4, "under_5_mortality_rate": 28.5, "population_density": 18480 },
      "Rangareddy": { "nutrition_deficit_percent": 38.6, "maternal_care_coverage": 65.4, "safe_drinking_water_access": 79.2, "poverty_rate_percent": 18.9, "under_5_mortality_rate": 34.2, "population_density": 840 },
      "Medchal-Malkajgiri": { "nutrition_deficit_percent": 32.1, "maternal_care_coverage": 70.2, "safe_drinking_water_access": 82.4, "poverty_rate_percent": 14.1, "under_5_mortality_rate": 29.8, "population_density": 2100 }
    };

    const newAnalytics = currentFacs.map(fac => {
      const demo = districtsDemographics[fac.district] || districtsDemographics["Hyderabad"];
      
      let inStock = 0;
      let stockouts = 0;
      const inv = fac.inventory || {};
      const mins = fac.min_stock || {};
      Object.entries(inv).forEach(([med, qty]) => {
        const minVal = mins[med] || 0;
        if (qty >= minVal) inStock++;
        else if (qty < (minVal * 0.2)) stockouts++;
      });
      const invScore = (inStock / Object.keys(inv).length) * 100;

      const docs = fac.doctor_attendance || {};
      const present = Object.values(docs).filter(v => v === 'Present').length;
      const attScore = Object.keys(docs).length > 0 ? (present / Object.keys(docs).length) * 100 : 100;
      
      const opScore = roundNum((invScore * 0.6) + (attScore * 0.4), 1);
      const vulnScore = roundNum(
        (demo.nutrition_deficit_percent * 0.3) + 
        ((100 - demo.maternal_care_coverage) * 0.3) + 
        ((100 - demo.safe_drinking_water_access) * 0.2) + 
        (demo.poverty_rate_percent * 0.2), 
        1
      );
      
      const prioIndex = roundNum((vulnScore * 0.5) + ((100 - opScore) * 0.5), 1);

      return {
        facility_id: fac.id,
        facility_name: fac.name,
        district: fac.district,
        type: fac.type,
        daily_footfall: fac.daily_footfall,
        rating: fac.rating,
        beds_available: fac.beds.available,
        critical_stock_outs: stockouts,
        operational_score: opScore,
        vulnerability_score: vulnScore,
        priority_index: prioIndex,
        demographics: demo
      };
    }).sort((a, b) => b.priority_index - a.priority_index);

    setAnalytics(newAnalytics);
  };

  const roundNum = (num, decimals) => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col">
      {/* 🚀 Header */}
      <header className="border-b border-slate-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500/20 text-primary-500 p-2.5 rounded-lg border border-primary-500/30 pulse-glow">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary-500 via-emerald-400 to-teal-600 bg-clip-text text-transparent">
                AAYUSH
              </h1>
              <p className="text-xs text-slate-400 font-medium">Smart District Health Resource Optimizer</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-slate-400 hover:text-slate-200 bg-dark-800/80 border border-slate-700/50'
              }`}
            >
              <Grid className="h-4 w-4" />
              Admin Cockpit
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'staff'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-slate-400 hover:text-slate-200 bg-dark-800/80 border border-slate-700/50'
              }`}
            >
              <User className="h-4 w-4" />
              Clinic Staff Portal
            </button>

            {/* Backend Connection Indicator */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              {backendStatus === 'online' ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded text-xs">
                  <Server className="h-3 w-3" />
                  Live Sync
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-1 rounded text-xs animate-pulse">
                  <AlertCircle className="h-3 w-3" />
                  Offline Demo
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 📊 Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-6 mt-8 flex-grow">
        {activeTab === 'admin' ? (
          /* ============================================================ */
          /* 🖥️ DISTRICT ADMIN CONTROL CENTER                          */
          /* ============================================================ */
          <div className="space-y-8">
            
            {/* Highlights Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total Clinics Managed</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-100">{facilities.length}</h3>
                </div>
                <div className="bg-primary-500/10 text-primary-500 p-3 rounded-lg border border-primary-500/20">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Critical Stockout Warnings</p>
                  <h3 className="text-2xl font-bold mt-1 text-red-400">
                    {optimization.stock_out_warnings.filter(w => w.urgency === 'High').length}
                  </h3>
                </div>
                <div className="bg-red-500/10 text-red-500 p-3 rounded-lg border border-red-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Active Red Flags</p>
                  <h3 className="text-2xl font-bold mt-1 text-amber-400">
                    {optimization.admin_flags.length}
                  </h3>
                </div>
                <div className="bg-amber-500/10 text-amber-500 p-3 rounded-lg border border-amber-500/20">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Transfers Completed</p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-400">
                    {transfers.filter(t => t.status === 'Approved').length}
                  </h3>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-lg border border-emerald-500/20">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Split Screen Panel: Custom Map & AI Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Interactive SVG Geographic Routing Map (2 cols) */}
              <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between min-h-[480px]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Map className="h-5 w-5 text-primary-500" />
                        District Resource Distribution Map
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Interactive geographical node tracking for Hyderabad clinics cluster</p>
                    </div>
                    <button onClick={fetchData} className="text-slate-400 hover:text-primary-500 transition-colors">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* SVG Geographic Visualizer */}
                  <div className="relative w-full h-[320px] bg-dark-900/50 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden">
                    
                    {/* Background Grid Lines representing coordinates */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                    
                    <svg className="w-full h-full p-6 absolute inset-0 z-10" viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2"/>
                        </linearGradient>
                        <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#14b8a6"/>
                        </marker>
                      </defs>

                      {/* Render Routing Recommendation Lines */}
                      {optimization.redistribution_recommendations.map((rec, i) => {
                        const fromNode = getSVGCoords(rec.from_facility_id);
                        const toNode = getSVGCoords(rec.to_facility_id);
                        if (!fromNode || !toNode) return null;
                        return (
                          <g key={i}>
                            <line 
                              x1={fromNode.x} 
                              y1={fromNode.y} 
                              x2={toNode.x} 
                              y2={toNode.y} 
                              stroke="url(#route-gradient)" 
                              strokeWidth="2.5" 
                              strokeDasharray="5 5"
                              className="animate-[dash_10s_linear_infinite]"
                              markerEnd="url(#arrow)"
                            />
                            {/* Moving route packet dot */}
                            <circle r="4" fill="#14b8a6" className="animate-[ping_1.5s_infinite]">
                              <animateMotion 
                                path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`} 
                                dur="4s" 
                                repeatCount="indefinite" 
                              />
                            </circle>
                          </g>
                        );
                      })}

                      {/* Render Clinic Nodes */}
                      {facilities.map((fac) => {
                        const coords = getSVGCoords(fac.id);
                        if (!coords) return null;
                        
                        const isAbsAbsent = optimization.admin_flags.some(f => f.facility_id === fac.id && f.type === 'Doctor Absenteeism');
                        const isCriticalStock = optimization.stock_out_warnings.some(w => w.facility_id === fac.id && w.urgency === 'High');
                        
                        let markerColor = "#14b8a6"; // default clean
                        if (isAbsAbsent) markerColor = "#ef4444"; // Absenteeism (Red)
                        else if (isCriticalStock) markerColor = "#f59e0b"; // Warning (Orange)

                        return (
                          <g 
                            key={fac.id} 
                            onClick={() => setSelectedAdminFac(fac)}
                            className="cursor-pointer group"
                          >
                            {/* Glow pulse for critical clinics */}
                            {(isAbsAbsent || isCriticalStock) && (
                              <circle 
                                cx={coords.x} 
                                cy={coords.y} 
                                r="18" 
                                fill={markerColor} 
                                className="opacity-15 animate-ping"
                              />
                            )}
                            <circle 
                              cx={coords.x} 
                              cy={coords.y} 
                              r="9" 
                              fill={markerColor} 
                              className="group-hover:r-[11] transition-all duration-150 border-2 border-slate-900"
                            />
                            <text 
                              x={coords.x} 
                              y={coords.y - 14} 
                              fill="#94a3b8" 
                              fontSize="10" 
                              textAnchor="middle" 
                              className="font-bold select-none group-hover:fill-slate-100"
                            >
                              {fac.name.split(' ')[0]} {/* First word abbreviation */}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Simple Custom Map Legend Overlay */}
                    <div className="absolute bottom-3 left-4 flex gap-4 text-[10px] text-slate-400 font-semibold bg-dark-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-500"></span> Normal Node</div>
                      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-alert-warning"></span> Stock Deficit</div>
                      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-alert-danger animate-pulse"></span> Abs Absent/Critical</div>
                      <div className="flex items-center gap-1.5"><span className="h-1.5 w-4 border-t border-dashed border-primary-500"></span> AI Routing Path</div>
                    </div>
                  </div>
                </div>

                {/* Node Detail Bar (Synced to Selection) */}
                {selectedAdminFac && (
                  <div className="mt-4 p-4 bg-dark-900/60 rounded-lg border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary-500" />
                        {selectedAdminFac.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Type: <span className="text-slate-200 font-semibold">{selectedAdminFac.type}</span> | 
                        District: <span className="text-slate-200 font-semibold">{selectedAdminFac.district}</span> | 
                        Daily Footfall: <span className="text-slate-200 font-semibold">{selectedAdminFac.daily_footfall}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Bed Vacancies</p>
                        <p className="text-xs text-emerald-400 font-extrabold mt-0.5">
                          {selectedAdminFac.beds.available} / {selectedAdminFac.beds.total} available
                        </p>
                      </div>
                      <div className="text-right border-l border-slate-800 pl-6">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Staff Attendance</p>
                        <p className="text-xs text-slate-200 font-bold mt-0.5">
                          {Object.values(selectedAdminFac.doctor_attendance || {}).filter(st => st === 'Present').length} / {Object.keys(selectedAdminFac.doctor_attendance || {}).length} Present
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Side Column: Immediate AI Redistribution recommendations & Flags */}
              <div className="space-y-6">
                
                {/* Warnings / Red Flags Panel */}
                <div className="glass-panel p-5 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
                      <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                      Critical Operational Flags
                    </h3>
                    
                    {optimization.admin_flags.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No high-priority administrative flags detected.</p>
                    ) : (
                      <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                        {optimization.admin_flags.map((flag, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg border text-xs flex gap-2 ${
                              flag.urgency === 'Critical' 
                                ? 'bg-red-500/10 border-red-500/30 text-red-200' 
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            }`}
                          >
                            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                            <div>
                              <p className="font-bold">{flag.type} at {flag.facility_name.split(' ')[0]}</p>
                              <p className="mt-0.5 text-slate-300 leading-relaxed text-[11px]">{flag.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Out Warnings List */}
                <div className="glass-panel p-5 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                      Predicted Stock Gaps
                    </h3>
                    
                    {optimization.stock_out_warnings.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">All inventories optimized and above threshold levels.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                        {optimization.stock_out_warnings.map((warn, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-dark-900/50 border border-slate-800 text-xs">
                            <div>
                              <p className="font-bold text-slate-200">{warn.medicine}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{warn.facility_name.split(' ')[0]} ({warn.current_stock} left)</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                warn.urgency === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                Est. {warn.days_remaining_estimate} Days
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* AI Redistribution Action Table */}
            <div className="glass-panel p-6">
              <h2 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary-500" />
                AI-Driven Medicine Redistribution Engine
              </h2>
              
              {optimization.redistribution_recommendations.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
                  <p className="text-sm text-slate-400 italic">No asset redistributions recommended. Stock levels are stable.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="pb-3">Source Facility</th>
                        <th className="pb-3">Destination Facility</th>
                        <th className="pb-3">Required Medicine</th>
                        <th className="pb-3 text-center">Suggested Quantity</th>
                        <th className="pb-3 text-center">Distance</th>
                        <th className="pb-3">Optimization Logic</th>
                        <th className="pb-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {optimization.redistribution_recommendations.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 font-semibold text-slate-200">{rec.from_facility_name}</td>
                          <td className="py-3 font-semibold text-slate-200">{rec.to_facility_name}</td>
                          <td className="py-3 font-bold text-primary-400">{rec.medicine}</td>
                          <td className="py-3 text-center font-bold text-slate-100">{rec.transfer_quantity}</td>
                          <td className="py-3 text-center text-slate-400">{rec.distance_km} km</td>
                          <td className="py-3 text-[11px] text-slate-400 max-w-[240px] leading-relaxed">{rec.reason}</td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleApproveTransfer(rec)}
                              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded font-bold shadow-md hover:shadow-primary-500/20 transition-all flex items-center gap-1.5 mx-auto"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve Transfer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Analytics Dashboard Segment: Joined public health demographic indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Vulnerability vs Operational Index Chart */}
              <div className="glass-panel p-6">
                <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-primary-500" />
                  Demographics Join: Clinic Priority index (NFHS vs Live Ops)
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="facility_name" stroke="#64748b" tickFormatter={(v) => v.split(' ')[0]} fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                      />
                      <Legend />
                      <Bar name="Live Operational Rating" dataKey="operational_score" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      <Bar name="NFHS Vulnerability Score" dataKey="vulnerability_score" fill="#e11d48" radius={[4, 4, 0, 0]} />
                      <Bar name="Optimization Priority Rank" dataKey="priority_index" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BigQuery Join Raw Demographics Table */}
              <div className="glass-panel p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary-500" />
                    Simulated BigQuery Join Table (District Demographics Profile)
                  </h3>
                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold">
                          <th className="pb-2">Facility Name</th>
                          <th className="pb-2">District</th>
                          <th className="pb-2 text-center">Child Malnutrition (NFHS)</th>
                          <th className="pb-2 text-center">Maternal CareANC (NFHS)</th>
                          <th className="pb-2 text-center">Clean Water Gap (NFHS)</th>
                          <th className="pb-2 text-center">Pop Density (/sq km)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {analytics.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/10">
                            <td className="py-2.5 font-semibold text-slate-300">{row.facility_name}</td>
                            <td className="py-2.5 text-slate-400">{row.district}</td>
                            <td className="py-2.5 text-center text-rose-400 font-bold">{row.demographics?.nutrition_deficit_percent}%</td>
                            <td className="py-2.5 text-center text-emerald-400 font-bold">{row.demographics?.maternal_care_coverage}%</td>
                            <td className="py-2.5 text-center text-amber-400 font-bold">{100 - row.demographics?.safe_drinking_water_access}%</td>
                            <td className="py-2.5 text-center text-slate-300 font-medium">{row.demographics?.population_density}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-4 leading-relaxed bg-dark-900/40 p-2.5 rounded border border-slate-800">
                  <span className="font-bold text-slate-300">Logic Note:</span> High optimization Priority Rank indices are awarded to facilities having low Operational Ratings (doctor absenteeism & stock-outs) positioned in regions displaying deep NFHS child stunting and water vulnerability.
                </div>
              </div>

            </div>

            {/* Transfer History Log */}
            <div className="glass-panel p-6">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
                <Clock className="h-4.5 w-4.5 text-primary-500" />
                Resource Transfer Ledger & Logs
              </h3>
              
              {transfers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No stock transfers logged yet.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {transfers.map((trans, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded bg-dark-900/60 border border-slate-800/80 text-xs gap-2">
                      <div className="flex items-center gap-2.5">
                        <Truck className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-slate-200">
                            Moved <span className="font-bold text-emerald-400">{trans.quantity} units</span> of <span className="font-bold text-primary-400">{trans.medicine}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            From: {trans.from_facility_name} &rarr; To: {trans.to_facility_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(trans.timestamp).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          trans.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {trans.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ============================================================ */
          /* 🏥 CLINIC STAFF PORTAL                                     */
          /* ============================================================ */
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Control Panel selector */}
            <div className="glass-panel p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Clinic Operational Logging Station</h2>
                <p className="text-xs text-slate-400 mt-0.5">Report local inventory counts, staff attendance, voice logs, and supply sheets</p>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-bold uppercase shrink-0">Select Facility:</label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="glass-input text-xs font-semibold py-1.5 focus:ring-0"
                >
                  <option value="phc_gachibowli">Gachibowli PHC</option>
                  <option value="phc_charminar">Charminar PHC</option>
                  <option value="phc_uppal">Uppal PHC</option>
                  <option value="chc_kondapur">Kondapur CHC</option>
                  <option value="chc_nampally">Nampally CHC</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Doctor Attendance & Stock Levels Form */}
              <div className="space-y-8">
                
                {/* Doctor Attendance logging */}
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
                    <UserCheck className="h-4.5 w-4.5 text-primary-500" />
                    Physician Attendance Logger
                  </h3>
                  
                  {Object.keys(attendanceLogs).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No doctors configured for this facility.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(attendanceLogs).map(([docName, currentStatus]) => (
                        <div key={docName} className="flex items-center justify-between text-xs p-2.5 rounded bg-dark-900/40 border border-slate-800">
                          <span className="font-semibold text-slate-200">{docName}</span>
                          <div className="flex gap-1.5">
                            {['Present', 'Absent', 'On Leave'].map((statusOption) => (
                              <button
                                key={statusOption}
                                onClick={() => handleAttendanceChange(docName, statusOption)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                                  currentStatus === statusOption
                                    ? statusOption === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                      : statusOption === 'Absent'
                                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                                        : 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                                    : 'bg-dark-800 hover:bg-slate-700 text-slate-400 border border-slate-700/50'
                                }`}
                              >
                                {statusOption}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stock Level inputs */}
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
                    <FileText className="h-4.5 w-4.5 text-primary-500" />
                    Manually Update Stock Levels
                  </h3>
                  <form onSubmit={handleInventorySubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(inventoryForm).map(([medName, qty]) => (
                        <div key={medName} className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase truncate">{medName}</label>
                          <input
                            type="number"
                            value={qty}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, [medName]: parseInt(e.target.value) || 0 })}
                            className="glass-input text-xs"
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-xs hover:shadow-primary-500/20 transition-all uppercase tracking-wider"
                    >
                      Update Inventory
                    </button>
                  </form>
                </div>

              </div>

              {/* Multimodal AI Ingestion segment */}
              <div className="space-y-8">
                
                {/* Speech Intake */}
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
                    <Volume2 className="h-4.5 w-4.5 text-primary-500" />
                    Voice Note Intake (AI Translation)
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    Ground staff can report supply requests in regional languages. Gemini/STT will transcribe, translate, and index the report in real-time.
                  </p>

                  <div className="flex gap-2.5 mb-5">
                    <button
                      onClick={() => handleSimulateVoice('hi')}
                      disabled={isRecording}
                      className="flex-1 py-2 bg-dark-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded text-[11px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                      Simulate Hindi Audio
                    </button>
                    <button
                      onClick={() => handleSimulateVoice('te')}
                      disabled={isRecording}
                      className="flex-1 py-2 bg-dark-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded text-[11px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                      Simulate Telugu Audio
                    </button>
                  </div>

                  <div className="p-4 bg-dark-900/60 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[140px] text-center">
                    {isRecording ? (
                      <div className="space-y-3">
                        <div className="flex gap-1 justify-center">
                          <span className="w-1.5 h-6 bg-primary-500 rounded animate-[pulse_0.8s_infinite]"></span>
                          <span className="w-1.5 h-8 bg-primary-500 rounded animate-[pulse_0.8s_infinite_0.2s]"></span>
                          <span className="w-1.5 h-6 bg-primary-500 rounded animate-[pulse_0.8s_infinite_0.4s]"></span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-bold animate-pulse">Recording simulated audio note...</p>
                      </div>
                    ) : voiceResult ? (
                      <div className="w-full text-left space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400">
                            Language: {voiceResult.detected_language === 'hi' ? 'Hindi (IN)' : 'Telugu (IN)'}
                          </span>
                          <span className="text-[9px] text-slate-400">Confidence: {voiceResult.confidence * 100}%</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Original Transcript</p>
                          <p className="text-slate-200 mt-0.5 italic">&ldquo;{voiceResult.original_transcript}&rdquo;</p>
                        </div>
                        <div className="pt-2 border-t border-slate-800/80">
                          <p className="text-[10px] text-primary-400 font-semibold uppercase flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            English AI Translation
                          </p>
                          <p className="text-primary-300 mt-0.5 font-medium leading-relaxed">&ldquo;{voiceResult.translated_text}&rdquo;</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Volume2 className="h-8 w-8 text-slate-500 mx-auto" />
                        <p className="text-[11px] text-slate-400">Click a regional preset above to trigger translation ingestion pipeline.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vision Ingestion */}
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
                    <Camera className="h-4.5 w-4.5 text-primary-500" />
                    Vertex AI Vision Upload (Log sheet parsing)
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    Upload handwritten logs or paper invoices. Gemini Multimodal parses and outputs stock items automatically.
                  </p>
                  
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl bg-dark-900/40 relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleManifestUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isUploadingImage}
                    />
                    
                    {isUploadingImage ? (
                      <div className="text-center space-y-3">
                        <RefreshCw className="h-7 w-7 text-primary-500 animate-spin mx-auto" />
                        <p className="text-xs text-slate-200">Gemini Vision parsing image...</p>
                      </div>
                    ) : manifestResult ? (
                      <div className="w-full text-left space-y-3 text-xs z-20">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-bold text-slate-200">Parsed Inventory Manifest</span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Extracted
                          </span>
                        </div>
                        
                        <div className="space-y-1.5">
                          {Object.entries(manifestResult).map(([item, count]) => (
                            <div key={item} className="flex justify-between py-1 border-b border-slate-800/40 text-[11px]">
                              <span className="text-slate-400">{item}</span>
                              <span className="font-bold text-slate-200">{count} units</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={syncManifestToInventory}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Apply & Sync to Form
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <UploadCloud className="h-8 w-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-200 font-bold">Drag and drop manifest photo or click here</p>
                        <p className="text-[10px] text-slate-400">Supports JPEG, PNG log papers (Simulated OCR OCR extraction)</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// Helper: Custom coordinates on district map layout for Hyderabad
function getSVGCoords(facilityId) {
  const coordsMap = {
    "phc_gachibowli": { x: 100, y: 80 },
    "phc_charminar":  { x: 300, y: 220 },
    "phc_uppal":      { x: 500, y: 150 },
    "chc_kondapur":   { x: 80,  y: 190 },
    "chc_nampally":   { x: 260, y: 110 }
  };
  return coordsMap[facilityId] || null;
}
