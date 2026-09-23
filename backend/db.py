"""
Database layer (SQLAlchemy). SQLite by default so the team doesn't need to
install/run a separate DB server for the demo; set DATABASE_URL to a
Postgres URL to swap it in later without touching any calling code.

Two tables:
  - queries         : one row per /chat request — a real usage log for the
                       report/demo ("N real queries our bot handled").
  - advisory_cache  : cache of the last successful live fetch per
                       (source, lat, lon, date), so repeat requests for the
                       same place/day don't re-hit the external API.

Import surface used by the rest of the app:
  init_db(), log_query(...), get_cached_advisory(...), cache_advisory(...)
"""

import os
import json
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, Float, String, Boolean, DateTime, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./orca.db")

# check_same_thread only matters for SQLite (FastAPI can use several threads).
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class QueryLog(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message = Column(Text, nullable=False)
    intent = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    date = Column(String, nullable=True)
    language = Column(String, nullable=True)
    response_text = Column(Text, nullable=True)
    is_live = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AdvisoryCache(Base):
    __tablename__ = "advisory_cache"
    __table_args__ = (
        Index("idx_cache_lookup", "source", "lat", "lon", "date"),
    )
    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)   # e.g. "open_meteo_marine", "pfz_incois"
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    date = Column(String, nullable=False)
    payload_json = Column(Text, nullable=False)
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    """Create tables if they don't exist yet. Safe to call on every app start."""
    Base.metadata.create_all(bind=engine)


def log_query(
    message: str,
    intent: str = None,
    location_name: str = None,
    lat: float = None,
    lon: float = None,
    date: str = None,
    language: str = None,
    response_text: str = None,
    is_live: bool = False,
):
    """Insert one row per /chat call. Never raises — logging must not break the demo."""
    session = SessionLocal()
    try:
        row = QueryLog(
            message=message,
            intent=intent,
            location_name=location_name,
            lat=lat,
            lon=lon,
            date=date,
            language=language,
            response_text=response_text,
            is_live=is_live,
        )
        session.add(row)
        session.commit()

    except Exception as e:
    # Swallow logging failures — a broken DB write should never break /chat.
        session.rollback()
        print(f"[Warning] Failed to log query to DB: {e}")
        
    finally:
        session.close()

def _format_coord(val: float, ndigits: int = 2) -> str:
    """Format coordinates to a fixed precision string for deterministic cache keying."""
    if val is None:
        return ""
    return f"{float(val):.{ndigits}f}"

def get_cached_advisory(source: str, lat: float, lon: float, date: str) -> dict | None:
    """Return a same-day cached payload for (source, lat, lon, date), or None."""
    session = SessionLocal()
    try:
        row = (
            session.query(AdvisoryCache)
            .filter(
                AdvisoryCache.source == source,
                AdvisoryCache.lat == _round(lat),
                AdvisoryCache.lon == _round(lon),
                AdvisoryCache.date == date,
            )
            .order_by(AdvisoryCache.fetched_at.desc())
            .first()
        )
        if row is None:
            return None
        try:
            return json.loads(row.payload_json)
        except (TypeError, ValueError):
            return None
    finally:
        session.close()


def cache_advisory(source: str, lat: float, lon: float, date: str, payload: dict):
    """Store a successful live fetch so the next same-day request reads it
    from the DB instead of calling the external API again."""
    session = SessionLocal()
    try:
        row = AdvisoryCache(
            source=source,
            lat=_round(lat),
            lon=_round(lon),
            date=date,
            payload_json=json.dumps(payload),
        )
        session.add(row)
        session.commit()
    except Exception:
        session.rollback()
    finally:
        session.close()
