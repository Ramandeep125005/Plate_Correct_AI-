import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { analyzeImage } from "../api/geminiVision";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FLAG_CONFIG = {
  ok:   { label: "Good",    bg: "bg-emerald-50 dark:bg-emerald-950/30",  border: "border-emerald-200 dark:border-emerald-800",  text: "text-emerald-700 dark:text-emerald-400",  dot: "bg-emerald-500" },
  warn: { label: "Caution", bg: "bg-amber-50 dark:bg-amber-950/30",     border: "border-amber-200 dark:border-amber-700",     text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-400"  },
  bad:  { label: "Avoid",   bg: "bg-rose-50 dark:bg-rose-950/30",       border: "border-rose-200 dark:border-rose-800",       text: "text-rose-700 dark:text-rose-400",       dot: "bg-rose-500"  },
};

const GRADE_COLOR = { "A+": "text-emerald-500", A: "text-emerald-500", "B+": "text-green-500", B: "text-green-500", "B-": "text-lime-500", "C+": "text-amber-500", C: "text-amber-500", "C-": "text-orange-500", D: "text-rose-500", F: "text-red-600" };

function MacroBar({ label, value, max, color }) {
  const numVal = parseInt(String(value).replace(/[^0-9]/g, "")) || 0;
  const pct = Math.min(100, (numVal / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold mb-1">
        <span className="text-muted dark:text-gray-400">{label}</span>
        <span className="text-ink dark:text-gray-200">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function getSuitabilityLabel(score) {
  if (score >= 85) {
    return {
      text: "Excellent Match",
      color: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20",
      desc: "Perfectly aligned with your clinical profile and dietary goals.",
      hexColor: "#10b981",
    };
  }
  if (score >= 70) {
    return {
      text: "Good Match",
      color: "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-950/20",
      desc: "Highly suitable, with only minor adjustments recommended.",
      hexColor: "#22c55e",
    };
  }
  if (score >= 50) {
    return {
      text: "Fair Match",
      color: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20",
      desc: "Moderately suitable. Healthy swaps are recommended to optimize this plate.",
      hexColor: "#f59e0b",
    };
  }
  return {
    text: "Poor Match",
    color: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-950/20",
    desc: "Not recommended for your conditions. Swapping main items is highly advised.",
    hexColor: "#ef4444",
  };
}

function ScoreRing({ score }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = ((score || 0) / 100) * circ;
  const suitability = getSuitabilityLabel(score || 0);

  return (
    <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-black/5 dark:text-white/10" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={suitability.hexColor} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-ink dark:text-gray-100">{score}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ScanPlatePage() {
  const { patient } = useAuth();
  const navigate = useNavigate();

  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState("image/jpeg");

  const [phase, setPhase] = useState("idle"); // idle | uploading | analysing | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef(null);
  const cameraRef = useRef(null);

  // ── File helpers ─────────────────────────────────────────────────────────
  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImageMime(file.type);
    setPhase("uploading");

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      // Extract raw base64 from data URL
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setPhase("idle");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e) => processFile(e.target.files?.[0]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      processFile(e.dataTransfer.files?.[0]);
    },
    [processFile]
  );

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setSaved(false);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Analyse ───────────────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (!imageBase64) return;
    setPhase("analysing");
    setResult(null);
    setErrorMsg("");
    setSaved(false);

    try {
      const analysis = await analyzeImage(imageBase64, imageMime, patient || {});
      setResult(analysis);
      setPhase("done");
    } catch (err) {
      setErrorMsg(err.message || "Analysis failed. Please try again.");
      setPhase("error");
    }
  };

  // ── Save to history (localStorage) ───────────────────────────────────────
  const handleSave = () => {
    if (!result) return;
    const HISTORY_KEY = "pca_plate_scans";
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    existing.unshift({
      id: `scan_${Date.now()}`,
      patient_id: patient?.id,
      scanned_at: new Date().toISOString(),
      mealName: result.mealName,
      emoji: result.emoji,
      score: result.portions?.score,
      grade: result.portions?.grade,
      macros: result.macros,
      imagePreview: imagePreview,
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, 50)));
    setSaved(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="max-w-5xl mx-auto animate-fadeInUp">

        {/* ── Page Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-50/60 via-pink-50/40 to-orange-50/30 dark:from-[#241B18]/60 dark:via-[#1C1411]/40 dark:to-orange-950/10 border border-primary/10 dark:border-primary/20 rounded-3xl p-6 md:p-8 mb-8 shadow-soft">
          {/* Decorative blob */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gradient-to-br from-secondary/20 to-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-9 h-9 rounded-xl border border-primary/15 bg-white/60 dark:bg-[#241B18]/60 flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-all"
                title="Back to dashboard"
              >
                ←
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">📸</span>
                  <h1 className="text-xl font-extrabold text-ink dark:text-gray-100 tracking-tight">
                    Scan Your Plate
                  </h1>
                </div>
                <p className="text-xs text-muted dark:text-gray-400 font-semibold">
                  Upload a meal photo · AI analyses nutrition &amp; suggests healthier swaps
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                ✦ Gemini AI
              </span>
              {result?._isMock && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 px-3 py-1.5 rounded-full">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left: Upload ── */}
          <div className="space-y-5">

            {/* Drop zone / preview */}
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-[300px] p-8 text-center select-none
                  ${dragActive
                    ? "border-primary bg-primary/8 scale-[1.01] shadow-lg shadow-primary/10"
                    : "border-primary/20 dark:border-primary/25 bg-white/60 dark:bg-[#201714]/60 hover:border-primary/40 hover:bg-primary/5"
                  }`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl transition-transform duration-200 ${dragActive ? "scale-110" : ""} bg-gradient-to-br from-secondary/15 to-primary/10 border border-primary/10`}>
                  {dragActive ? "🎯" : "📷"}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-ink dark:text-gray-200 mb-1">
                    {dragActive ? "Drop your meal photo here!" : "Upload a plate photo"}
                  </p>
                  <p className="text-xs text-muted dark:text-gray-500 font-semibold">
                    Drag &amp; drop · or click to browse · JPG, PNG, WEBP
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="btn btn-primary px-5 py-2 text-xs font-bold"
                  >
                    Browse Files
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
                    className="px-5 py-2 text-xs font-bold rounded-xl border border-primary/25 text-primary bg-white dark:bg-[#201714] hover:bg-primary/5 transition-all"
                  >
                    📸 Camera
                  </button>
                </div>
                <p className="text-[10px] text-muted/60 font-semibold">
                  Works best with full plate photos in good lighting
                </p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-primary/15 dark:border-primary/25 shadow-card bg-white dark:bg-[#201714]">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Uploaded meal"
                    className="w-full max-h-72 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <button
                    onClick={removeImage}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white text-sm flex items-center justify-center hover:bg-black/70 transition-all backdrop-blur-sm"
                    title="Remove image"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {imageFile?.name || "Uploaded image"}
                    </span>
                  </div>
                </div>

                {/* Analyse button */}
                <div className="p-4">
                  {phase !== "done" && (
                    <button
                      onClick={handleAnalyse}
                      disabled={phase === "analysing"}
                      className="w-full btn btn-primary py-3 text-sm font-extrabold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {phase === "analysing" ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Analysing with AI…
                        </>
                      ) : (
                        <>✨ Analyse This Plate</>
                      )}
                    </button>
                  )}
                  {phase === "done" && (
                    <div className="flex gap-2">
                      <button
                        onClick={removeImage}
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-primary/25 text-primary bg-white dark:bg-[#201714] hover:bg-primary/5 transition-all"
                      >
                        🔄 Re-scan
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saved}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${saved ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 cursor-default" : "btn btn-primary"}`}
                      >
                        {saved ? "✓ Saved!" : "💾 Save to History"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error state */}
            {phase === "error" && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-5">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">❌ Analysis Failed</p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/70">{errorMsg}</p>
                <button
                  onClick={handleAnalyse}
                  className="mt-3 text-xs font-bold text-rose-600 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Tips card */}
            {phase === "idle" && !imagePreview && (
              <div className="rounded-2xl bg-white/70 dark:bg-[#201714]/70 border border-primary/10 dark:border-primary/20 p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted dark:text-gray-500 mb-3">
                  For best results
                </p>
                <ul className="space-y-2">
                  {[
                    ["🌞", "Good lighting", "Natural daylight or bright room light"],
                    ["📐", "Full plate visible", "Capture the entire plate from above"],
                    ["🔍", "Close enough", "Food items should be distinguishable"],
                    ["🚫", "No filters", "Use original photo without heavy editing"],
                  ].map(([icon, title, desc]) => (
                    <li key={title} className="flex items-start gap-2.5">
                      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                      <div>
                        <span className="text-[11px] font-bold text-ink dark:text-gray-200">{title}</span>
                        <span className="text-[10px] text-muted dark:text-gray-500 ml-1">{desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Loading skeleton */}
            {phase === "analysing" && (
              <div className="rounded-2xl bg-white/70 dark:bg-[#201714]/70 border border-primary/10 dark:border-primary/20 p-5 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/60 to-primary/60 animate-pulse flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-primary/15 dark:bg-primary/25 rounded-full w-3/4 animate-pulse" />
                    <div className="h-2.5 bg-primary/10 dark:bg-primary/15 rounded-full w-1/2 animate-pulse" />
                  </div>
                </div>
                {[0.9, 0.7, 0.85, 0.6, 0.75].map((w, i) => (
                  <div key={i} className="h-2.5 bg-primary/10 dark:bg-primary/15 rounded-full animate-pulse" style={{ width: `${w * 100}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
                <p className="text-[10px] font-bold text-muted/70 dark:text-gray-600 text-center pt-2">
                  Identifying foods · Calculating macros · Personalising advice…
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Results ── */}
          <div className="space-y-5">
            {!result && phase !== "analysing" && (
              <div className="min-h-[300px] rounded-2xl border border-dashed border-primary/15 dark:border-primary/20 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="text-5xl opacity-30">🍽️</span>
                <p className="text-sm font-bold text-muted/50 dark:text-gray-600">
                  Your plate analysis will appear here
                </p>
                <p className="text-[11px] text-muted/40 dark:text-gray-700 font-semibold">
                  Upload a photo and click "Analyse"
                </p>
              </div>
            )}

            {phase === "analysing" && (
              <div className="min-h-[300px] rounded-2xl border border-primary/15 dark:border-primary/20 bg-white/60 dark:bg-[#201714]/60 flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-2xl animate-pulse shadow-lg shadow-secondary/20">
                  🌿
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-ink dark:text-gray-200 mb-1">AI is analysing your meal…</p>
                  <p className="text-xs text-muted dark:text-gray-500 font-semibold">It takes a few seconds</p>
                </div>
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((d) => (
                    <div key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}

            {result && phase === "done" && (
              <div className="space-y-4 animate-fadeInUp">

                {/* ── Score Card ── */}
                <div className="rounded-2xl bg-white dark:bg-[#201714] border border-primary/10 dark:border-primary/20 p-5 shadow-card flex items-center gap-5">
                  <ScoreRing score={result.portions?.score} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xl">{result.emoji}</span>
                      <h2 className="text-sm font-extrabold text-ink dark:text-gray-100 truncate">{result.mealName}</h2>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getSuitabilityLabel(result.portions?.score || 0).color}`}>
                        {getSuitabilityLabel(result.portions?.score || 0).text}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted dark:text-gray-400 font-semibold leading-snug mb-1">
                      {result.portions?.overall}
                    </p>
                    <p className="text-[10px] text-muted/70 dark:text-gray-500 font-medium leading-normal mb-2">
                      {getSuitabilityLabel(result.portions?.score || 0).desc}
                    </p>
                    {result._isMock && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 px-2 py-0.5 rounded-full">
                        Demo result · Add API key for real analysis
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Alerts ── */}
                {result.alerts?.length > 0 && (
                  <div className="space-y-2">
                    {result.alerts.map((alert, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-700/40 rounded-xl px-4 py-2.5">
                        <span className="text-base flex-shrink-0">{alert.icon}</span>
                        <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">{alert.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Detected Foods ── */}
                <div className="rounded-2xl bg-white dark:bg-[#201714] border border-primary/10 dark:border-primary/20 p-5 shadow-card">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted dark:text-gray-500 mb-3">🍽️ Detected Foods</p>
                  <div className="space-y-2">
                    {result.detectedFoods?.map((food, i) => {
                      const cfg = FLAG_CONFIG[food.flag] || FLAG_CONFIG.ok;
                      return (
                        <div key={i} className={`flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 border ${cfg.bg} ${cfg.border}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-ink dark:text-gray-200 truncate">{food.name}</p>
                              {food.flagReason && (
                                <p className="text-[9px] text-muted dark:text-gray-500 font-semibold">{food.flagReason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[9px] text-muted dark:text-gray-500 font-semibold whitespace-nowrap">{food.amount}</span>
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${cfg.text} bg-white/60 dark:bg-black/20`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Macros ── */}
                <div className="rounded-2xl bg-white dark:bg-[#201714] border border-primary/10 dark:border-primary/20 p-5 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted dark:text-gray-500">📊 Macros</p>
                    <div className="flex gap-2 text-[9px] font-bold">
                      <span className="text-muted dark:text-gray-500">Current</span>
                      <span className="text-primary">→ After swaps</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <MacroBar label={`Calories ${result.correctedMacros?.calories ? "→ " + result.correctedMacros.calories : ""}`} value={result.macros?.calories} max={1200} color="bg-gradient-to-r from-secondary to-primary" />
                    <MacroBar label={`Protein ${result.correctedMacros?.protein ? "→ " + result.correctedMacros.protein : ""}`} value={result.macros?.protein} max={60} color="bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <MacroBar label={`Carbs ${result.correctedMacros?.carbs ? "→ " + result.correctedMacros.carbs : ""}`} value={result.macros?.carbs} max={150} color="bg-gradient-to-r from-amber-400 to-orange-400" />
                    <MacroBar label={`Fats ${result.correctedMacros?.fats ? "→ " + result.correctedMacros.fats : ""}`} value={result.macros?.fats} max={60} color="bg-gradient-to-r from-rose-400 to-pink-400" />
                    <MacroBar label={`Fibre ${result.correctedMacros?.fiber ? "→ " + result.correctedMacros.fiber : ""}`} value={result.macros?.fiber} max={30} color="bg-gradient-to-r from-lime-400 to-green-500" />
                  </div>
                </div>

                {/* ── Swaps ── */}
                {result.swaps?.length > 0 && (
                  <div className="rounded-2xl bg-white dark:bg-[#201714] border border-primary/10 dark:border-primary/20 p-5 shadow-card">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted dark:text-gray-500 mb-3">🔄 Healthier Swaps</p>
                    <div className="space-y-3">
                      {result.swaps.map((swap, i) => (
                        <div key={i} className="rounded-xl border border-primary/10 dark:border-primary/20 overflow-hidden">
                          <div className="flex items-stretch text-[11px] font-semibold">
                            <div className="flex-1 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 text-rose-700 dark:text-rose-400 line-through decoration-rose-400">
                              {swap.from}
                            </div>
                            <div className="px-2 flex items-center text-primary font-extrabold text-xs bg-primary/5">→</div>
                            <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 text-emerald-700 dark:text-emerald-400 font-bold">
                              {swap.to}
                            </div>
                          </div>
                          <div className="px-3 py-2 bg-white/50 dark:bg-[#1A1210]/40 border-t border-primary/5">
                            <p className="text-[10px] text-muted dark:text-gray-500 font-semibold">{swap.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Add-ons ── */}
                {result.addOns?.length > 0 && (
                  <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border border-primary/10 dark:border-primary/20 p-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted dark:text-gray-500 mb-3">✅ Suggestions</p>
                    <ul className="space-y-2">
                      {result.addOns.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-extrabold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-[11px] font-semibold text-ink dark:text-gray-200">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── Dietitian Note ── */}
                {result.dietitianNote && (
                  <div className="rounded-2xl bg-white dark:bg-[#201714] border border-secondary/20 dark:border-secondary/15 p-5 shadow-card">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-sm flex-shrink-0">
                        🌿
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-ink dark:text-gray-200">Dietitian's Note</p>
                        <p className="text-[9px] text-muted dark:text-gray-500 font-semibold">Personalised for {patient?.preferred_name || "you"}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-ink/80 dark:text-gray-300 font-semibold leading-relaxed italic">
                      "{result.dietitianNote}"
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* ── API key notice ── */}
        {!import.meta.env.VITE_GEMINI_API_KEY && (
          <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-700/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xl flex-shrink-0">🔑</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300 mb-0.5">Running in Demo Mode</p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70 font-semibold">
                Add your free Gemini API key to <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono">.env</code> as{" "}
                <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono">VITE_GEMINI_API_KEY=your_key</code> for real food detection.
                Get a free key at{" "}
                <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                  aistudio.google.com
                </a>
              </p>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
