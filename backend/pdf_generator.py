# backend/pdf_generator.py
from fpdf import FPDF
from datetime import datetime

class RecipePDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, "Alchemist's Palette - Recipe Card", 0, 1, 'C')
        self.set_font('Arial', 'I', 10)
        self.cell(0, 5, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_paint_recipe(recipe_name, pigment1_name, pigment2_name, ratio, years_simulated, aged_hex):
    pdf = RecipePDF()
    pdf.add_page()
    
    # Recipe Title
    pdf.set_font('Arial', 'B', 20)
    pdf.cell(0, 15, recipe_name, 0, 1, 'C')
    pdf.ln(10)
    
    # Materials Section
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, "Materials", 0, 1)
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 8, f"Pigment 1: {pigment1_name}", 0, 1)
    pdf.cell(0, 8, f"Pigment 2: {pigment2_name}", 0, 1)
    pdf.cell(0, 8, f"Mixing Ratio: {int(ratio * 100)}% / {int((1-ratio) * 100)}%", 0, 1)
    pdf.ln(5)
    
    # Results Section
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, "Predicted Results", 0, 1)
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 8, f"Fresh Color: (See attached swatch)", 0, 1)
    pdf.cell(0, 8, f"After {years_simulated} years: {aged_hex}", 0, 1)
    pdf.ln(5)
    
    # Notes Section
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, "Notes", 0, 1)
    pdf.set_font('Arial', '', 11)
    pdf.multi_cell(0, 6, 
        "This recipe was generated using Kubelka-Munk physical pigment mixing theory. "
        "The aging simulation accounts for linseed oil yellowing and UV light degradation. "
        "Actual results may vary based on environmental conditions, binder quality, and application thickness."
    )
    
    # Save PDF
    filename = f"paint_recipe_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf.output(filename)
    return filename

def generate_kiln_recipe(recipe_name, glaze_name, clay_name, cone_temp, maturity, surface, shrinkage, final_hex):
    pdf = RecipePDF()
    pdf.add_page()
    
    # Recipe Title
    pdf.set_font('Arial', 'B', 20)
    pdf.cell(0, 15, recipe_name, 0, 1, 'C')
    pdf.ln(10)
    
    # Materials Section
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, "Materials", 0, 1)
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 8, f"Glaze: {glaze_name}", 0, 1)
    pdf.cell(0, 8, f"Clay Body: {clay_name}", 0, 1)
    pdf.cell(0, 8, f"Firing Temperature: {cone_temp}°C", 0, 1)
    pdf.ln(5)
    
    # Results Section
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, "Kiln Results", 0, 1)
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 8, f"Maturity: {maturity}%", 0, 1)
    pdf.cell(0, 8, f"Surface Quality: {surface}", 0, 1)
    pdf.cell(0, 8, f"Clay Shrinkage: {shrinkage}%", 0, 1)
    pdf.cell(0, 8, f"Final Glaze Color: {final_hex}", 0, 1)
    pdf.ln(5)
    
    # Notes Section
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, "Notes", 0, 1)
    pdf.set_font('Arial', '', 11)
    pdf.multi_cell(0, 6, 
        "This recipe was generated using ceramic chemistry simulation. "
        "The maturity calculation is based on silica-alumina-flux ratios and firing temperature. "
        "Always test fire a small sample before committing to a full kiln load."
    )
    
    # Save PDF
    filename = f"kiln_recipe_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf.output(filename)
    return filename