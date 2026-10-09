# backend/seed_sculpture_db.py
from database import SessionLocal, SculptureMaterial

def seed():
    db = SessionLocal()
    
    # Clear existing data
    db.query(SculptureMaterial).delete()
    
    materials = [
        {
            "name": "Bronze",
            "density": 8800,  # kg/m³
            "yield_strength": 250,  # MPa
            "compressive_strength": 400
        },
        {
            "name": "Marble",
            "density": 2700,
            "yield_strength": 50,
            "compressive_strength": 150
        },
        {
            "name": "Plaster",
            "density": 1200,
            "yield_strength": 5,
            "compressive_strength": 30
        },
        {
            "name": "Steel",
            "density": 7850,
            "yield_strength": 400,
            "compressive_strength": 600
        },
        {
            "name": "Granite",
            "density": 2750,
            "yield_strength": 60,
            "compressive_strength": 200
        }
    ]
    
    for m in materials:
        db.add(SculptureMaterial(**m))
    
    db.commit()
    db.close()
    print("✅ Sculpture database seeded with 5 materials!")

if __name__ == "__main__":
    seed()