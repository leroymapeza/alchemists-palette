# backend/batch_processor.py
import zipfile
import io
from fpdf import FPDF
from datetime import datetime

class BatchProcessor:
    """
    Generates multiple recipe PDFs in a single ZIP file.
    """
    
    @staticmethod
    def generate_batch_paint_recipes(recipes):
        """
        recipes: list of dicts with paint recipe data
        Returns: bytes of a ZIP file containing all PDFs
        """
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for i, recipe in enumerate(recipes):
                pdf = BatchProcessor._create_paint_pdf(recipe)
                pdf_bytes = pdf.output(dest='S')
                if isinstance(pdf_bytes, str):
                    pdf_bytes = pdf_bytes.encode('latin-1')
                
                safe_name = "".join(c for c in recipe.get('recipe_name', f'recipe_{i}') if c.isalnum() or c in ' -_')
                filename = f"{safe_name}_{i+1}.pdf"
                zip_file.writestr(filename, pdf_bytes)
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
    
    @staticmethod
    def generate_batch_kiln_recipes(recipes):
        """
        recipes: list of dicts with kiln recipe data
        Returns: bytes of a ZIP file containing all PDFs
        """
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for i, recipe in enumerate(recipes):
                pdf = BatchProcessor._create_kiln_pdf(recipe)
                pdf_bytes = pdf.output(dest='S')
                if isinstance(pdf_bytes, str):
                    pdf_bytes = pdf_bytes.encode('latin-1')
                
                safe_name = "".join(c for c in recipe.get('recipe_name', f'firing_{i}') if c.isalnum() or c in ' -_')
                filename = f"{safe_name}_{i+1}.pdf"
                zip_file.writestr(filename, pdf_bytes)
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
    
    @staticmethod
    def _create_paint_pdf(recipe):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, "Alchemist's Palette - Recipe Card", 0, 1, 'C')
        pdf.set_font('Arial', 'I', 10)
        pdf.cell(0, 5, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 0, 1, 'C')
        pdf.ln(5)
        
        pdf.set_font('Arial', 'B', 18)
        pdf.cell(0, 15, recipe.get('recipe_name', 'Untitled'), 0, 1, 'C')
        pdf.ln(10)
        
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, "Materials", 0, 1)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 8, f"Pigment 1: {recipe.get('pigment1_name', 'N/A')}", 0, 1)
        pdf.cell(0, 8, f"Pigment 2: {recipe.get('pigment2_name', 'N/A')}", 0, 1)
        ratio = recipe.get('ratio', 0.5)
        pdf.cell(0, 8, f"Mixing Ratio: {int(ratio * 100)}% / {int((1-ratio) * 100)}%", 0, 1)
        pdf.ln(5)
        
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, "Predicted Results", 0, 1)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 8, f"After {recipe.get('years_simulated', 0)} years: {recipe.get('aged_hex', 'N/A')}", 0, 1)
        
        return pdf
    
    @staticmethod
    def _create_kiln_pdf(recipe):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, "Alchemist's Palette - Kiln Recipe", 0, 1, 'C')
        pdf.set_font('Arial', 'I', 10)
        pdf.cell(0, 5, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 0, 1, 'C')
        pdf.ln(5)
        
        pdf.set_font('Arial', 'B', 18)
        pdf.cell(0, 15, recipe.get('recipe_name', 'Untitled'), 0, 1, 'C')
        pdf.ln(10)
        
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, "Materials", 0, 1)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 8, f"Glaze: {recipe.get('glaze_name', 'N/A')}", 0, 1)
        pdf.cell(0, 8, f"Clay: {recipe.get('clay_name', 'N/A')}", 0, 1)
        pdf.cell(0, 8, f"Temperature: {recipe.get('cone_temp', 'N/A')}°C", 0, 1)
        pdf.ln(5)
        
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, "Results", 0, 1)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 8, f"Maturity: {recipe.get('maturity', 'N/A')}%", 0, 1)
        pdf.cell(0, 8, f"Surface: {recipe.get('surface', 'N/A')}", 0, 1)
        pdf.cell(0, 8, f"Shrinkage: {recipe.get('shrinkage', 'N/A')}%", 0, 1)
        
        return pdf