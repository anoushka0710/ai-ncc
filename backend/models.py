from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role          = Column(String, nullable=False)   # "writer" | "reader"
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    records = relationship("NccRecord", back_populates="creator")


class NccRecord(Base):
    __tablename__ = "ncc_records"

    id                 = Column(Integer, primary_key=True, index=True)
    so_number          = Column(String(10), nullable=False, index=True)
    customer_name      = Column(String(50), nullable=False)
    amount             = Column(Float, nullable=False)
    quarter_year       = Column(String, nullable=False)   # e.g. "Q1-2025"
    region             = Column(String, nullable=False)
    location           = Column(String, nullable=False)
    product_group      = Column(String, nullable=False)
    service_portfolio  = Column(String, nullable=False)
    cs_segment         = Column(String, nullable=False)
    description        = Column(Text, nullable=False)
    root_cause         = Column(Text, nullable=True)      # AI or manual
    corrective_action  = Column(Text, nullable=True)
    preventive_action  = Column(Text, nullable=True)
    status             = Column(String, default="open")   # open | closed | progress
    created_by         = Column(Integer, ForeignKey("users.id"))
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    updated_at         = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="records")


class FilterOption(Base):
    __tablename__ = "filter_options"

    id            = Column(Integer, primary_key=True, index=True)
    filter_type   = Column(String, nullable=False)   # "region" | "location" | etc.
    value         = Column(String, nullable=False)
    display_label = Column(String, nullable=False)