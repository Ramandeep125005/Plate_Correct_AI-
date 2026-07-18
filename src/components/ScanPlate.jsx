import { useRef, useState, useCallback } from "react";

// ─── Mock AI meal analysis database ──────────────────────────────────────────
const MEAL_SCENARIOS = [
  {
    id: "dal_rice",
    label: "Dal Rice Plate",
    emoji: "🍛",
    detectedFoods: [
      { name: "White rice", amount: "~250g (oversize)", flag: "warn" },
      { name: "Yellow dal (toor)", amount: "~120ml (1 cup)", flag: "ok" },
      { name: "Papad", amount: "1 piece", flag: "warn" },
      { name: "Pickle (achaar)", amount: "~15g", flag: "bad" },
      { name: "Ghee", amount: "~2 tsp", flag: "ok" },
    ],
    portions: {
      overall: "Unbalanced — carbs dominant, veggies missing",
      score: 52,
      grade: "C+",
    },
    swaps: [
      { from: "White rice (250g)", to: "Brown rice (150g) + Cauliflower rice (100g)", reason: "Halves the glycemic load while maintaining volume." },
      { from: "Papad", to: "Roasted makhana or cucumber slices", reason: "Eliminates 300mg hidden sodium from the meal." },
      { from: "Pickle / Achaar", to: "Fresh coriander-lemon chutney", reason: "Achaar has 500–800mg sodium per tbsp. Chutney has <30mg." },
    ],
    addOns: [
      "Add ½ cup sautéed spinach or lauki on the side",
      "Include a small cucumber-tomato salad before eating",
      "Squeeze lemon on dal for Vitamin C and better iron absorption",
    ],
    macros: { calories: "~620 kcal", protein: "~16g", carbs: "~108g", fats: "~12g", fiber: "~4g" },
    correctedMacros: { calories: "~460 kcal", protein: "~20g", carbs: "~72g", fats: "~10g", fiber: "~9g" },
  },
  {
    id: "roti_sabzi",
    label: "Roti & Sabzi Thali",
    emoji: "🫓",
    detectedFoods: [
      { name: "Wheat roti (x3)", amount: "~180g", flag: "warn" },
      { name: "Aloo (potato) curry", amount: "~130g", flag: "warn" },
      { name: "Curd / yoghurt", amount: "~80g", flag: "ok" },
      { name: "Onion salad", amount: "~30g", flag: "ok" },
      { name: "Ghee on roti", amount: "~3 tsp", flag: "warn" },
    ],
    portions: {
      overall: "High starch load — two starchy items stacked",
      score: 58,
      grade: "C+",
    },
    swaps: [
      { from: "Roti x3", to: "Roti x2 + 1 multigrain roti", reason: "Reduces simple carb load; multigrain adds fibre." },
      { from: "Aloo curry", to: "Palak paneer or mixed veg sabzi", reason: "Potato is a high-GI vegetable. Leafy sabzi is far superior." },
      { from: "Excess ghee (3 tsp)", to: "1 tsp ghee only", reason: "Saves ~90 kcal and 10g saturated fat." },
    ],
    addOns: [
      "Add a bowl of moong or masoor dal for protein",
      "Include seasonal salad dressed with lemon, not cream",
      "Have curd at room temperature — it aids digestion better than cold",
    ],
    macros: { calories: "~710 kcal", protein: "~14g", carbs: "~98g", fats: "~26g", fiber: "~6g" },
    correctedMacros: { calories: "~520 kcal", protein: "~22g", carbs: "~70g", fats: "~16g", fiber: "~11g" },
  },
  {
    id: "poha_breakfast",
    label: "Poha Breakfast Plate",
    emoji: "🥣",
    detectedFoods: [
      { name: "Poha (flattened rice)", amount: "~200g", flag: "ok" },
      { name: "Roasted peanuts", amount: "~20g", flag: "ok" },
      { name: "Tea with sugar & milk", amount: "~180ml", flag: "warn" },
      { name: "Sev (fried noodles)", amount: "~15g topping", flag: "bad" },
      { name: "Fried puri (side)", amount: "2 pieces", flag: "bad" },
    ],
    portions: {
      overall: "Decent base — problematic add-ons",
      score: 63,
      grade: "B-",
    },
    swaps: [
      { from: "Tea with 2 tsp sugar", to: "Unsweetened green tea or black tea", reason: "Saves 32 kcal and 8g sugar per cup." },
      { from: "Sev topping", to: "Sunflower or pumpkin seeds", reason: "Sev is deep-fried; seeds add healthy fats and zinc." },
      { from: "Fried puri", to: "1 slice multigrain toast", reason: "Puris are 110+ kcal each from deep frying." },
    ],
    addOns: [
      "Add ½ boiled egg or a small portion of sprouts for protein",
      "Squeeze lemon on the poha for Vitamin C and freshness",
      "Add grated carrot or capsicum for hidden vegetables",
    ],
    macros: { calories: "~540 kcal", protein: "~11g", carbs: "~80g", fats: "~22g", fiber: "~3g" },
    correctedMacros: { calories: "~390 kcal", protein: "~16g", carbs: "~58g", fats: "~12g", fiber: "~7g" },
  },
  {
    id: "pasta_plate",
    label: "Pasta & Sauce Plate",
    emoji: "🍝",
    detectedFoods: [
      { name: "White pasta (macaroni)", amount: "~220g cooked", flag: "warn" },
      { name: "Tomato-cream sauce", amount: "~80ml", flag: "warn" },
      { name: "Processed cheese topping", amount: "~30g", flag: "bad" },
      { name: "Garlic bread (side)", amount: "2 slices", flag: "bad" },
      { name: "Soft drink (can)", amount: "330ml", flag: "bad" },
    ],
    portions: {
      overall: "Very high calorie — processed food dominant",
      score: 34,
      grade: "D",
    },
    swaps: [
      { from: "White pasta", to: "Whole-wheat or chickpea pasta", reason: "3× more fibre; slower glucose absorption." },
      { from: "Cream sauce", to: "Tomato-herb sauce (no cream)", reason: "Eliminates ~120 kcal and 12g saturated fat." },
      { from: "Processed cheese", to: "Nutritional yeast or 1 tbsp parmesan", reason: "Half the sodium and calories; adds B12." },
      { from: "Garlic bread", to: "Side salad with olive oil", reason: "Saves ~250 kcal of empty carbs." },
      { from: "Soft drink", to: "Nimbu pani (no sugar) or sparkling water", reason: "Soft drink = 35g sugar, zero nutrition." },
    ],
    addOns: [
      "Toss in grilled vegetables: zucchini, bell peppers, mushrooms",
      "Add a handful of chickpeas or tofu for plant protein",
      "Start meal with a green salad to reduce overall calorie intake",
    ],
    macros: { calories: "~980 kcal", protein: "~18g", carbs: "~148g", fats: "~32g", fiber: "~4g" },
    correctedMacros: { calories: "~560 kcal", protein: "~26g", carbs: "~80g", fats: "~14g", fiber: "~12g" },
  },
  {
    id: "idli_sambar",
    label: "Idli & Sambar Plate",
    emoji: "🍚",
    detectedFoods: [
      { name: "Plain idli (x4)", amount: "~240g", flag: "ok" },
      { name: "Sambar (lentil stew)", amount: "~200ml", flag: "ok" },
      { name: "Coconut chutney", amount: "~60g", flag: "warn" },
      { name: "Tomato chutney", amount: "~40g", flag: "ok" },
      { name: "Filter coffee (with milk & sugar)", amount: "~200ml", flag: "warn" },
    ],
    portions: {
      overall: "Nutritious base — high number of idlis",
      score: 71,
      grade: "B",
    },
    swaps: [
      { from: "4 plain idlis", to: "3 idlis + 1 ragi or oats idli", reason: "Ragi adds calcium; oats adds cholesterol-lowering beta-glucan." },
      { from: "Coconut chutney (large portion)", to: "Small portion (2 tbsp max)", reason: "Coconut chutney is calorie-dense at ~90 kcal per 60g." },
      { from: "Filter coffee with sugar", to: "Filter coffee with jaggery (minimal) or black", reason: "Reduces refined sugar; jaggery adds trace minerals." },
    ],
    addOns: [
      "Add a boiled egg or a small cup of curd for protein",
      "Include sambar with more vegetables (drumstick, tomato, carrot)",
      "Eat idlis slowly — they expand in the stomach; 3 is often enough",
    ],
    macros: { calories: "~480 kcal", protein: "~14g", carbs: "~82g", fats: "~10g", fiber: "~6g" },
    correctedMacros: { calories: "~400 kcal", protein: "~18g", carbs: "~66g", fats: "~8g", fiber: "~9g" },
  },
  {
    id: "salad_bowl",
    label: "Salad Bowl",
    emoji: "🥗",
    detectedFoods: [
      { name: "Mixed greens (spinach, rocket)", amount: "~80g", flag: "ok" },
      { name: "Grilled paneer cubes", amount: "~80g", flag: "ok" },
      { name: "Cherry tomatoes", amount: "~60g", flag: "ok" },
      { name: "Croutons (fried)", amount: "~30g", flag: "warn" },
      { name: "Caesar dressing", amount: "~45ml", flag: "bad" },
    ],
    portions: {
      overall: "Great foundation — dressing and croutons drag it down",
      score: 74,
      grade: "B+",
    },
    swaps: [
      { from: "Fried croutons", to: "Roasted chickpeas or pumpkin seeds", reason: "Saves 120 kcal; adds protein and zinc instead." },
      { from: "Caesar dressing (45ml)", to: "Lemon-olive oil-mustard dressing", reason: "Caesar has 180 kcal per 3 tbsp. Lemon dressing has ~40 kcal." },
    ],
    addOns: [
      "Add cucumber, avocado, or beetroot for more nutrients",
      "Include quinoa or brown rice (small portion) to make it more filling",
      "Add sunflower or flax seeds for omega-3 and crunch",
    ],
    macros: { calories: "~420 kcal", protein: "~18g", carbs: "~28g", fats: "~26g", fiber: "~5g" },
    correctedMacros: { calories: "~310 kcal", protein: "~20g", carbs: "~22g", fats: "~16g", fiber: "~8g" },
  },
];

// ─── Condition-specific personalized corrections ──────────────────────────────
function getPersonalizedTips(patient) {
  const conds = (patient?.medical_conditions || "").toLowerCase();
  const tips = [];

  if (conds.includes("thyroid")) {
    tips.push({ icon: "🦋", label: "Thyroid Alert", text: "Avoid raw cruciferous vegetables on this plate. Steam or cook them first to neutralise goitrogens.", color: "blue" });
    tips.push({ icon: "💊", label: "Medication Tip", text: "If you take Levothyroxine, ensure there's a 30–60 min gap before eating.", color: "blue" });
  }
  if (conds.includes("pcos") || conds.includes("pcod")) {
    tips.push({ icon: "🌸", label: "PCOS Watch", text: "High carb content on this plate can spike insulin. Pair every carb with protein or fibre.", color: "pink" });
    tips.push({ icon: "⚖️", label: "Portion Tip", text: "For PCOS, smaller and more frequent meals maintain insulin sensitivity better than 2–3 large plates.", color: "pink" });
  }
  if (conds.includes("anemia") || conds.includes("hemoglobin")) {
    tips.push({ icon: "🩸", label: "Iron Absorption", text: "Add a squeeze of lemon or include a Vitamin C-rich food on this plate to maximise iron absorption.", color: "red" });
    tips.push({ icon: "☕", label: "Tea Timing", text: "Avoid chai or coffee within 1 hour of this meal — tannins block iron absorption by up to 60%.", color: "red" });
  }
  if (conds.includes("prediabetes") || conds.includes("diabetes")) {
    tips.push({ icon: "📊", label: "Glucose Alert", text: "Eat this plate in order: vegetables first → protein → then carbs to blunt glucose spikes.", color: "orange" });
    tips.push({ icon: "🚶", label: "Post-Meal", text: "A 10-minute walk after this meal can reduce postprandial glucose by up to 22%.", color: "orange" });
  }
  if (conds.includes("hypertension")) {
    tips.push({ icon: "❤️", label: "Sodium Watch", text: "Pickle and papad in this meal may exceed your daily sodium allowance. Eliminate or reduce.", color: "red" });
    tips.push({ icon: "🧂", label: "Salt Tip", text: "Your daily sodium limit is ~1500mg. Request less salt when eating restaurant or canteen food.", color: "red" });
  }

  if (tips.length === 0) {
    tips.push({ icon: "✅", label: "General Tip", text: "Eat slowly and mindfully. Put your fork down between bites for better digestion and satiety.", color: "teal" });
    tips.push({ icon: "💧", label: "Hydration", text: "Drink a glass of water 20–30 minutes before this meal to reduce overeating.", color: "teal" });
  }
  return tips;
}

// ─── Macro comparison bar ─────────────────────────────────────────────────────
function MacroBar({ label, before, after, unit, color }) {
  const max = Math.max(parseInt(before), parseInt(after)) * 1.2;
  const beforePct = (parseInt(before) / max) * 100;
  const afterPct = (parseInt(after) / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold mb-1">
        <span className="text-muted dark:text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-coral line-through">{before}{unit}</span>
          <span className="text-[10px]">→</span>
          <span className={`text-${color}`}>{after}{unit}</span>
        </div>
      </div>
      <div className="h-2 bg-primary/5 dark:bg-[#1E1512]/50 rounded-full overflow-hidden relative">
        <div className="h-full bg-coral/20 rounded-full absolute" style={{ width: `${beforePct}%` }} />
        <div className={`h-full bg-${color} rounded-full absolute transition-all duration-700`} style={{ width: `${afterPct}%` }} />
      </div>
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const size = 80, stroke = 7, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#26A69A" : score >= 50 ? "#FF9F43" : "#FF7E67";
  const grade = score >= 70 ? "Good" : score >= 50 ? "Fair" : "Poor";
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="#e2f0f0" strokeWidth={stroke} fill="none" className="dark:stroke-gray-800" />
          <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold" style={{ color }}>{score}</span>
          <span className="text-[8px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider">/100</span>
        </div>
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1" style={{ color }}>{grade}</span>
    </div>
  );
}

// ─── Flag badge ───────────────────────────────────────────────────────────────
function FlagBadge({ flag }) {
  if (flag === "ok") return <span className="text-[9px] font-bold text-success bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/30 px-1.5 py-0.5 rounded-full">✓ Good</span>;
  if (flag === "warn") return <span className="text-[9px] font-bold text-orange bg-orange/10 dark:bg-orange-950/20 border border-orange/20 dark:border-orange-900/30 px-1.5 py-0.5 rounded-full">⚠ Reduce</span>;
  return <span className="text-[9px] font-bold text-danger bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 px-1.5 py-0.5 rounded-full">✕ Swap</span>;
}

// ─── Personalized tip color map ───────────────────────────────────────────────
const TIP_STYLES = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200/50 dark:border-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  pink: { bg: "bg-pink-50 dark:bg-pink-950/20", border: "border-pink-200/50 dark:border-pink-900/30", text: "text-pink-600 dark:text-pink-400" },
  red: { bg: "bg-coral/10 dark:bg-coral/20", border: "border-coral/25 dark:border-coral/20", text: "text-coral" },
  orange: { bg: "bg-orange/10 dark:bg-orange-950/20", border: "border-orange/20 dark:border-orange-900/30", text: "text-orange" },
  teal: { bg: "bg-secondary/10 dark:bg-secondary/20", border: "border-secondary/20 dark:border-secondary/15", text: "text-secondary" },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function ScanPlate({ patient }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("swaps");

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setResult(null);
    setScanProgress(0);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleAnalyze = () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setScanProgress(0);

    // Simulate progressive scan
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      setScanProgress(100);
      setAnalyzing(false);
      // Pick a random scenario
      const scenario = MEAL_SCENARIOS[Math.floor(Math.random() * MEAL_SCENARIOS.length)];
      setResult({ ...scenario, personalTips: getPersonalizedTips(patient) });
      setActiveTab("swaps");
    }, 2800);
  };

  const handleReset = () => {
    setImagePreview(null);
    setResult(null);
    setScanProgress(0);
    setAnalyzing(false);
  };

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
            📸 Scan My Plate
          </h2>
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-coral/15 to-secondary/15 border border-secondary/25 text-secondary px-2.5 py-1 rounded-full">
            ✦ AI Analysis
          </span>
        </div>
        {imagePreview && !analyzing && (
          <button onClick={handleReset}
            className="text-xs font-bold text-muted dark:text-gray-400 hover:text-danger flex items-center gap-1.5 transition-all self-start">
            ✕ Clear &amp; Start Over
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Upload / Preview ── */}
        <div>
          {!imagePreview ? (
            /* Drop Zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center min-h-[280px] cursor-pointer group ${
                dragOver
                  ? "border-secondary bg-secondary/5 dark:bg-secondary/10 scale-[1.01]"
                  : "border-primary/10 dark:border-primary/20 bg-gradient-to-br from-cream/40 to-white dark:from-[#241B18] dark:to-[#1C1411] hover:border-secondary hover:bg-secondary/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Decorative circles */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-secondary/5 dark:bg-secondary/10 flex items-center justify-center text-2xl opacity-60">🍽️</div>
              <div className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-orange/15 dark:bg-orange/10 flex items-center justify-center text-base opacity-40">🥗</div>

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-3xl mb-4 shadow-lg shadow-secondary/15 group-hover:-translate-y-1 transition-transform duration-300">
                📷
              </div>
              <h3 className="text-sm font-bold text-ink dark:text-white mb-1.5">Upload Your Plate Photo</h3>
              <p className="text-[11px] text-muted dark:text-gray-400 font-semibold max-w-xs leading-relaxed mb-5">
                Drag & drop a photo of your meal, or click to browse. Our AI will analyse the food and suggest healthier corrections.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-secondary/20 transition-all"
                >
                  📁 Browse Photo
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white dark:bg-[#201714] border border-primary/10 dark:border-primary/20 hover:border-secondary text-ink dark:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  📸 Use Camera
                </button>
              </div>

              {/* Supported formats */}
              <p className="text-[9px] text-muted/50 dark:text-gray-600 font-semibold mt-4">Supports JPG, PNG, WEBP, HEIC</p>

              {/* Hidden inputs */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          ) : (
            /* Image Preview with Scan Overlay */
            <div className="relative rounded-2xl overflow-hidden border border-[#e0eded] dark:border-gray-800 shadow-card dark:shadow-none">
              <img
                src={imagePreview}
                alt="Uploaded plate"
                className="w-full object-cover"
                style={{ maxHeight: "340px" }}
              />

              {/* Scanning overlay */}
              {analyzing && (
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                  {/* Scan line */}
                  <div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent shadow-lg"
                    style={{
                      top: `${scanProgress}%`,
                      boxShadow: "0 0 12px 3px #26A69A",
                      transition: "top 0.05s linear",
                    }}
                  />
                  {/* Scan corners */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-secondary rounded-tl-lg" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-secondary rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-secondary rounded-bl-lg" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-secondary rounded-br-lg" />

                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 text-center">
                    <div className="text-2xl mb-2">🔍</div>
                    <p className="text-white font-bold text-sm mb-1">Analysing Your Plate…</p>
                    <p className="text-white/60 text-[10px] font-semibold">Detecting foods · Checking portions · Personalising</p>
                    <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden w-36 mx-auto">
                      <div
                        className="h-full bg-secondary rounded-full transition-all duration-75"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-white/50 text-[10px] mt-1">{scanProgress}%</p>
                  </div>
                </div>
              )}

              {/* Result overlay badge */}
              {result && !analyzing && (
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-white text-[10px] font-bold">Analysis Complete · {result.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Analyse button */}
          {imagePreview && !analyzing && !result && (
            <button
              onClick={handleAnalyze}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-primary hover:from-secondary-dark hover:to-primary-dark text-white font-bold text-sm py-3.5 rounded-xl shadow-md shadow-secondary/20 transition-all duration-200"
            >
              🔍 Analyse My Plate with AI
            </button>
          )}

          {/* Re-analyse / change photo after result */}
          {result && !analyzing && (
            <div className="mt-3 flex gap-2">
              <button onClick={handleAnalyze}
                className="flex-1 text-xs font-bold text-secondary border border-secondary/30 hover:border-secondary hover:bg-cream dark:hover:bg-secondary/10 py-2.5 rounded-xl transition-all">
                🔄 Re-Analyse
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex-1 text-xs font-bold text-muted dark:text-gray-400 border border-primary/10 dark:border-primary/20 hover:border-secondary py-2.5 rounded-xl transition-all">
                📁 Change Photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          )}

          {/* Info strip */}
          <div className="mt-4 flex flex-wrap gap-2">
            {["🔒 Photo stays local", "🤖 AI-powered analysis", "👤 Profile-personalised"].map((t) => (
              <span key={t} className="text-[9px] font-bold text-muted dark:text-gray-500 bg-primary/5 dark:bg-[#1E1512]/50 px-2.5 py-1 rounded-full border border-primary/10 dark:border-primary/20">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: Results Panel ── */}
        <div>
          {!result && !analyzing && (
            /* Placeholder card */
            <div className="rounded-2xl border border-dashed border-primary/25 dark:border-primary/20 bg-gradient-to-br from-cream/40 to-white dark:from-[#241B18] dark:to-[#1C1411] min-h-[280px] flex flex-col items-center justify-center text-center p-8 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-2xl">🥦</div>
              <div>
                <h3 className="text-sm font-bold text-ink dark:text-white mb-1.5">AI Plate Corrections</h3>
                <p className="text-[11px] text-muted dark:text-gray-400 font-semibold max-w-xs leading-relaxed">
                  Upload a photo of your meal and click <strong className="text-secondary">Analyse My Plate</strong>. Your personalised food corrections will appear here.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-xs text-[10px] font-bold text-muted dark:text-gray-500">
                {["🔍 Food detection", "⚖️ Portion check", "🔄 Healthy swaps", "👤 Profile tips"].map((f) => (
                  <div key={f} className="bg-primary/5 dark:bg-[#1E1512]/50 rounded-xl px-3 py-2 text-center">{f}</div>
                ))}
              </div>
            </div>
          )}

          {analyzing && (
            /* Loading skeleton */
            <div className="rounded-2xl border border-primary/10 dark:border-primary/20 bg-white dark:bg-[#201714] p-5 space-y-4">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-[#e2f0f0] dark:bg-gray-800 rounded w-2/3" />
                <div className="h-4 bg-[#e2f0f0] dark:bg-gray-800 rounded w-full" />
                <div className="h-4 bg-[#e2f0f0] dark:bg-gray-800 rounded w-5/6" />
              </div>
              <div className="grid grid-cols-3 gap-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-[#e2f0f0] dark:bg-gray-800 rounded-xl" />)}
              </div>
              <div className="animate-pulse space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-[#e2f0f0] dark:bg-gray-800 rounded-xl" />)}
              </div>
            </div>
          )}

          {result && !analyzing && (
            <div className="rounded-2xl border border-primary/10 dark:border-primary/20 bg-white dark:bg-[#201714] overflow-hidden shadow-card dark:shadow-none">
              {/* Results header */}
              <div className="bg-gradient-to-r from-secondary/10 to-primary/5 dark:from-secondary/15 dark:to-primary/20 border-b border-primary/10 dark:border-primary/20 px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-secondary uppercase tracking-wider mb-0.5">AI Plate Analysis</div>
                  <h3 className="text-sm font-bold text-ink dark:text-white flex items-center gap-1.5">
                    <span>{result.emoji}</span> {result.label}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <ScoreRing score={result.portions.score} />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-primary/10 dark:border-primary/20 bg-cream/40 dark:bg-[#18110E]">
                {[
                  { id: "swaps", label: "🔄 Swaps" },
                  { id: "foods", label: "🍽️ Foods" },
                  { id: "macros", label: "📊 Macros" },
                  { id: "tips", label: "👤 For You" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 text-[10px] font-bold py-2.5 transition-all ${
                      activeTab === tab.id
                        ? "text-secondary border-b-2 border-secondary bg-white dark:bg-[#241B18]"
                        : "text-muted dark:text-gray-400 hover:text-secondary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4 max-h-[350px] overflow-y-auto scrollbar-thin space-y-3">
                {/* ── Foods tab ── */}
                {activeTab === "foods" && (
                  <div>
                    <p className="text-[10px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider mb-3">Detected Items</p>
                    <div className="space-y-2">
                      {result.detectedFoods.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/50 dark:bg-[#1E1512]/50 rounded-xl px-3.5 py-2.5 border border-primary/10 dark:border-primary/20">
                          <div>
                            <span className="text-xs font-bold text-ink dark:text-white">{f.name}</span>
                            <span className="text-[10px] text-muted dark:text-gray-400 font-semibold block">{f.amount}</span>
                          </div>
                          <FlagBadge flag={f.flag} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 bg-orange/10 dark:bg-orange-950/20 border border-orange/20 dark:border-orange-900/30 rounded-xl px-3.5 py-2.5">
                      <p className="text-[10px] font-bold text-orange mb-0.5">Portion Assessment</p>
                      <p className="text-[11px] text-muted dark:text-gray-300 font-semibold">{result.portions.overall}</p>
                    </div>
                  </div>
                )}

                {/* ── Swaps tab ── */}
                {activeTab === "swaps" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider">Healthier Ingredient Swaps</p>
                    {result.swaps.map((swap, i) => (
                      <div key={i} className="bg-white/50 dark:bg-[#1E1512]/50 rounded-xl p-3.5 border border-primary/10 dark:border-primary/20">
                        <div className="flex items-start gap-2 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-coral line-through">{swap.from}</span>
                              <span className="text-[10px] text-muted">→</span>
                              <span className="text-[11px] font-bold text-secondary">{swap.to}</span>
                            </div>
                            <p className="text-[10px] text-muted dark:text-gray-400 font-semibold mt-1 leading-relaxed">{swap.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider mt-3">Also Add</p>
                    {result.addOns.map((add, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] font-semibold text-ink dark:text-gray-200 bg-secondary/5 dark:bg-secondary/15 border border-secondary/15 rounded-xl px-3.5 py-2.5">
                        <span className="text-secondary mt-0.5 flex-shrink-0">✦</span>
                        {add}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Macros tab ── */}
                {activeTab === "macros" && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider">Before vs After Corrections</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      {[
                        { label: "Before", value: result.macros.calories, color: "text-coral" },
                        { label: "After", value: result.correctedMacros.calories, color: "text-secondary" },
                      ].map((m) => (
                        <div key={m.label} className="bg-white/50 dark:bg-[#1E1512]/50 rounded-xl p-3 border border-primary/10 dark:border-primary/20">
                          <span className="block text-[9px] text-muted dark:text-gray-400 uppercase tracking-wider font-bold">{m.label}</span>
                          <span className={`text-sm font-extrabold ${m.color}`}>{m.value}</span>
                          <span className="block text-[9px] text-muted dark:text-gray-400 font-semibold">Calories</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <MacroBar label="Protein" before={result.macros.protein} after={result.correctedMacros.protein} unit="g" color="secondary" />
                      <MacroBar label="Carbs" before={result.macros.carbs} after={result.correctedMacros.carbs} unit="g" color="orange" />
                      <MacroBar label="Fats" before={result.macros.fats} after={result.correctedMacros.fats} unit="g" color="blue-500" />
                      <MacroBar label="Fibre" before={result.macros.fiber} after={result.correctedMacros.fiber} unit="g" color="primary" />
                    </div>
                    <div className="bg-secondary/5 dark:bg-secondary/10 border border-secondary/20 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Potential Saving</p>
                      <p className="text-lg font-extrabold text-ink dark:text-white">
                        {parseInt(result.macros.calories) - parseInt(result.correctedMacros.calories)} kcal
                      </p>
                      <p className="text-[10px] text-muted dark:text-gray-400 font-semibold">per meal with these swaps</p>
                    </div>
                  </div>
                )}

                {/* ── Personal tips tab ── */}
                {activeTab === "tips" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider">
                      Personalised for {patient?.medical_conditions || "your profile"}
                    </p>
                    {result.personalTips.map((tip, i) => {
                      const s = TIP_STYLES[tip.color] || TIP_STYLES.teal;
                      return (
                        <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-3.5`}>
                          <div className={`text-[10px] font-extrabold uppercase tracking-wider ${s.text} mb-1 flex items-center gap-1.5`}>
                            <span>{tip.icon}</span> {tip.label}
                          </div>
                          <p className="text-[11px] text-ink dark:text-gray-200 font-semibold leading-relaxed">{tip.text}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
