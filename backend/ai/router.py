import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import NccRecord
from schemas import AISuggestRequest, AISuggestResponse, AIChatRequest, AIChatResponse
from auth.dependencies import get_current_user
from models import User
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL   = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:1.7b")

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Helper: call Ollama ───────────────────────────────────────────────────────

def call_ollama(prompt: str, system: str = "") -> str:
    """Send a prompt to Ollama and return the response text."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {"temperature": 0.3},
            },
            timeout=300.0,
        )
        response.raise_for_status()
        return response.json()["message"]["content"].strip()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start it with: ollama serve",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


# ── POST /ai/suggest ─────────────────────────────────────────────────────────

@router.post("/suggest", response_model=AISuggestResponse)
def ai_suggest(
    payload: AISuggestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Given a description (+ optional product_group & region),
    return AI-generated root cause, corrective action, preventive action.
    """

    # Fetch similar past cases from DB for context
    q = db.query(NccRecord).filter(NccRecord.root_cause != None)
    if payload.product_group:
        q = q.filter(NccRecord.product_group == payload.product_group)
    if payload.region:
        q = q.filter(NccRecord.region == payload.region)
    similar_cases = q.limit(3).all()

    # Build context from past cases
    context = ""
    if similar_cases:
        context = "\n\nSimilar past NCC cases for reference:\n"
        for i, case in enumerate(similar_cases, 1):
            context += f"""
Case {i}:
  Description: {case.description}
  Root Cause: {case.root_cause}
  Corrective Action: {case.corrective_action}
  Preventive Action: {case.preventive_action}
"""

    system_prompt = """You are an expert quality engineer specializing in Non-Conformance Cases (NCC) 
for HVAC and building services. Analyse the given description and provide:
1. A concise root cause analysis
2. Specific corrective actions (numbered list)
3. Specific preventive actions (numbered list)

Be precise, actionable, and use industry terminology.
Respond in this exact format:

ROOT_CAUSE: <your root cause here>

CORRECTIVE_ACTION: <numbered list of corrective actions>

PREVENTIVE_ACTION: <numbered list of preventive actions>"""

    user_prompt = f"""Product Group: {payload.product_group or 'Not specified'}
Region: {payload.region or 'Not specified'}
Description: {payload.description}
{context}

Analyse this NCC case and provide root cause, corrective action, and preventive action."""

    raw = call_ollama(user_prompt, system_prompt)

    # Parse the structured response
    def extract_section(text: str, key: str) -> str:
        try:
            start = text.index(f"{key}:") + len(f"{key}:")
            # Find the next key or end of string
            next_keys = ["ROOT_CAUSE:", "CORRECTIVE_ACTION:", "PREVENTIVE_ACTION:"]
            end = len(text)
            for nk in next_keys:
                if nk != f"{key}:" and nk in text[start:]:
                    candidate = text.index(nk, start)
                    if candidate < end:
                        end = candidate
            return text[start:end].strip()
        except ValueError:
            return text.strip()

    root_cause        = extract_section(raw, "ROOT_CAUSE")
    corrective_action = extract_section(raw, "CORRECTIVE_ACTION")
    preventive_action = extract_section(raw, "PREVENTIVE_ACTION")

    # Fallback if parsing fails
    if not root_cause:
        root_cause = raw
    if not corrective_action:
        corrective_action = "Please review AI response manually."
    if not preventive_action:
        preventive_action = "Please review AI response manually."

    return AISuggestResponse(
        root_cause=root_cause,
        corrective_action=corrective_action,
        preventive_action=preventive_action,
    )


# ── POST /ai/chat ─────────────────────────────────────────────────────────────

@router.post("/chat", response_model=AIChatResponse)
def ai_chat(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Answer a natural language question about NCC data.
    Queries the DB for relevant records and passes them as context to Ollama.
    """

    question = payload.question.lower()

    # Smart DB query based on question keywords
    q = db.query(NccRecord)

    # Filter by product group if mentioned
    for pg in ["retrofit", "amc", "installation", "spare parts"]:
        if pg in question:
            q = q.filter(func.lower(NccRecord.product_group) == pg)
            break

    # Filter by region if mentioned
    for region in ["north", "south", "east", "west"]:
        if region in question:
            q = q.filter(func.lower(NccRecord.region) == region)
            break

    # Filter by location if mentioned
    for city in ["mumbai", "delhi", "bangalore", "chennai", "hyderabad", "pune", "kolkata"]:
        if city in question:
            q = q.filter(func.lower(NccRecord.location) == city)
            break

    # Filter by status if mentioned
    if "open" in question:
        q = q.filter(NccRecord.status == "open")
    elif "closed" in question:
        q = q.filter(NccRecord.status == "closed")
    elif "progress" in question or "in progress" in question:
        q = q.filter(NccRecord.status == "progress")

    # Fetch up to 20 relevant records
    records = q.limit(20).all()

    # Build summary stats for context
    total = db.query(NccRecord).count()
    total_amount = db.query(func.sum(NccRecord.amount)).scalar() or 0
    open_count   = db.query(NccRecord).filter(NccRecord.status == "open").count()

    # Build DB context string
    db_context = f"""
NCC Database Summary:
- Total records: {total}
- Total NCC amount: ₹{total_amount:,.0f}
- Open cases: {open_count}

Relevant records for this query ({len(records)} found):
"""
    for r in records:
        db_context += f"""
- SO: {r.so_number} | Customer: {r.customer_name} | Region: {r.region} | 
  Location: {r.location} | Product: {r.product_group} | Amount: ₹{r.amount:,.0f} | 
  Quarter: {r.quarter_year} | Status: {r.status} | 
  Root Cause: {r.root_cause or 'Not set'} | 
  Corrective Action: {r.corrective_action or 'Not set'}
"""

    system_prompt = """You are an NCC (Non-Conformance Cases) data analyst assistant. 
You have access to the company's NCC database. Answer questions clearly and concisely.
Use bullet points, numbers, and ₹ symbol for amounts. 
Be specific with numbers from the data provided.
If data is insufficient, say so clearly."""

    user_prompt = f"""{db_context}

User question: {payload.question}

Answer based on the data above."""

    answer = call_ollama(user_prompt, system_prompt)

    return AIChatResponse(answer=answer)