# backend/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import numpy as np
import io

from km_engine import KubelkaMunkEngine
from kiln_engine import KilnEngine
from advanced_kiln_engine import AdvancedKilnEngine
from sculpture_engine import SculptureEngine
from pdf_generator import generate_paint_recipe, generate_kiln_recipe
from batch_processor import BatchProcessor
from database import get_db, Pigment, Glaze, ClayBody, SculptureMaterial

app = FastAPI(title="Alchemist's Palette API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================
# ROOT
# =============================================

@app.get("/")
async def root():
    return {"status": "Alchemist's Palette Engine is running."}

# =============================================
# PIGMENT ENDPOINTS
# =============================================

@app.get("/api/pigments")
async def get_pigments(db: Session = Depends(get_db)):
    pigments = db.query(Pigment).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "pigment_index": p.pigment_index,
            "k": [float(x) for x in p.k_values.split(",")],
            "s": [float(x) for x in p.s_values.split(",")]
        } for p in pigments
    ]

class MixRequest(BaseModel):
    pigment1_k: list[float]
    pigment1_s: list[float]
    pigment2_k: list[float]
    pigment2_s: list[float]
    ratio: float

@app.post("/api/mix")
async def mix_colors(request: MixRequest):
    p1 = {'k': np.array(request.pigment1_k), 's': np.array(request.pigment1_s)}
    p2 = {'k': np.array(request.pigment2_k), 's': np.array(request.pigment2_s)}
    hex_color, rgb = KubelkaMunkEngine.mix_pigments(p1, p2, request.ratio)
    return {"hex": hex_color, "rgb": rgb, "message": "Physical simulation complete."}

class AgeRequest(BaseModel):
    rgb: list[int]
    years: int
    binder: str = "linseed"

@app.post("/api/age")
async def age_color(request: AgeRequest):
    aged_rgb = KubelkaMunkEngine.simulate_aging(request.rgb, request.years, request.binder)
    hex_color = '#{:02x}{:02x}{:02x}'.format(aged_rgb[0], aged_rgb[1], aged_rgb[2])
    return {"hex": hex_color, "rgb": aged_rgb, "years_simulated": request.years}

# =============================================
# KILN ENDPOINTS
# =============================================

@app.get("/api/glazes")
async def get_glazes(db: Session = Depends(get_db)):
    glazes = db.query(Glaze).all()
    return [
        {
            "id": g.id, "name": g.name,
            "silica": g.silica, "alumina": g.alumina, "flux": g.flux,
            "colorant": g.colorant, "base_color_hex": g.base_color_hex
        } for g in glazes
    ]

@app.get("/api/clays")
async def get_clays(db: Session = Depends(get_db)):
    clays = db.query(ClayBody).all()
    return [
        {
            "id": c.id, "name": c.name, "clay_type": c.clay_type,
            "firing_range_min": c.firing_range_min, "firing_range_max": c.firing_range_max
        } for c in clays
    ]

class FireRequest(BaseModel):
    glaze_id: int
    clay_id: int
    cone_temp: int

@app.post("/api/fire")
async def fire_kiln(request: FireRequest, db: Session = Depends(get_db)):
    glaze = db.query(Glaze).filter(Glaze.id == request.glaze_id).first()
    clay = db.query(ClayBody).filter(ClayBody.id == request.clay_id).first()
    if not glaze or not clay:
        return {"error": "Glaze or clay not found"}
    
    glaze_result = KilnEngine.simulate_glaze_melt(glaze.silica, glaze.alumina, glaze.flux, request.cone_temp)
    clay_result = KilnEngine.predict_clay_shrinkage(clay.clay_type, request.cone_temp)
    
    # Advanced: Thermal shock prediction
    thermal_shock = AdvancedKilnEngine.predict_thermal_shock(clay.clay_type, request.cone_temp)
    
    # Advanced: Glaze crawling prediction
    crawl = AdvancedKilnEngine.predict_glaze_crawling(glaze.silica, glaze.alumina, glaze.flux)
    
    base_r = int(glaze.base_color_hex[1:3], 16)
    base_g = int(glaze.base_color_hex[3:5], 16)
    base_b = int(glaze.base_color_hex[5:7], 16)
    final_r = max(0, min(255, base_r + glaze_result["color_shift"][0]))
    final_g = max(0, min(255, base_g + glaze_result["color_shift"][1]))
    final_b = max(0, min(255, base_b + glaze_result["color_shift"][2]))
    final_hex = '#{:02x}{:02x}{:02x}'.format(final_r, final_g, final_b)
    
    return {
        "glaze_name": glaze.name, "clay_name": clay.name,
        "cone_temp": request.cone_temp,
        "maturity": glaze_result["maturity"], "surface": glaze_result["surface"],
        "shrinkage_percent": clay_result["shrinkage_percent"],
        "vitrification": clay_result["vitrification"],
        "final_color_hex": final_hex,
        "thermal_shock": thermal_shock,
        "glaze_crawling": crawl
    }

# =============================================
# SCULPTURE ENDPOINTS
# =============================================

@app.get("/api/sculpture-materials")
async def get_sculpture_materials(db: Session = Depends(get_db)):
    materials = db.query(SculptureMaterial).all()
    return [
        {
            "id": m.id, "name": m.name, "density": m.density,
            "yield_strength": m.yield_strength, "compressive_strength": m.compressive_strength
        } for m in materials
    ]

class SculptureAnalysisRequest(BaseModel):
    material_id: int
    height_m: float
    width_m: float
    depth_m: float
    arm_extension_m: float = 0
    arm_height_m: float = 0

@app.post("/api/analyze-sculpture")
async def analyze_sculpture(request: SculptureAnalysisRequest, db: Session = Depends(get_db)):
    material = db.query(SculptureMaterial).filter(SculptureMaterial.id == request.material_id).first()
    if not material:
        return {"error": "Material not found"}
    result = SculptureEngine.analyze_sculpture(
        material.density, material.yield_strength,
        request.height_m, request.width_m, request.depth_m,
        request.arm_extension_m, request.arm_height_m
    )
    return {"material_name": material.name, "analysis": result}

# =============================================
# PDF EXPORT ENDPOINTS
# =============================================

class PaintRecipeRequest(BaseModel):
    recipe_name: str
    pigment1_name: str
    pigment2_name: str
    ratio: float
    years_simulated: int
    aged_hex: str

@app.post("/api/export/paint-recipe")
async def export_paint_recipe(request: PaintRecipeRequest):
    filename = generate_paint_recipe(
        request.recipe_name, request.pigment1_name, request.pigment2_name,
        request.ratio, request.years_simulated, request.aged_hex
    )
    return FileResponse(filename, media_type='application/pdf', filename=filename)

class KilnRecipeRequest(BaseModel):
    recipe_name: str
    glaze_name: str
    clay_name: str
    cone_temp: int
    maturity: float
    surface: str
    shrinkage: float
    final_hex: str

@app.post("/api/export/kiln-recipe")
async def export_kiln_recipe(request: KilnRecipeRequest):
    filename = generate_kiln_recipe(
        request.recipe_name, request.glaze_name, request.clay_name,
        request.cone_temp, request.maturity, request.surface,
        request.shrinkage, request.final_hex
    )
    return FileResponse(filename, media_type='application/pdf', filename=filename)

# =============================================
# BATCH PROCESSING ENDPOINTS (NEW)
# =============================================

class BatchPaintRequest(BaseModel):
    recipes: list[dict]

@app.post("/api/export/batch-paint")
async def export_batch_paint(request: BatchPaintRequest):
    if len(request.recipes) > 100:
        return {"error": "Maximum 100 recipes per batch"}
    zip_bytes = BatchProcessor.generate_batch_paint_recipes(request.recipes)
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=paint_recipes_batch.zip"}
    )

class BatchKilnRequest(BaseModel):
    recipes: list[dict]

@app.post("/api/export/batch-kiln")
async def export_batch_kiln(request: BatchKilnRequest):
    if len(request.recipes) > 100:
        return {"error": "Maximum 100 recipes per batch"}
    zip_bytes = BatchProcessor.generate_batch_kiln_recipes(request.recipes)
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=kiln_recipes_batch.zip"}
    )