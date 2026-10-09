# backend/sculpture_engine.py
import math

class SculptureEngine:
    """
    Simplified structural analysis for sculpture.
    Calculates weight, center of gravity, and basic stress points.
    """
    
    @staticmethod
    def analyze_sculpture(
        material_density, 
        material_yield_strength,
        height_m, 
        width_m, 
        depth_m,
        arm_extension_m=0,
        arm_height_m=0
    ):
        """
        Analyzes structural integrity of a sculpture.
        
        Returns dict with:
        - weight_kg: Total weight
        - center_of_gravity: Height of CG from base (m)
        - max_stress_mpa: Maximum stress at base (MPa)
        - safety_factor: Ratio of yield strength to actual stress
        - status: "safe", "warning", or "critical"
        - warnings: List of structural warnings
        """
        
        # Calculate volume (simplified as rectangular prism)
        volume_m3 = height_m * width_m * depth_m
        
        # Calculate weight
        weight_kg = volume_m3 * material_density
        
        # Center of gravity (for uniform rectangular shape, it's at half height)
        cg_height = height_m / 2
        
        # Base area
        base_area_m2 = width_m * depth_m
        
        # Compressive stress at base (weight / area)
        # Convert weight to force (Newtons): F = m * g
        force_n = weight_kg * 9.81
        stress_mpa = (force_n / base_area_m2) / 1_000_000  # Convert Pa to MPa
        
        # Safety factor
        safety_factor = material_yield_strength / stress_mpa if stress_mpa > 0 else 999
        
        # Determine status
        if safety_factor > 3:
            status = "safe"
        elif safety_factor > 1.5:
            status = "warning"
        else:
            status = "critical"
        
        # Generate warnings
        warnings = []
        
        if arm_extension_m > 0:
            # Calculate bending moment at arm joint
            # Simplified: treat arm as cantilever beam
            arm_weight_kg = (arm_extension_m * 0.1 * 0.1 * 0.1) * material_density  # Assume 10cm x 10cm cross-section
            arm_force_n = arm_weight_kg * 9.81
            bending_moment = arm_force_n * arm_extension_m
            
            # Calculate bending stress (simplified)
            # For rectangular cross-section: σ = M * c / I
            # Where c = distance from neutral axis, I = moment of inertia
            arm_width = 0.1  # 10cm
            arm_height = 0.1
            moment_of_inertia = (arm_width * arm_height**3) / 12
            c = arm_height / 2
            bending_stress_mpa = (bending_moment * c / moment_of_inertia) / 1_000_000
            
            if bending_stress_mpa > material_yield_strength * 0.5:
                warnings.append(f"Arm extension ({arm_extension_m}m) creates high bending stress ({bending_stress_mpa:.1f} MPa). Consider internal armature.")
        
        if height_m / width_m > 5:
            warnings.append(f"Height-to-width ratio ({height_m/width_m:.1f}:1) is very tall. Ensure stable base.")
        
        if safety_factor < 2:
            warnings.append(f"Low safety factor ({safety_factor:.2f}). Structure may fail under its own weight.")
        
        return {
            "weight_kg": round(weight_kg, 2),
            "center_of_gravity_m": round(cg_height, 2),
            "max_stress_mpa": round(stress_mpa, 2),
            "safety_factor": round(safety_factor, 2),
            "status": status,
            "warnings": warnings
        }