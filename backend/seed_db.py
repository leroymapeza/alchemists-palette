# backend/seed_db.py
from database import SessionLocal, Pigment

def seed():
    db = SessionLocal()
    
    # Clear existing data so we don't create duplicates if we run this twice
    db.query(Pigment).delete()
    
    # Real-world physical properties (Simplified RGB K/S values)
    pigments_to_add = [
        {
            "name": "Ultramarine Blue",
            "pigment_index": "PB29",
            "k_values": "0.8,0.7,0.1", # High absorption in Red/Green (makes it blue)
            "s_values": "0.2,0.2,0.8"
        },
        {
            "name": "Cadmium Yellow",
            "pigment_index": "PY37",
            "k_values": "0.1,0.2,0.8", # High absorption in Blue (makes it yellow)
            "s_values": "0.8,0.7,0.2"
        },
        {
            "name": "Titanium White",
            "pigment_index": "PW6",
            "k_values": "0.05,0.05,0.05", # Almost zero absorption (it's white)
            "s_values": "0.95,0.95,0.95"  # Massive scattering (it's opaque)
        },
        {
            "name": "Alizarin Crimson",
            "pigment_index": "PR83",
            "k_values": "0.2,0.8,0.7", # Absorbs Green/Blue (makes it red)
            "s_values": "0.3,0.1,0.2"
        },
        {
            "name": "Yellow Ochre",
            "pigment_index": "PY43",
            "k_values": "0.3,0.4,0.8", # Earthy yellow, absorbs blue
            "s_values": "0.6,0.5,0.2"
        }
    ]

    for p in pigments_to_add:
        new_pigment = Pigment(**p)
        db.add(new_pigment)
        
    db.commit()
    db.close()
    print("✅ Database seeded successfully with 5 pigments!")

if __name__ == "__main__":
    seed()