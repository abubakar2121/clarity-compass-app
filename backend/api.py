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

    session = Session(user_id=user_id)
    try:
        result = await db.sessions.insert_one(session.model_dump(by_alias=True))
        session.id = result.inserted_id
    except Exception as e:
        # Handle potential rollback of user creation if session creation fails
        await db.users.delete_one({"_id": user.id})
        raise HTTPException(status_code=500, detail=f"Failed to create session: {e}")

    questions = get_questions_for_company_size(user["companySize"])

    return {
        "sessionId": str(session.id),
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

    # In a real-world scenario, you'd want better error handling here.
    # For instance, what if the body is not a valid JSON string?
    # For now, we'll assume the frontend sends a stringified JSON.
    try:
        answers_data = json.loads(list(answers.keys())[0])
    except (json.JSONDecodeError, IndexError):
        answers_data = answers

    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update session with answers and mark as completed
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"answers": answers_data, "status": "completed", "end_time": datetime.utcnow()}}
    )
    
    # Generate insights (mocked for now)
    insights = await mock_generate_insights(answers_data)
    
    # Create and save the report
    report_data = {
        "user_id": session["user_id"],
        "session_id": ObjectId(session_id),
        **insights
    }
    report = Report(**report_data)
    
    try:
        result = await db.reports.insert_one(report.model_dump(by_alias=True))
        report.id = result.inserted_id
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save report: {e}")

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

    # Top Mindset Shift: {report.mindset_shift}
    # Insight: {report.mindset_shift_insight}

    # Top Operational Focus: {report.operational_focus}
    # Insight: {report.operational_focus_insight}

    # Suggested Next Move: {report.next_move['type']} - {report.next_move['description']}
    # Details: {report.next_move['details']}

    # Thank you for using the Founder Clarity Compass!
    # """
    # email_service.send_email(
    #     receiver_email=user["email"],
    #     subject="Your Founder Clarity Compass Report",
    #     body=email_body
    # )

    # The report object now includes the auto-generated _id
    return {"report": json.loads(report.model_dump_json())}


@router.get("/reports/user/{user_id}", response_model=list[Report])
async def get_reports_by_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    reports_cursor = db.reports.find({"user_id": ObjectId(user_id)})
    reports = await reports_cursor.to_list(length=100)  # Adjust length as needed

    return reports