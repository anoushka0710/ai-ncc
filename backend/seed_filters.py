"""
Run once to seed all dropdown filter options.
Usage: python seed_filters.py
"""

import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

FILTER_DATA = {
    "region": [
        ("North", "North"),
        ("South", "South"),
        ("East", "East"),
        ("West", "West"),
    ],
    "location": [
        ("Mumbai", "Mumbai"),
        ("Delhi", "Delhi"),
        ("Bangalore", "Bangalore"),
        ("Chennai", "Chennai"),
        ("Hyderabad", "Hyderabad"),
        ("Pune", "Pune"),
        ("Kolkata", "Kolkata"),
        ("Ahmedabad", "Ahmedabad"),
    ],
    "product_group": [
        ("RETROFIT", "Retrofit"),
        ("AMC", "AMC"),
        ("INSTALLATION", "Installation"),
        ("SPARE PARTS", "Spare Parts"),
    ],
    "service_portfolio": [
        ("Installation", "Installation"),
        ("Maintenance", "Maintenance"),
        ("Repair", "Repair"),
    ],
    "cs_segment": [
        ("Enterprise", "Enterprise"),
        ("SMB", "SMB"),
        ("Government", "Government"),
    ],
    "quarter_year": [
        ("Q1-2025", "Q1-2025"),
        ("Q2-2025", "Q2-2025"),
        ("Q3-2025", "Q3-2025"),
        ("Q4-2025", "Q4-2025"),
        ("Q1-2024", "Q1-2024"),
        ("Q2-2024", "Q2-2024"),
        ("Q3-2024", "Q3-2024"),
        ("Q4-2024", "Q4-2024"),
    ],
    "status": [
        ("open", "Open"),
        ("progress", "In Progress"),
        ("closed", "Closed"),
    ],
}


def seed():
    db = SessionLocal()
    try:
        # Clear existing filter options to avoid duplicates
        existing = db.query(models.FilterOption).count()
        if existing > 0:
            print(f"  [SKIP] {existing} filter options already exist. Delete them first to re-seed.")
            return

        count = 0
        for filter_type, options in FILTER_DATA.items():
            for value, label in options:
                db.add(models.FilterOption(
                    filter_type=filter_type,
                    value=value,
                    display_label=label,
                ))
                count += 1

        db.commit()
        print(f"  [ADD] {count} filter options seeded across {len(FILTER_DATA)} categories.")
        print("\nSeeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()