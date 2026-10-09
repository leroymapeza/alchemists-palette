# backend/advanced_kiln_engine.py
import numpy as np

class AdvancedKilnEngine:
    """
    Advanced ceramic physics: thermal shock and glaze crawling prediction.
    """
    
    @staticmethod
    def predict_thermal_shock(clay_type, cone_temp, quench_temp=20):
        """
        Predicts if a piece will crack when removed from kiln.
        Based on thermal gradient and material thermal shock resistance.
        """
        # Thermal shock resistance values (higher = more resistant)
        shock_resistance = {
            "earthenware": 150,
            "stoneware": 250,
            "porcelain": 180
        }
        
        resistance = shock_resistance.get(clay_type.lower(), 200)
        
        # Temperature delta
        delta_t = cone_temp - quench_temp
        
        # Thermal stress calculation (simplified)
        # Stress proportional to delta_T, inversely proportional to resistance
        stress_factor = delta_t / resistance
        
        # Determine risk level
        if stress_factor < 2.0:
            risk = "low"
            recommendation = "Safe to remove. Cool naturally for best results."
        elif stress_factor < 3.5:
            risk = "moderate"
            recommendation = "Allow to cool slowly in kiln. Crack risk is present."
        elif stress_factor < 5.0:
            risk = "high"
            recommendation = "DO NOT remove hot. Cool overnight in closed kiln."
        else:
            risk = "critical"
            recommendation = "Extremely high crack risk. Piece may shatter."
        
        return {
            "delta_temperature": delta_t,
            "stress_factor": round(stress_factor, 2),
            "risk_level": risk,
            "recommendation": recommendation
        }
    
    @staticmethod
    def predict_glaze_crawling(glaze_silica, glaze_alumina, glaze_flux, surface_tension_factor=1.0):
        """
        Predicts glaze crawling (when glaze pulls away from surface).
        Based on Si:Al ratio and flux content.
        """
        # High alumina + low flux = crawling risk
        si_al_ratio = glaze_silica / (glaze_alumina + 0.01)
        
        # Ideal ratio is 5-8:1 for most glazes
        if si_al_ratio < 4:
            base_risk = 0.7  # High risk (too much alumina)
        elif si_al_ratio > 12:
            base_risk = 0.5  # Moderate risk (too runny)
        else:
            base_risk = 0.1  # Low risk (ideal)
        
        # Flux modifier (too much flux increases crawling)
        if glaze_flux > 30:
            base_risk += 0.3
        elif glaze_flux < 15:
            base_risk += 0.2
        
        # Apply surface tension factor (dirty/waxy surfaces increase risk)
        final_risk = min(1.0, base_risk * surface_tension_factor)
        
        if final_risk < 0.2:
            severity = "none"
            description = "Glaze should adhere well to surface."
        elif final_risk < 0.4:
            severity = "low"
            description = "Minor crawling possible. Ensure clean bisqueware."
        elif final_risk < 0.6:
            severity = "moderate"
            description = "Crawling likely. Add 2-3% more flux or reduce alumina."
        elif final_risk < 0.8:
            severity = "high"
            description = "Severe crawling expected. Reformulate glaze."
        else:
            severity = "critical"
            description = "Glaze will definitely crawl. Do not fire."
        
        return {
            "si_al_ratio": round(si_al_ratio, 2),
            "crawl_risk": round(final_risk * 100, 1),
            "severity": severity,
            "description": description,
            "recommendation": AdvancedKilnEngine._get_crawl_recommendation(severity, si_al_ratio, glaze_flux)
        }
    
    @staticmethod
    def _get_crawl_recommendation(severity, si_al_ratio, flux):
        if severity in ["none", "low"]:
            return "No action needed."
        elif si_al_ratio < 4:
            return f"Reduce alumina or increase silica. Current Si:Al ratio ({si_al_ratio:.1f}:1) is too low."
        elif flux > 30:
            return f"Reduce flux content. Current flux ({flux}%) is too high, causing surface tension issues."
        else:
            return "Ensure bisqueware is clean, dust-free, and not too absorbent."