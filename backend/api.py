import os
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from models import User, Session, Report
from database import db
from typing import Dict, Any
import json
from bson import ObjectId
from datetime import datetime
import random # For mock report
from email_service import EmailService # Import the EmailService

router = APIRouter(prefix="/api/v1")

# Mock questions - will be replaced with a proper question loader
def get_questions_for_company_size(company_size: str):
    # Construct an absolute path to the questions.json file
    script_dir = os.path.dirname(__file__)  # Get the directory where the script is located
    # Go up one level to the root, then into frontend/src/data
    questions_path = os.path.join(script_dir, '..', 'frontend', 'src', 'data', 'questions.json')
    
    with open(questions_path, 'r') as f:
        all_questions = json.load(f)

    return [q for q in all_questions if company_size in q['stage_applicability']]


class StartSessionRequest(BaseModel):
    name: str
    email: str
    companySize: str

@router.post("/session/start", status_code=201)
async def start_session(request: StartSessionRequest):
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = user["_id"]

    # Create session document directly to ensure proper ObjectId handling
    session_data = {
        "user_id": user_id,
        "answers": {},
        "status": "started",
        "start_time": datetime.utcnow(),
        "end_time": None
    }
    try:
        result = await db.sessions.insert_one(session_data)
        session_id = result.inserted_id
    except Exception as e:
        # Don't delete user - user already exists in database
        raise HTTPException(status_code=500, detail=f"Failed to create session: {e}")

    questions = get_questions_for_company_size(user["companySize"])

    return {
        "sessionId": str(session_id),
        "userId": str(user_id),
        "questions": questions
    }

async def mock_generate_insights(answers: Dict[str, Any]) -> Dict[str, Any]:
    """ Mocks the AI insight generation. """
    mindset_shifts = ["From Doer to Delegator", "From Founder to CEO", "From Reactive to Proactive"]
    operational_focuses = ["Streamlined Onboarding", "Clear OKRs", "Improved Communication Cadence"]
    next_moves = [
        {"type": "Action", "description": "Create a 90-day delegation plan.", "details": "Identify 3-5 tasks you can delegate immediately."},
        {"type": "Reflection", "description": "Journal on your leadership style.", "details": "What are your top 3 leadership values?"},
        {"type": "Consult", "description": "Book a session with a coach.", "details": "Discuss your current challenges and get an outside perspective."}
    ]
    
    return {
        "mindset_shift": random.choice(mindset_shifts),
        "mindset_shift_insight": "This shift is crucial for scaling your leadership.",
        "operational_focus": random.choice(operational_focuses),
        "operational_focus_insight": "Focusing here will unlock significant team productivity.",
        "next_move": random.choice(next_moves)
    }


@router.post("/session/{session_id}/complete")
async def complete_session(session_id: str, answers: Dict[str, Any] = Body(...)):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    # Frontend sends answers as a JSON object directly, so we can use it as-is
    answers_data = answers

    session_obj_id = ObjectId(session_id)
    session = await db.sessions.find_one({"_id": session_obj_id})
    if not session:
        # Check if session exists with string comparison (for debugging)
        all_sessions = await db.sessions.find({}).to_list(length=100)
        session_ids = [str(s.get("_id", "")) for s in all_sessions]
        raise HTTPException(
            status_code=404, 
            detail=f"Session not found with ID: {session_id}. Total sessions in DB: {len(all_sessions)}"
        )

    # Update session with answers and mark as completed
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"answers": answers_data, "status": "completed", "end_time": datetime.utcnow()}}
    )
    
    # Generate insights (mocked for now)
    insights = await mock_generate_insights(answers_data)
    
    # Create and save the report document directly
    report_data = {
        "user_id": session["user_id"],
        "session_id": ObjectId(session_id),
        "mindset_shift": insights["mindset_shift"],
        "mindset_shift_insight": insights["mindset_shift_insight"],
        "operational_focus": insights["operational_focus"],
        "operational_focus_insight": insights["operational_focus_insight"],
        "next_move": insights["next_move"],
        "generated_at": datetime.utcnow()
    }
    
    try:
        result = await db.reports.insert_one(report_data)
        report_id = result.inserted_id
        print(f"DEBUG: Report saved with ID: {report_id}, user_id: {session['user_id']}")  # Debug log
    except Exception as e:
        print(f"DEBUG: Error saving report: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Failed to save report: {e}")

    # Fetch the created report to return it
    created_report = await db.reports.find_one({"_id": report_id})
    if not created_report:
        raise HTTPException(status_code=500, detail="Failed to retrieve created report")
    
    # Convert ObjectIds to strings for JSON serialization
    report_response = {
        "_id": str(created_report["_id"]),
        "user_id": str(created_report["user_id"]),
        "session_id": str(created_report["session_id"]),
        "mindset_shift": created_report["mindset_shift"],
        "mindset_shift_insight": created_report["mindset_shift_insight"],
        "operational_focus": created_report["operational_focus"],
        "operational_focus_insight": created_report["operational_focus_insight"],
        "next_move": created_report["next_move"],
        "generated_at": created_report["generated_at"].isoformat() if isinstance(created_report["generated_at"], datetime) else str(created_report["generated_at"])
    }

    # # Send the report via email
    # email_service = EmailService(
    #     smtp_server="smtp.example.com",
    #     port=587,
    #     sender_email="noreply@example.com",
    #     password="your_password"
    # )
    # user = await db.users.find_one({"_id": session["user_id"]})
    # email_body = f"""
    # Hello {user['name']},

    # Here is your personalized report:

    # Top Mindset Shift: {report_response['mindset_shift']}
    # Insight: {report_response['mindset_shift_insight']}

    # Top Operational Focus: {report_response['operational_focus']}
    # Insight: {report_response['operational_focus_insight']}

    # Suggested Next Move: {report_response['next_move']['type']} - {report_response['next_move']['description']}
    # Details: {report_response['next_move']['details']}

    # Thank you for using the Founder Clarity Compass!
    # """
    # email_service.send_email(
    #     receiver_email=user["email"],
    #     subject="Your Founder Clarity Compass Report",
    #     body=email_body
    # )

    return {"report": report_response}


@router.get("/reports/user/{user_id}")
async def get_reports_by_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user_obj_id = ObjectId(user_id)
    print(f"DEBUG: Fetching reports for user_id: {user_id} (ObjectId: {user_obj_id})")  # Debug log
    
    # Get all reports to debug
    all_reports = await db.reports.find({}).to_list(length=100)
    print(f"DEBUG: Total reports in DB: {len(all_reports)}")  # Debug log
    if all_reports:
        print(f"DEBUG: Sample report user_id: {all_reports[0].get('user_id')}, type: {type(all_reports[0].get('user_id'))}")  # Debug log
    
    reports_cursor = db.reports.find({"user_id": user_obj_id})
    reports_docs = await reports_cursor.to_list(length=100)  # Adjust length as needed
    print(f"DEBUG: Found {len(reports_docs)} reports for user {user_id}")  # Debug log
    
    # Convert MongoDB documents to JSON-serializable format
    reports = []
    for doc in reports_docs:
        report = {
            "id": str(doc.get("_id", "")),
            "user_id": str(doc.get("user_id", "")),
            "session_id": str(doc.get("session_id", "")),
            "mindset_shift": doc.get("mindset_shift", ""),
            "mindset_shift_insight": doc.get("mindset_shift_insight", ""),
            "operational_focus": doc.get("operational_focus", ""),
            "operational_focus_insight": doc.get("operational_focus_insight", ""),
            "next_move": doc.get("next_move", {}),
            "generated_at": doc.get("generated_at").isoformat() if doc.get("generated_at") and isinstance(doc.get("generated_at"), datetime) else str(doc.get("generated_at", ""))
        }
        reports.append(report)
    
    return reports