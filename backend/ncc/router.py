import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import NccRecord
from schemas import NccRecordCreate, NccRecordUpdate, NccRecordOut, NccListResponse
from auth.dependencies import get_current_user, require_writer
from models import User

router = APIRouter(prefix="/ncc", tags=["NCC Records"])


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("", response_model=NccRecordOut, status_code=status.HTTP_201_CREATED)
def create_ncc_record(
    payload: NccRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_writer),   # writers only
):
    """Create a new NCC record. Writer role required."""
    record = NccRecord(**payload.model_dump(), created_by=current_user.id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── LIST (with filters + pagination) ─────────────────────────────────────────

@router.get("", response_model=NccListResponse)
def list_ncc_records(
    # filters
    quarter_year:      str | None = Query(None),
    region:            str | None = Query(None),
    location:          str | None = Query(None),
    product_group:     str | None = Query(None),
    service_portfolio: str | None = Query(None),
    cs_segment:        str | None = Query(None),
    status:            str | None = Query(None),
    # pagination
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    # auth - both roles can read
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List NCC records with optional filters and pagination."""
    q = db.query(NccRecord)

    if quarter_year:      q = q.filter(NccRecord.quarter_year      == quarter_year)
    if region:            q = q.filter(NccRecord.region            == region)
    if location:          q = q.filter(NccRecord.location          == location)
    if product_group:     q = q.filter(NccRecord.product_group     == product_group)
    if service_portfolio: q = q.filter(NccRecord.service_portfolio == service_portfolio)
    if cs_segment:        q = q.filter(NccRecord.cs_segment        == cs_segment)
    if status:            q = q.filter(NccRecord.status            == status)

    total = q.count()
    records = q.order_by(NccRecord.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return NccListResponse(total=total, page=page, limit=limit, records=records)


# ── GET SINGLE ────────────────────────────────────────────────────────────────

@router.get("/{record_id}", response_model=NccRecordOut)
def get_ncc_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single NCC record by ID."""
    record = db.query(NccRecord).filter(NccRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.put("/{record_id}", response_model=NccRecordOut)
def update_ncc_record(
    record_id: int,
    payload: NccRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_writer),   # writers only
):
    """Update an NCC record. Writer role required."""
    record = db.query(NccRecord).filter(NccRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # Only update fields that were actually sent (not None)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ncc_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_writer),   # writers only
):
    """Delete an NCC record. Writer role required."""
    record = db.query(NccRecord).filter(NccRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()


# ── EXPORT CSV ────────────────────────────────────────────────────────────────

@router.get("/export/csv")
def export_csv(
    quarter_year:      str | None = Query(None),
    region:            str | None = Query(None),
    location:          str | None = Query(None),
    product_group:     str | None = Query(None),
    service_portfolio: str | None = Query(None),
    cs_segment:        str | None = Query(None),
    status:            str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export filtered NCC records as a CSV file."""
    q = db.query(NccRecord)

    if quarter_year:      q = q.filter(NccRecord.quarter_year      == quarter_year)
    if region:            q = q.filter(NccRecord.region            == region)
    if location:          q = q.filter(NccRecord.location          == location)
    if product_group:     q = q.filter(NccRecord.product_group     == product_group)
    if service_portfolio: q = q.filter(NccRecord.service_portfolio == service_portfolio)
    if cs_segment:        q = q.filter(NccRecord.cs_segment        == cs_segment)
    if status:            q = q.filter(NccRecord.status            == status)

    records = q.order_by(NccRecord.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "ID", "SO Number", "Customer Name", "Amount", "Quarter-Year",
        "Region", "Location", "Product Group", "Service Portfolio",
        "CS Segment", "Description", "Root Cause", "Corrective Action",
        "Preventive Action", "Status", "Created At",
    ])

    for r in records:
        writer.writerow([
            r.id, r.so_number, r.customer_name, r.amount, r.quarter_year,
            r.region, r.location, r.product_group, r.service_portfolio,
            r.cs_segment, r.description, r.root_cause, r.corrective_action,
            r.preventive_action, r.status, r.created_at,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ncc_records.csv"},
    )