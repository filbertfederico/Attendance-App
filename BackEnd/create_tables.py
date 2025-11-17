# BackEnd/create_tables.py
from BackEnd.database import Base, engine
from BackEnd import models

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully.")

# To run this script, use:
# python BackEnd/create_tables.py