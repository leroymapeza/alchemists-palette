# backend/seed_kiln_db.py
from database import SessionLocal, Glaze, ClayBody

def seed():
    db = SessionLocal()
    
    # Clear existing data
    db.query(Glaze).delete()
    db.query(ClayBody).delete()
    
    # Add glazes
    glazes = [
        {
            "name": "Tenmoku (Iron Black)",
            "silica": 60.0,
            "alumina": 15.0,
            "flux": 25.0,
            "colorant": "Iron Oxide 8%",
            "base_color_hex": "#3d2817"  # Dark brown before firing
        },
        {
            "name": "Celadon (Green)",
            "silica": 65.0,
            "alumina": 12.0,
            "flux": 23.0,
            "colorant": "Iron Oxide 2%",
            "base_color_hex": "#8fbc8f"  # Pale green
        },
        {
            "name": "Shino (Orange)",
            "silica": 55.0,
            "alumina": 18.0,
            "flux": 27.0,
            "colorant": "Iron Oxide 3%",
            "base_color_hex": "#d2691e"  # Orange-brown
        },
        {
            "name": "Clear Gloss",
            "silica": 62.0,
            "alumina": 14.0,
            "flux": 24.0,
            "colorant": "None",
            "base_color_hex": "#ffffff"  # White
        }
    ]
    
    for g in glazes:
        db.add(Glaze(**g))
    
    # Add clay bodies
    clays = [
        {
            "name": "Standard Stoneware",
            "clay_type": "stoneware",
            "firing_range_min": 1190,
            "firing_range_max": 1240
        },
        {
            "name": "Porcelain",
            "clay_type": "porcelain",
            "firing_range_min": 1260,
            "firing_range_max": 1320
        },
        {
            "name": "Earthenware (Terra Cotta)",
            "clay_type": "earthenware",
            "firing_range_min": 1000,
            "firing_range_max": 1150
        }
    ]
    
    for c in clays:
        db.add(ClayBody(**c))
    
    db.commit()
    db.close()
    print("✅ Kiln database seeded with 4 glazes and 3 clay bodies!")

if __name__ == "__main__":
    seed()