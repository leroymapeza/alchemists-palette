import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { saveAs } from 'file-saver'
import { 
  Palette, Flame, Box, FileBox, RotateCcw, Maximize, 
  Layers, Sun, Download, Save, Package, AlertTriangle, ZoomIn, ZoomOut,
  LoaderCircle, RefreshCw, CircleCheck, X
} from 'lucide-react'


const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://alchemists-palette-api.onrender.com'

interface Pigment { id: number; name: string; pigment_index: string; k: number[]; s: number[] }
interface Glaze { id: number; name: string; silica: number; alumina: number; flux: number; colorant: string; base_color_hex: string }
interface Clay { id: number; name: string; clay_type: string; firing_range_min: number; firing_range_max: number }
interface SculptureMaterial { id: number; name: string; density: number; yield_strength: number; compressive_strength: number }

// =============================================
// CUSTOM SVG LOGO COMPONENT
// =============================================
function AlchemistLogo({ size = 48 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className="drop-shadow-lg"
    >
      {/* Wooden Palette Background */}
      <path 
        d="M 50 15 C 75 15, 85 30, 85 50 C 85 70, 75 85, 50 85 C 30 85, 15 75, 15 55 C 15 45, 20 40, 28 40 C 32 40, 35 38, 35 35 C 35 25, 40 15, 50 15 Z" 
        fill="url(#woodGradient)"
        stroke="#8B6F47"
        strokeWidth="1.5"
      />
      
      {/* Wood grain texture */}
      <path d="M 25 50 Q 40 48, 55 52" stroke="#A0826D" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path d="M 30 60 Q 45 58, 60 62" stroke="#A0826D" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path d="M 35 70 Q 50 68, 65 72" stroke="#A0826D" strokeWidth="0.5" fill="none" opacity="0.4" />
      
      {/* Paint Wells */}
      <circle cx="72" cy="32" r="7" fill="#1e40af" stroke="#0f172a" strokeWidth="1" />
      <circle cx="78" cy="50" r="7" fill="#eab308" stroke="#0f172a" strokeWidth="1" />
      <circle cx="72" cy="68" r="7" fill="#ea580c" stroke="#0f172a" strokeWidth="1" />
      <circle cx="50" cy="78" r="7" fill="#dc2626" stroke="#0f172a" strokeWidth="1" />
      <circle cx="32" cy="72" r="7" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />
      
      {/* Paint well highlights */}
      <circle cx="70" cy="30" r="2" fill="#ffffff" opacity="0.3" />
      <circle cx="76" cy="48" r="2" fill="#ffffff" opacity="0.3" />
      <circle cx="70" cy="66" r="2" fill="#ffffff" opacity="0.3" />
      <circle cx="48" cy="76" r="2" fill="#ffffff" opacity="0.3" />
      <circle cx="30" cy="70" r="2" fill="#ffffff" opacity="0.3" />
      
      {/* Golden Alchemy Flask */}
      <path 
        d="M 45 25 L 45 40 L 30 65 L 30 72 L 70 72 L 70 65 L 55 40 L 55 25 Z" 
        fill="none"
        stroke="url(#goldGradient)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      
      {/* Flask inner structure (molecular bonds) */}
      <line x1="42" y1="55" x2="58" y2="55" stroke="url(#goldGradient)" strokeWidth="1.5" />
      <line x1="38" y1="62" x2="62" y2="62" stroke="url(#goldGradient)" strokeWidth="1.5" />
      <line x1="50" y1="40" x2="50" y2="72" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.6" />
      
      {/* Flask opening */}
      <line x1="43" y1="25" x2="57" y2="25" stroke="url(#goldGradient)" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="50%" stopColor="#C19A6B" />
          <stop offset="100%" stopColor="#A0826D" />
        </linearGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function STLModel({ url, material, wireframe, scale }: { url: string; material: string; wireframe: boolean; scale: number }) {
  const geometry = useLoader(STLLoader, url)
  geometry.computeBoundingBox()
  geometry.center()
  
  const colorMap: Record<string, string> = {
    'Bronze': '#cd7f32', 'Marble': '#f5f5f5', 'Plaster': '#e8e4d8', 'Steel': '#71797e', 'Granite': '#a9a9a9'
  }
  
  return (
    <mesh geometry={geometry} castShadow receiveShadow scale={scale}>
      <meshStandardMaterial 
        color={colorMap[material] || '#cccccc'} 
        metalness={material === 'Steel' || material === 'Bronze' ? 0.8 : 0.1} 
        roughness={material === 'Marble' ? 0.2 : 0.6}
        wireframe={wireframe}
      />
    </mesh>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<'paint' | 'kiln' | 'sculpture' | 'stl'>('paint')
  
  const [pigments, setPigments] = useState<Pigment[]>([])
  const [pigment1Id, setPigment1Id] = useState<number>(1)
  const [pigment2Id, setPigment2Id] = useState<number>(2)
  const [ratio, setRatio] = useState(0.5)
  const [years, setYears] = useState(0)
  const [mixedColor, setMixedColor] = useState('#1a1a1a')
  const [agedColor, setAgedColor] = useState('#1a1a1a')
  const [mixedRgb, setMixedRgb] = useState([0, 0, 0])
  const [loading, setLoading] = useState(false)
  const [savedPaintRecipes, setSavedPaintRecipes] = useState<any[]>([])
  
  const [glazes, setGlazes] = useState<Glaze[]>([])
  const [clays, setClays] = useState<Clay[]>([])
  const [selectedGlazeId, setSelectedGlazeId] = useState<number>(1)
  const [selectedClayId, setSelectedClayId] = useState<number>(1)
  const [coneTemp, setConeTemp] = useState<number>(1222)
  const [kilnResult, setKilnResult] = useState<any>(null)
  const [kilnLoading, setKilnLoading] = useState(false)
  const [savedKilnRecipes, setSavedKilnRecipes] = useState<any[]>([])
  
  const [sculptureMaterials, setSculptureMaterials] = useState<SculptureMaterial[]>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(1)
  const [sculptureHeight, setSculptureHeight] = useState<number>(1.0)
  const [sculptureWidth, setSculptureWidth] = useState<number>(0.5)
  const [sculptureDepth, setSculptureDepth] = useState<number>(0.5)
  const [armExtension, setArmExtension] = useState<number>(0)
  const [sculptureResult, setSculptureResult] = useState<any>(null)
  const [sculptureLoading, setSculptureLoading] = useState(false)
  
  const [stlUrl, setStlUrl] = useState<string>('')
  const [stlMaterial, setStlMaterial] = useState<string>('Bronze')
  const [autoRotate, setAutoRotate] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [lightIntensity, setLightIntensity] = useState(1.0)
  const [modelScale, setModelScale] = useState(1.0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const controlsRef = useRef<any>(null)
  
  const [batchLoading, setBatchLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [toast, setToast] = useState<{ message: string; kind: 'info' | 'error' } | null>(null)
  const [nameDialog, setNameDialog] = useState<{ title: string; value: string } | null>(null)
  const nameResolver = useRef<((v: string | null) => void) | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const mixSeq = useRef(0)

  const notify = (message: string, kind: 'info' | 'error' = 'info') => {
    setToast({ message, kind })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 4000)
  }

  const askName = (title: string, value: string) => new Promise<string | null>(resolve => {
    nameResolver.current = resolve
    setNameDialog({ title, value })
  })

  const closeName = (v: string | null) => {
    nameResolver.current?.(v?.trim() ? v.trim() : null)
    nameResolver.current = null
    setNameDialog(null)
  }

  const loadData = useCallback(() => {
    setApiStatus('loading')
    const get = <T,>(path: string) => fetch(`${API}${path}`).then(r => { if (!r.ok) throw new Error(path); return r.json() as Promise<T> })
    Promise.all([
      get<Pigment[]>('/api/pigments'), get<Glaze[]>('/api/glazes'),
      get<Clay[]>('/api/clays'), get<SculptureMaterial[]>('/api/sculpture-materials')
    ]).then(([p, g, c, m]) => {
      setPigments(p); setGlazes(g); setClays(c); setSculptureMaterials(m)
      if (p.length) { setPigment1Id(p[0].id); setPigment2Id((p[1] ?? p[0]).id) }
      if (g.length) setSelectedGlazeId(g[0].id)
      if (c.length) setSelectedClayId(c[0].id)
      if (m.length) setSelectedMaterialId(m[0].id)
      setApiStatus('ready')
    }).catch(() => setApiStatus('error'))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const pigment1 = pigments.find(p => p.id === pigment1Id)
  const pigment2 = pigments.find(p => p.id === pigment2Id)

  const mixPigments = async (silent = false) => {
    if (!pigment1 || !pigment2) return
    const seq = ++mixSeq.current
    if (!silent) setLoading(true)
    try {
      const mixRes = await fetch(`${API}/api/mix`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pigment1_k: pigment1.k, pigment1_s: pigment1.s, pigment2_k: pigment2.k, pigment2_s: pigment2.s, ratio })
      })
      if (!mixRes.ok) throw new Error('mix')
      const mixData = await mixRes.json()
      if (seq === mixSeq.current) { setMixedColor(mixData.hex); setMixedRgb(mixData.rgb); setAgedColor(mixData.hex) }
    } catch { if (!silent) notify('Mixing failed — check your connection and try again.', 'error') }
    if (!silent) setLoading(false)
  }
  const handleMix = () => mixPigments(false)

  useEffect(() => {
    if (!pigment1 || !pigment2) return
    const t = window.setTimeout(() => { mixPigments(true) }, 250)
    return () => window.clearTimeout(t)
  }, [pigment1Id, pigment2Id, ratio, pigments])

  useEffect(() => {
    if (mixedRgb[0] === 0 && mixedRgb[1] === 0 && mixedRgb[2] === 0) return
    let cancelled = false
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/age`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rgb: mixedRgb, years, binder: "linseed" })
        })
        if (!res.ok) throw new Error('age')
        const data = await res.json()
        if (!cancelled) setAgedColor(data.hex)
      } catch { /* aging preview is non-critical */ }
    }, 120)
    return () => { cancelled = true; window.clearTimeout(t) }
  }, [years, mixedRgb])

  const handleFire = async () => {
    setKilnLoading(true)
    try {
      const res = await fetch(`${API}/api/fire`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glaze_id: selectedGlazeId, clay_id: selectedClayId, cone_temp: coneTemp })
      })
      setKilnResult(await res.json())
    } catch { notify('Request failed — check your connection and try again.', 'error') }
    setKilnLoading(false)
  }

  const handleAnalyzeSculpture = async () => {
    if (![sculptureHeight, sculptureWidth, sculptureDepth].every(v => Number.isFinite(v) && v > 0)) { notify('Height, width and depth must be greater than zero.', 'error'); return }
    setSculptureLoading(true)
    try {
      const res = await fetch(`${API}/api/analyze-sculpture`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_id: selectedMaterialId, height_m: sculptureHeight, width_m: sculptureWidth, depth_m: sculptureDepth, arm_extension_m: armExtension })
      })
      setSculptureResult(await res.json())
    } catch { notify('Request failed — check your connection and try again.', 'error') }
    setSculptureLoading(false)
  }

  const handleSTLUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setStlUrl(URL.createObjectURL(file))
      setModelScale(1.0)
    }
  }

  const resetView = () => { 
    if (controlsRef.current) controlsRef.current.reset()
    setModelScale(1.0)
  }

  const exportSinglePaintRecipe = async () => {
    if (!pigment1 || !pigment2) return
    const recipeName = await askName("Recipe name", "My Paint Mixture")
    if (!recipeName) return
    try {
      const res = await fetch(`${API}/api/export/paint-recipe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_name: recipeName, pigment1_name: pigment1.name, pigment2_name: pigment2.name, ratio, years_simulated: years, aged_hex: agedColor })
      })
      saveAs(await res.blob(), `${recipeName}.pdf`)
    } catch { notify('Request failed — check your connection and try again.', 'error') }
  }

  const savePaintToBatch = async () => {
    if (!pigment1 || !pigment2) return
    const name = await askName("Recipe name", `Recipe ${savedPaintRecipes.length + 1}`)
    if (!name) return
    setSavedPaintRecipes([...savedPaintRecipes, { recipe_name: name, pigment1_name: pigment1.name, pigment2_name: pigment2.name, ratio, years_simulated: years, aged_hex: agedColor }])
  }

  const exportBatchPaint = async () => {
    if (savedPaintRecipes.length === 0) { notify('No recipes saved yet — press Save first.'); return }
    setBatchLoading(true)
    try {
      const res = await fetch(`${API}/api/export/batch-paint`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes: savedPaintRecipes })
      })
      saveAs(await res.blob(), 'paint_recipes_batch.zip')
    } catch { notify('Request failed — check your connection and try again.', 'error') }
    setBatchLoading(false)
  }

  const exportSingleKilnRecipe = async () => {
    if (!kilnResult) return
    const recipeName = await askName("Recipe name", "My Kiln Firing")
    if (!recipeName) return
    try {
      const res = await fetch(`${API}/api/export/kiln-recipe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_name: recipeName, glaze_name: kilnResult.glaze_name, clay_name: kilnResult.clay_name, cone_temp: kilnResult.cone_temp, maturity: kilnResult.maturity, surface: kilnResult.surface, shrinkage: kilnResult.shrinkage_percent, final_hex: kilnResult.final_color_hex })
      })
      saveAs(await res.blob(), `${recipeName}.pdf`)
    } catch { notify('Request failed — check your connection and try again.', 'error') }
  }

  const saveKilnToBatch = async () => {
    if (!kilnResult) return
    const name = await askName("Recipe name", `Firing ${savedKilnRecipes.length + 1}`)
    if (!name) return
    setSavedKilnRecipes([...savedKilnRecipes, { recipe_name: name, glaze_name: kilnResult.glaze_name, clay_name: kilnResult.clay_name, cone_temp: kilnResult.cone_temp, maturity: kilnResult.maturity, surface: kilnResult.surface, shrinkage: kilnResult.shrinkage_percent, final_hex: kilnResult.final_color_hex }])
  }

  const exportBatchKiln = async () => {
    if (savedKilnRecipes.length === 0) { notify('No recipes saved yet — press Save first.'); return }
    setBatchLoading(true)
    try {
      const res = await fetch(`${API}/api/export/batch-kiln`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes: savedKilnRecipes })
      })
      saveAs(await res.blob(), 'kiln_recipes_batch.zip')
    } catch { notify('Request failed — check your connection and try again.', 'error') }
    setBatchLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30">
      <div className="pt-8 pb-4 text-center px-4">
        <div className="flex items-center justify-center gap-4 mb-3">
          <AlchemistLogo size={64} />
          <h1 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent tracking-tight">
            Alchemist's Palette
          </h1>
        </div>
        <p className="text-sm sm:text-base text-zinc-400 font-medium tracking-wide">Fine Arts Material Science Simulator</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 px-4">
        {[
          { id: 'paint', label: 'Paint Mixing', icon: Palette },
          { id: 'kiln', label: 'Kiln Simulator', icon: Flame },
          { id: 'sculpture', label: 'Sculpture', icon: Box },
          { id: 'stl', label: '3D STL Viewer', icon: FileBox }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-semibold transition-all duration-300 border ${activeTab === tab.id ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600'}`}>
            <tab.icon size={18} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="px-4 pb-12 max-w-3xl mx-auto">
        <div className="bg-zinc-900/60 backdrop-blur-xl p-5 sm:p-8 rounded-3xl shadow-2xl border border-zinc-800/60">
          
          {activeTab !== 'stl' && apiStatus !== 'ready' ? (
            <div role="status" className="flex flex-col items-center text-center gap-4 py-12 animate-tab-enter">
              {apiStatus === 'loading' ? (
                <>
                  <LoaderCircle size={36} className="animate-spin text-amber-400" />
                  <div>
                    <p className="font-semibold text-zinc-200">Connecting to the simulation server…</p>
                    <p className="text-sm text-zinc-500 mt-1">Free hosting sleeps when idle, so the first load can take up to a minute.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle size={36} className="text-red-400" />
                  <div>
                    <p className="font-semibold text-red-400">Couldn't reach the simulation server.</p>
                    <p className="text-sm text-zinc-500 mt-1">Check your connection, then try again.</p>
                  </div>
                  <button onClick={loadData} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold transition-colors"><RefreshCw size={16} /> Retry</button>
                </>
              )}
            </div>
          ) : (<>

          {activeTab === 'paint' && (
            <div className="space-y-6 animate-tab-enter">
              {pigments.length === 0 ? (
                <div className="text-center py-8 bg-red-900/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="mx-auto text-red-400 mb-2" size={32} />
                  <p className="text-red-400 font-semibold">The pigment database is empty.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Primary Pigment</label>
                      <select value={pigment1Id} onChange={(e) => setPigment1Id(parseInt(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all">
                        {pigments.map(p => <option key={p.id} value={p.id}>{p.name} ({p.pigment_index})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Secondary Pigment</label>
                      <select value={pigment2Id} onChange={(e) => setPigment2Id(parseInt(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all">
                        {pigments.map(p => <option key={p.id} value={p.id}>{p.name} ({p.pigment_index})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800">
                    <div className="flex justify-between mb-4"><span className="text-sm font-medium text-zinc-400">Mixing Ratio</span><span className="text-sm font-bold text-amber-400">{Math.round(ratio * 100)}% / {Math.round((1 - ratio) * 100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.01" value={ratio} onChange={(e) => setRatio(parseFloat(e.target.value))} className="range-slider" />
                  </div>
                  <button onClick={handleMix} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                    {loading ? 'Calculating Physics...' : <><Palette size={20} /> Grind & Mix Pigments</>}
                  </button>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col items-center p-4 bg-zinc-950/30 rounded-2xl border border-zinc-800">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Day 1 (Fresh)</span>
                      <div className="w-24 h-24 rounded-full border-4 border-zinc-700 shadow-inner transition-colors duration-500" style={{ backgroundColor: mixedColor }}></div>
                      <span className="mt-3 text-sm font-mono font-bold text-zinc-300">{mixedColor.toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-zinc-950/30 rounded-2xl border border-amber-900/30">
                      <span className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider mb-3">Aged ({years} Yrs)</span>
                      <div className="w-24 h-24 rounded-full border-4 border-amber-700/50 shadow-inner transition-colors duration-500" style={{ backgroundColor: agedColor }}></div>
                      <span className="mt-3 text-sm font-mono font-bold text-amber-400">{agedColor.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-amber-400 flex items-center gap-2"><RotateCcw size={16} /> Time Travel Simulation</span>
                      <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">{years} Years</span>
                    </div>
                    <input type="range" min="0" max="150" step="1" value={years} onChange={(e) => setYears(parseInt(e.target.value))} className="range-slider" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button onClick={exportSinglePaintRecipe} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700"><Download size={18} /> Export PDF</button>
                    <button onClick={savePaintToBatch} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-blue-500/30"><Save size={18} /> Save ({savedPaintRecipes.length})</button>
                    <button onClick={exportBatchPaint} disabled={batchLoading} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-purple-500/30 disabled:opacity-50"><Package size={18} /> Batch ZIP</button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'kiln' && (
            <div className="space-y-6 animate-tab-enter">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Glaze Recipe</label><select value={selectedGlazeId} onChange={(e) => setSelectedGlazeId(parseInt(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all">{glazes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Clay Body</label><select value={selectedClayId} onChange={(e) => setSelectedClayId(parseInt(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all">{clays.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800">
                <div className="flex justify-between mb-4"><span className="text-sm font-medium text-zinc-400">Kiln Temperature</span><span className="text-sm font-bold text-orange-400">{coneTemp}°C</span></div>
                <input type="range" min="1000" max="1350" step="10" value={coneTemp} onChange={(e) => setConeTemp(parseInt(e.target.value))} className="range-slider range-orange" />
              </div>
              <button onClick={handleFire} disabled={kilnLoading} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-black font-bold py-3.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">{kilnLoading ? 'Firing...' : <><Flame size={20} /> Fire the Kiln</>}</button>
              {kilnResult && (
                <div className="bg-zinc-950/50 p-6 rounded-2xl border border-orange-500/20 space-y-6 animate-pop-in">
                  <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2"><Flame size={20} /> Kiln Results</h3>
                  <div className="flex items-center justify-center gap-8 py-4">
                    <div className="text-center"><p className="text-xs text-zinc-500 uppercase mb-2">Before Firing</p><div className="w-20 h-20 rounded-xl border-2 border-zinc-700 shadow-inner" style={{ backgroundColor: glazes.find(g => g.id === selectedGlazeId)?.base_color_hex }}></div></div>
                    <div className="text-3xl text-zinc-600">→</div>
                    <div className="text-center"><p className="text-xs text-orange-400 uppercase mb-2">After Firing</p><div className="w-20 h-20 rounded-xl border-2 border-orange-500/50 shadow-inner shadow-orange-500/10" style={{ backgroundColor: kilnResult.final_color_hex }}></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"><span className="text-zinc-500 block text-xs uppercase">Maturity</span><span className="font-bold text-zinc-200">{kilnResult.maturity}%</span></div>
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"><span className="text-zinc-500 block text-xs uppercase">Surface</span><span className="font-bold text-zinc-200">{kilnResult.surface}</span></div>
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"><span className="text-zinc-500 block text-xs uppercase">Shrinkage</span><span className="font-bold text-zinc-200">{kilnResult.shrinkage_percent}%</span></div>
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"><span className="text-zinc-500 block text-xs uppercase">Vitrification</span><span className="font-bold text-zinc-200 capitalize">{kilnResult.vitrification}</span></div>
                  </div>
                  {kilnResult.thermal_shock && (<div className={`p-4 rounded-xl border ${kilnResult.thermal_shock.risk_level === 'low' ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}><p className="text-sm font-bold mb-2 flex items-center gap-2 text-red-400"><AlertTriangle size={16} /> Thermal Shock Risk: {kilnResult.thermal_shock.risk_level.toUpperCase()}</p><p className="text-xs text-zinc-400">{kilnResult.thermal_shock.recommendation}</p></div>)}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button onClick={exportSingleKilnRecipe} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700"><Download size={18} /> Export PDF</button>
                    <button onClick={saveKilnToBatch} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-blue-500/30"><Save size={18} /> Save ({savedKilnRecipes.length})</button>
                    <button onClick={exportBatchKiln} disabled={batchLoading} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-purple-500/30 disabled:opacity-50"><Package size={18} /> Batch ZIP</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sculpture' && (
            <div className="space-y-6 animate-tab-enter">
              <div><label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Material</label><select value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(parseInt(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all">{sculptureMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Height (m)</label><input type="number" step="0.1" min="0.1" value={sculptureHeight} onChange={(e) => setSculptureHeight(parseFloat(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" /></div>
                <div><label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Width (m)</label><input type="number" step="0.1" min="0.1" value={sculptureWidth} onChange={(e) => setSculptureWidth(parseFloat(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" /></div>
                <div><label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Depth (m)</label><input type="number" step="0.1" min="0.1" value={sculptureDepth} onChange={(e) => setSculptureDepth(parseFloat(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" /></div>
              </div>
              <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800">
                <div className="flex justify-between mb-4"><span className="text-sm font-medium text-zinc-400">Arm Extension</span><span className="text-sm font-bold text-amber-400">{armExtension}m</span></div>
                <input type="range" min="0" max="3" step="0.1" value={armExtension} onChange={(e) => setArmExtension(parseFloat(e.target.value))} className="range-slider" />
              </div>
              <button onClick={handleAnalyzeSculpture} disabled={sculptureLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">{sculptureLoading ? 'Analyzing...' : <><Box size={20} /> Analyze Structural Integrity</>}</button>
              {sculptureResult && (
                <div className="bg-zinc-950/50 p-6 rounded-2xl border border-amber-500/20 space-y-4 animate-pop-in">
                  <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2"><Box size={20} /> Structural Analysis</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"><span className="text-zinc-500 block text-xs uppercase">Weight</span><span className="font-bold text-zinc-200">{sculptureResult.analysis.weight_kg} kg</span></div>
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"><span className="text-zinc-500 block text-xs uppercase">Status</span><span className={`font-bold ${sculptureResult.analysis.status === 'safe' ? 'text-green-400' : sculptureResult.analysis.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>{sculptureResult.analysis.status.toUpperCase()}</span></div>
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"><span className="text-zinc-500 block text-xs uppercase">Max Stress</span><span className="font-bold text-zinc-200">{sculptureResult.analysis.max_stress_mpa} MPa</span></div>
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"><span className="text-zinc-500 block text-xs uppercase">Safety Factor</span><span className="font-bold text-zinc-200">{sculptureResult.analysis.safety_factor}x</span></div>
                  </div>
                  {sculptureResult.analysis.warnings.length > 0 && (<div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4"><p className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Structural Warnings</p><ul className="list-disc list-inside text-sm text-red-300/80 space-y-1">{sculptureResult.analysis.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul></div>)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stl' && (
            <div className="space-y-6 animate-tab-enter">
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-zinc-100 flex items-center justify-center gap-2"><FileBox size={24} className="text-amber-400" /> 3D Sculpture Viewer</h3>
                <p className="text-sm text-zinc-500 mt-1">Left-click to rotate • Right-click to pan • Scroll to zoom</p>
              </div>

              <input ref={fileInputRef} type="file" accept=".stl" onChange={handleSTLUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700 border-dashed hover:border-amber-500/50">
                <Download size={20} /> Upload STL File
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Material Preview</label>
                  <select value={stlMaterial} onChange={(e) => setStlMaterial(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all">
                    <option value="Bronze">Bronze</option><option value="Marble">Marble</option><option value="Plaster">Plaster</option><option value="Steel">Steel</option><option value="Granite">Granite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Lighting Intensity</label>
                  <div className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3">
                    <Sun size={18} className="text-zinc-400" />
                    <input type="range" min="0.1" max="2.0" step="0.1" value={lightIntensity} onChange={(e) => setLightIntensity(parseFloat(e.target.value))} className="flex-1 range-slider" />
                  </div>
                </div>
              </div>

              {stlUrl ? (
                <div className="relative bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl" style={{ height: '500px' }}>
                  <Canvas camera={{ position: [3, 3, 3], fov: 45 }} shadows>
                    <color attach="background" args={['#09090b']} />
                    <ambientLight intensity={lightIntensity * 0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={lightIntensity} castShadow />
                    <directionalLight position={[-10, -10, -5]} intensity={lightIntensity * 0.3} />
                    <STLModel url={stlUrl} material={stlMaterial} wireframe={wireframe} scale={modelScale} />
                    <OrbitControls 
                      ref={controlsRef}
                      enableDamping 
                      dampingFactor={0.05}
                      autoRotate={autoRotate}
                      autoRotateSpeed={2.0}
                      enableZoom={true}
                      enablePan={true}
                      minDistance={0.1}
                      maxDistance={100}
                    />
                    <Grid infiniteGrid fadeDistance={30} fadeStrength={5} sectionColor="#27272a" cellColor="#18181b" />
                  </Canvas>

                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button onClick={() => setModelScale(prev => Math.min(prev + 0.5, 10))} className="p-2.5 rounded-lg backdrop-blur-md bg-zinc-900/80 border border-zinc-700 text-zinc-200 hover:text-amber-400 hover:border-amber-500/50 transition-all" title="Zoom In (Scale Up)">
                      <ZoomIn size={20} />
                    </button>
                    <button onClick={() => setModelScale(prev => Math.max(prev - 0.5, 0.1))} className="p-2.5 rounded-lg backdrop-blur-md bg-zinc-900/80 border border-zinc-700 text-zinc-200 hover:text-amber-400 hover:border-amber-500/50 transition-all" title="Zoom Out (Scale Down)">
                      <ZoomOut size={20} />
                    </button>
                    <button onClick={() => setAutoRotate(!autoRotate)} className={`p-2.5 rounded-lg backdrop-blur-md border transition-all ${autoRotate ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`} title="Auto-Rotate">
                      <RotateCcw size={20} className={autoRotate ? 'animate-spin-slow' : ''} />
                    </button>
                    <button onClick={() => setWireframe(!wireframe)} className={`p-2.5 rounded-lg backdrop-blur-md border transition-all ${wireframe ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`} title="Toggle Wireframe">
                      <Layers size={20} />
                    </button>
                    <button onClick={resetView} className="p-2.5 rounded-lg backdrop-blur-md bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all" title="Reset View & Scale">
                      <Maximize size={20} />
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-400 flex items-center gap-2">
                    <Box size={14} /> {stlMaterial} • Scale: {modelScale.toFixed(1)}x • {wireframe ? 'Wireframe' : 'Solid'}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed p-16 text-center">
                  <FileBox size={48} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-medium">No STL file loaded</p>
                  <p className="text-zinc-600 text-sm mt-1">Upload a file above to preview your sculpture</p>
                </div>
              )}

              <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-300">Pro Tip</p>
                  <p className="text-sm text-blue-400/80 mt-1">Combine this viewer with the <strong>Sculpture</strong> tab. Visualize your STL here, then input the dimensions in the Sculpture tab to run a real-time structural integrity analysis.</p>
                </div>
              </div>
            </div>
          )}
          </>)}
        </div>
      </div>

      {nameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => closeName(null)}>
          <form
            role="dialog" aria-modal="true" aria-label={nameDialog.title}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); closeName(nameDialog.value) }}
            onKeyDown={(e) => { if (e.key === 'Escape') closeName(null) }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-4 animate-pop-in"
          >
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">{nameDialog.title}</label>
            <input
              autoFocus value={nameDialog.value}
              onChange={(e) => setNameDialog({ ...nameDialog, value: e.target.value })}
              onFocus={(e) => e.target.select()}
              className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => closeName(null)} className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 font-semibold transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold">Confirm</button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div role="status" aria-live="polite" className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-sm font-medium animate-toast-in ${toast.kind === 'error' ? 'bg-red-950/90 border-red-500/40 text-red-200' : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'}`}>
          {toast.kind === 'error' ? <AlertTriangle size={18} className="shrink-0 text-red-400" /> : <CircleCheck size={18} className="shrink-0 text-amber-400" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss" className="shrink-0 text-zinc-400 hover:text-zinc-100"><X size={16} /></button>
        </div>
      )}
    </div>
  )
}

export default App