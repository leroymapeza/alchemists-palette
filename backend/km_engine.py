import numpy as np

class KubelkaMunkEngine:
    """
    Simplified Two-Constant Kubelka-Munk model for RGB channels.
    Production version will use 400-700nm spectral data, 
    but this RGB approximation is perfect for the MVP.
    """
    
    @staticmethod
    def calculate_reflectance(k, s):
        """Calculates reflectance (R) from absorption (K) and scattering (S)."""
        # Avoid division by zero
        s = np.where(s == 0, 1e-6, s)
        a = 1 + (k / s)
        return a - np.sqrt(a**2 - 1)

    @staticmethod
    def mix_pigments(pigment1, pigment2, ratio):
        """
        Mixes two pigments based on their concentration ratio.
        """
        # Calculate weighted K and S for the mixture
        k_mix = (pigment1['k'] * ratio) + (pigment2['k'] * (1 - ratio))
        s_mix = (pigment1['s'] * ratio) + (pigment2['s'] * (1 - ratio))
        
        # Calculate final reflectance
        r_mix = KubelkaMunkEngine.calculate_reflectance(k_mix, s_mix)
        
        # Convert reflectance (0-1) to RGB hex
        rgb = np.clip(r_mix * 255, 0, 255).astype(int)
        hex_color = '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])
        
        return hex_color, rgb.tolist()

    @staticmethod
    def simulate_aging(rgb, years, binder="linseed"):
        """
        Simulates chemical degradation over time.
        """
        r, g, b = float(rgb[0]), float(rgb[1]), float(rgb[2])
        
        # 1. Binder Yellowing (Linseed oil naturally yellows, pushing colors warm)
        if binder == "linseed":
            # Yellow shift caps out after 100 years
            yellow_shift = min(years * 0.4, 40) 
            r = min(255, r + (yellow_shift * 0.9))
            g = min(255, g + (yellow_shift * 0.4))
            b = max(0, b - (yellow_shift * 1.2)) # Blue channel drops fastest
            
        # 2. UV Fading (Pigments lose chroma and shift toward raw canvas color)
        # Raw canvas hex is roughly #F4F1EA (RGB: 244, 241, 234)
        canvas_r, canvas_g, canvas_b = 244.0, 241.0, 234.0
        fade_factor = min(years / 150.0, 0.85) # Max 85% faded at 150 years
        
        r = r + (canvas_r - r) * fade_factor
        g = g + (canvas_g - g) * fade_factor
        b = b + (canvas_b - b) * fade_factor
        
        return [int(np.clip(r, 0, 255)), int(np.clip(g, 0, 255)), int(np.clip(b, 0, 255))]