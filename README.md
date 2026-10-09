# 🎨⚗️ Alchemist's Palette
### Fine Arts Material Science Simulator

**Alchemist's Palette** is a full-stack, professional-grade web application designed for traditional fine artists, ceramicists, and sculptors. It bridges the gap between artistic creation and material science, allowing creators to simulate physical material properties, chemical aging, kiln firing, and structural integrity before touching physical materials.

![Alchemist's Palette Logo](https://img.shields.io/badge/Status-Production_Ready-success)
![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)

---

## ✨ Features

### 🎨 Paint Mixing & Aging (Chroma & Chronos Engine)
- **Physics-Based Mixing:** Uses the Kubelka-Munk theory of light scattering to simulate real-world subtractive color mixing (no muddy digital RGB blending).
- **Time Travel Aging:** Simulates how linseed oil yellows and pigments fade under UV light over 0 to 150 years.
- **Material Database:** Pre-loaded with real-world pigment data (K/S values).

### 🔥 Kiln Simulator (Advanced Ceramic Physics)
- **Glaze Chemistry:** Predicts glaze maturity, surface quality (matte/glossy), and color shifts based on silica/alumina/flux ratios and temperature.
- **Thermal Shock Prediction:** Calculates the risk of cracking when removing pieces from the kiln.
- **Glaze Crawling Analysis:** Predicts if a glaze will pull away from the bisqueware based on surface tension and chemistry.
- **Clay Shrinkage:** Calculates vitrification and shrinkage rates for different clay bodies.

###  Sculpture Structural Analysis
- **Stress & Weight Calculation:** Computes total weight, center of gravity, and compressive stress at the base.
- **Cantilever Bending:** Analyzes arm extensions to predict bending moments and structural failure.
- **Safety Warnings:** Real-time alerts for high-risk structural configurations.

###  3D STL Viewer
- **Model Visualization:** Upload any `.stl` file to preview sculptures in 3D.
- **Material Preview:** Render models with realistic Bronze, Marble, Plaster, Steel, or Granite shaders.
- **Professional Controls:** Auto-rotate, wireframe mode, explicit zoom in/out scaling, lighting adjustment, and camera reset.

### 📦 Batch Processing & Export
- **Recipe Cards:** Export individual paint or kiln recipes as beautifully formatted PDFs.
- **Batch ZIP Export:** Save up to 100 recipes to a queue and export them all at once as a single ZIP file (perfect for workshops and teaching).

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Glassmorphism UI)
- **3D Rendering:** Three.js, React Three Fiber, Drei
- **Utilities:** JSZip, FileSaver, Lucide React (Icons)

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (via SQLAlchemy)
- **Math/Physics:** NumPy
- **PDF Generation:** FPDF2, Pillow

---

## 📁 Project Structure

```text
alchemists-palette/
├── backend/
│   ├── main.py                  # FastAPI endpoints
│   ├── database.py              # SQLAlchemy models & DB setup
│   ├── km_engine.py             # Kubelka-Munk color physics
│   ├── kiln_engine.py           # Basic kiln physics
│   ├── advanced_kiln_engine.py  # Thermal shock & crawling physics
│   ├── sculpture_engine.py      # Structural integrity physics
│   ├── pdf_generator.py         # Single PDF generation
│   ├── batch_processor.py       # Batch ZIP generation
│   ├── seed_db.py               # Seeds paint pigments
│   ├── seed_kiln_db.py          # Seeds glazes and clays
│   └── seed_sculpture_db.py     # Seeds sculpture materials
── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main React UI
│   │   └── index.css            # Tailwind imports
│   ├── package.json
│   └── vite.config.ts
└── README.md