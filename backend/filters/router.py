from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import FilterOption
from schemas import FilterOptionOut
from auth.dependencies import get_current_user
from models import User

router = APIRouter(prefix="/filters", tags=["Filters"])


@router.get("", response_model=list[FilterOptionOut])
def get_filters(
    filter_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all dropdown filter options.
    Optionally filter by type: region | location | product_group |
    service_portfolio | cs_segment | quarter_year | status
    """
    q = db.query(FilterOption)
    if filter_type:
        q = q.filter(FilterOption.filter_type == filter_type)
    return q.order_by(FilterOption.filter_type, FilterOption.display_label).all()