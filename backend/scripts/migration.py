import os
from sqlalchemy import create_engine
from database import Base, DATABASE_URL 

def migrate_schema():
    print("connecting to Neon ")
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(engine)
    print("schema migrated to Neon successfully")

if __name__ == "__main__":
    migrate_schema()
        