from database import engine, Base
import models


def init_db():
    """Create all tables defined on the SQLAlchemy `Base`."""
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")


if __name__ == "__main__":
    init_db()
