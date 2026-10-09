# backend/kiln_engine.py
import numpy as np

class KilnEngine:
    """
    Simulates ceramic glaze behavior at different firing temperatures.
    """
    
    @staticmethod
    def simulate_glaze_melt(glaze_silica, glaze_alumina, glaze_flux, cone_temp):
        """
        Predicts glaze maturity based on chemistry and temperature.
        
        cone_temp: Temperature in Celsius (e.g., Cone 6 = 1222°C, Cone 10 = 1305°C)
        
        Returns a dict with:
        - maturity: 0-100% (how well the glaze melts)
        - surface: "matte", "satin", "glossy", or "overfired"
        - color_shift: RGB adjustment based on temperature
        """
        
        # Simplified Unity Molecular Formula (UMF) calculation
        # Ideal glaze ratio: Silica:Alumina:Flux
        silica_ratio = glaze_silica / (glaze_alumina + 0.01)
        flux_ratio = glaze_flux / (glaze_alumina + 0.01)
        
        # Calculate maturity based on temperature and chemistry
        # Higher temp = more melting, higher flux = lower melting point
        base_maturity = (cone_temp - 1000) / 3.05  # Normalized to 0-100 range
        flux_modifier = flux_ratio * 10
        maturity = min(100, max(0, base_maturity + flux_modifier))
        
        # Determine surface quality
        if maturity < 30:
            surface = "underfired (dry, rough)"
        elif maturity < 60:
            surface = "matte"
        elif maturity < 85:
            surface = "satin"
        elif maturity < 95:
            surface = "glossy"
        else:
            surface = "overfired (running, blistered)"
        
        # Color shift: Higher temps push colors warmer (more red/orange)
        # This simulates how iron and other oxides react to heat
        temp_factor = (cone_temp - 1000) / 305.0  # 0 to 1
        color_shift = [
            int(temp_factor * 30),   # Red channel increases
            int(temp_factor * 10),   # Green channel slight increase
            int(-temp_factor * 20)   # Blue channel decreases
        ]
        
        return {
            "maturity": round(maturity, 1),
            "surface": surface,
            "color_shift": color_shift,
            "silica_ratio": round(silica_ratio, 2),
            "flux_ratio": round(flux_ratio, 2)
        }
    
    @staticmethod
    def predict_clay_shrinkage(clay_type, cone_temp):
        """
        Predicts clay body shrinkage based on type and firing temperature.
        """
        # Base shrinkage rates for common clay types
        shrinkage_rates = {
            "earthenware": 0.08,  # 8% total shrinkage
            "stoneware": 0.12,    # 12% total shrinkage
            "porcelain": 0.15     # 15% total shrinkage
        }
        
        base_rate = shrinkage_rates.get(clay_type.lower(), 0.10)
        
        # Adjust based on temperature (higher temp = more vitrification = more shrinkage)
        temp_factor = (cone_temp - 1000) / 305.0
        actual_shrinkage = base_rate * (0.7 + (temp_factor * 0.3))
        
        return {
            "shrinkage_percent": round(actual_shrinkage * 100, 1),
            "vitrification": "partial" if actual_shrinkage < 0.10 else "full"
        }