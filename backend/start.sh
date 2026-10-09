#!/bin/bash
# Seed the database on every startup to prevent ephemeral storage from wiping it
python seed_db.py
python seed_kiln_db.py
python seed_sculpture_db.py

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port $PORT