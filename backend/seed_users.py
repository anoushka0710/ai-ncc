"""
Run this ONCE to seed the database with test users.
Usage: python seed_users.py

Creates:
  - admin  / admin123  (role: writer)
  - viewer / view123  (role: reader)
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from passlib.context import CryptContext
from database import SessionLocal, engine, Base
import models

# Ensure tables exist
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SEED_USERS = [
    {"username": "admin",  "password": "admin123", "role": "writer"},
    {"username": "viewer", "password": "view123",  "role": "reader"},
]


def seed():
    db = SessionLocal()
    try:
        for u in SEED_USERS:
            exists = db.query(models.User).filter(models.User.username == u["username"]).first()
            if exists:
                print(f"  [SKIP] User '{u['username']}' already exists.")
                continue

            user = models.User(
                username=u["username"],
                password_hash=pwd_context.hash(u["password"]),
                role=u["role"],
            )
            db.add(user)
            print(f"  [ADD]  User '{u['username']}' with role '{u['role']}' created.")

        db.commit()
        print("\nSeeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()