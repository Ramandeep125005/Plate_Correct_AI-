import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChatBotModal from "../components/ChatBotModal";

// ─── AI response engine ───────────────────────────────────────────────────────
function getAIReply(query, patient) {
  const q = query.toLowerCase();
  const conds = (patient?.medical_conditions || "").toLowerCase();

  if (q.includes("thyroid"))
    return `🦋 **Thyroid Nutrition Tips for ${patient?.preferred_name || "you"}:**\n\n• Take Levothyroxine 30–60 mins before breakfast on an empty stomach.\n• Avoid raw goitrogenic foods (cabbage, cauliflower, broccoli) — cooking neutralises them.\n• Eat selenium-rich foods daily: Brazil nuts, sunflower seeds, tuna, eggs.\n• Include iodine sources: seaweed, dairy, seafood.\n• Avoid soy products close to medication time.`;

  if (q.includes("pcos") || q.includes("pcod"))
    return `🌸 **PCOS Diet Strategy:**\n\n• Choose low-GI carbs: oats, quinoa, brown rice, barley.\n• Always pair carbs with protein or fat to prevent insulin spikes.\n• Include anti-inflammatory foods: berries, leafy greens, omega-3 rich fish.\n• Spearmint tea may help reduce androgen levels (drink daily).\n• Limit: refined sugars, white flour, processed foods, alcohol.`;

  if (q.includes("anemia") || q.includes("iron") || q.includes("hemoglobin"))
    return `🩸 **Iron & Anemia Tips:**\n\n• Pair iron-rich foods with Vitamin C for maximum absorption (spinach + lemon juice).\n• Best iron sources: dark leafy greens, legumes, seeds, dried figs, moringa.\n• Avoid tea/coffee within 1 hour of iron-rich meals — tannins block absorption.\n• Cook in cast-iron cookware where possible.\n• Get a weekly beetroot + carrot juice for natural haemoglobin support.`;

  if (q.includes("prediabet") || q.includes("diabet") || q.includes("blood sugar") || q.includes("glucose"))
    return `🩺 **Blood Sugar & Prediabetes Tips:**\n\n• Start meals with vegetables or salad to slow glucose absorption.\n• Choose low-GI foods: legumes, whole grains, most vegetables.\n• Eat smaller, more frequent meals to maintain stable glucose.\n• Cinnamon with meals has shown blood sugar-lowering effects.\n• 10-minute walk after meals significantly reduces postprandial glucose.`;

  if (q.includes("hypertension") || q.includes("blood pressure") || q.includes("bp"))
    return `❤️ **Blood Pressure & Hypertension Tips:**\n\n• Follow the DASH diet: high in fruits, vegetables, whole grains, low-fat dairy.\n• Strictly limit sodium to under 1500mg/day — avoid processed and packaged foods.\n• Potassium-rich foods help: bananas, sweet potato, spinach, avocado.\n• Reduce caffeine intake and avoid alcohol.\n• Manage stress — cortisol directly raises blood pressure.`;

  if (q.includes("shift") || q.includes("night shift") || q.includes("rotation"))
    return `🌙 **Rotational / Night Shift Eating:**\n\n• Eat your main meal before the night shift begins, not in the middle of it.\n• Keep night-time meals light: salads, soups, protein snacks, fruits.\n• Avoid heavy carbs or high-fat meals between midnight and 5 AM.\n• Pack protein snacks: Greek yoghurt, boiled eggs, nuts, cottage cheese.\n• Taper off caffeine 4 hours before the shift ends to protect sleep quality.`;

  if (q.includes("breakfast") || q.includes("morning meal"))
    return `☀️ **Ideal Breakfast Principles:**\n\n• Eat within 1–2 hours of waking to kick-start metabolism.\n• Include protein (eggs, paneer, lentils, Greek yoghurt) to stay full longer.\n• Add fibre (oats, fruits, whole grains) to stabilise morning blood sugar.\n• Avoid skipping breakfast — it leads to overeating at lunch.\n• For your conditions, I'd suggest: ${conds.includes("thyroid") ? "Egg & Avocado toast" : conds.includes("pcos") ? "Chia seed pudding with berries" : "Vegetable oats upma with peanuts"}.`;

  if (q.includes("weight loss") || q.includes("lose weight") || q.includes("fat loss"))
    return `⚖️ **Sustainable Weight Loss Tips:**\n\n• Create a modest calorie deficit (~300–500 kcal/day) — no crash diets.\n• Prioritise protein at every meal: it preserves muscle while losing fat.\n• Eat slowly and without distractions — fullness signals take 20 minutes.\n• Strength training + walking is the most effective combination.\n• Track what you eat for 2 weeks — awareness alone drives results.`;

  if (q.includes("sleep") || q.includes("insomnia"))
    return `😴 **Sleep & Nutrition Connection:**\n\n• Avoid large meals 2–3 hours before bedtime.\n• Tryptophan-rich foods promote sleep: warm milk, banana, oats, nuts.\n• Limit caffeine after 2 PM (it has a 6-hour half-life in your body).\n• Magnesium helps relaxation: dark chocolate, pumpkin seeds, spinach, almonds.\n• Consistent sleep/wake times regulate hunger hormones leptin and ghrelin.`;

  if (q.includes("stress") || q.includes("anxiety") || q.includes("mood"))
    return `🧘 **Stress, Mood & Food:**\n\n• Magnesium-rich foods calm the nervous system: dark chocolate, avocado, spinach.\n• Omega-3 fatty acids reduce anxiety: walnuts, flax seeds, fatty fish.\n• Avoid excess sugar — it causes cortisol spikes and energy crashes.\n• Fermented foods (yoghurt, kimchi) support the gut-brain axis.\n• Hydration affects mood — even mild dehydration increases irritability.`;

  if (q.includes("water") || q.includes("hydrat"))
    return `💧 **Hydration Guide:**\n\n• Aim for 8–10 glasses (2–2.5 litres) of water daily.\n• Start each morning with a glass of warm water with lemon.\n• Eat water-rich foods: cucumber, watermelon, zucchini, tomatoes.\n• Reduce sugary drinks and excess caffeine which cause dehydration.\n• Your urine should be light yellow — pale straw colour means well-hydrated.`;

  if (q.includes("snack") || q.includes("hunger") || q.includes("craving"))
    return `🍎 **Smart Snacking Tips:**\n\n• Plan snacks in advance to avoid unhealthy impulse choices.\n• Best snacks: fruit + nut butter, veggie sticks + hummus, Greek yoghurt, roasted makhana.\n• Eat snacks only when genuinely hungry, not out of boredom.\n• Keep your snack under 150–200 kcal with protein to bridge meals.\n• Drink a glass of water first — thirst is often mistaken for hunger.`;

  if (q.includes("protein") || q.includes("muscle"))
    return `💪 **Protein & Muscle Support:**\n\n• Aim for 0.8–1.2g protein per kg of body weight daily.\n• Spread protein intake across 3–4 meals for optimal absorption.\n• Best plant proteins: lentils, chickpeas, tofu, paneer, quinoa, hemp seeds.\n• After workouts: consume protein within 30–45 minutes for muscle repair.\n• Don't forget: protein keeps you full and boosts metabolism.`;

  if (q.includes("gut") || q.includes("digestion") || q.includes("bloat"))
    return `🌿 **Gut Health & Digestion:**\n\n• Eat probiotic-rich foods daily: yoghurt, buttermilk, kefir, idli, dosa.\n• Add prebiotic fibre: oats, bananas, garlic, onion, asparagus.\n• Chew food thoroughly — digestion begins in the mouth.\n• Avoid eating when stressed (activates fight-or-flight, suppresses digestion).\n• Stay hydrated and eat regularly — irregular eating disrupts gut bacteria.`;

  if (q.includes("tip") || q.includes("rule") || q.includes("general") || q.includes("advice"))
    return `🥗 **Plate Correct AI's Core Rules:**\n\n1. **Plate balance:** ½ non-starchy vegetables · ¼ lean protein · ¼ complex carbs.\n2. **Tea & coffee timing:** Wait 30–60 minutes after meals (caffeine blocks iron absorption).\n3. **Eat slowly:** Put your fork down between bites. Chew 20+ times.\n4. **Meal timing:** Eat within consistent windows — your body clock matters.\n5. **80/20 rule:** Eat clean 80% of the time; enjoy mindfully the rest.`;

  // Default — contextual response
  return `🤖 Great question! Based on your profile${conds ? ` (${patient?.medical_conditions})` : ""}, I'd recommend focusing on balanced, whole-food meals that align with your health goals.\n\nYou can ask me about:\n• Thyroid / PCOS / Diabetes / Anemia nutrition\n• Meal timing for shift workers\n• Weight loss, protein, gut health\n• Snacking, hydration, sleep & stress\n• Breakfast ideas & general diet rules`;
}

// ─── Suggested questions per patient condition ───────────────────────────────
function getSuggestions(patient) {
  const conds = (patient?.medical_conditions || "").toLowerCase();
  const base = [
    { label: "🥗 Core diet rules", query: "General diet tips and rules" },
    { label: "☀️ Best breakfast", query: "What should I eat for breakfast?" },
    { label: "🍎 Smart snacks", query: "Give me smart snacking tips" },
    { label: "💧 Hydration guide", query: "How much water should I drink?" },
  ];
  if (conds.includes("thyroid"))
    base.unshift({ label: "🦋 Thyroid nutrition", query: "Thyroid diet guidelines" });
  if (conds.includes("pcos") || conds.includes("pcod"))
    base.unshift({ label: "🌸 PCOS meal plan", query: "PCOS diet strategy" });
  if (conds.includes("anemia") || conds.includes("hemoglobin"))
    base.unshift({ label: "🩸 Iron & anemia tips", query: "Iron absorption and anemia tips" });
  if (conds.includes("prediabetes") || conds.includes("diabetes"))
    base.unshift({ label: "🩺 Blood sugar tips", query: "Blood sugar and diabetes tips" });
  if (conds.includes("hypertension"))
    base.unshift({ label: "❤️ BP & heart tips", query: "Hypertension blood pressure tips" });
  return base.slice(0, 5);
}

// ─── Single message bubble ────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] mr-1.5 mt-0.5 flex-shrink-0">
          🌿
        </div>
      )}
      <div
        className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap font-medium ${
          isUser
            ? "bg-primary text-white rounded-tr-none shadow-sm shadow-primary/10"
            : "bg-white dark:bg-[#241B18] text-ink dark:text-gray-100 border border-primary/10 dark:border-primary/20 rounded-tl-none shadow-sm"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex justify-start mb-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] mr-1.5 flex-shrink-0">
        🌿
      </div>
      <div className="bg-white dark:bg-[#241B18] border border-primary/10 dark:border-primary/20 rounded-2xl rounded-tl-none px-3 py-2.5">
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { patient, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => localStorage.getItem("pca_theme") || "light");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [coachExpanded, setCoachExpanded] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Apply theme
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("pca_theme", theme);
  }, [theme]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Welcome message
  useEffect(() => {
    if (patient) {
      const conds = patient.medical_conditions || "your current profile";
      const greeting = `Hi ${patient.preferred_name || patient.name}! 🌿\n\nI'm your **AI Diet Coach** — trained to help you with nutrition for *${conds}*.\n\nAsk me anything: meal timing, foods to eat or avoid, hydration, blood sugar, iron, and more. I'm here every step of the way! 💚`;
      setMessages([{ sender: "ai", text: greeting }]);
    }
  }, [patient]);

  if (!patient) return null;

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const handleLogout = () => { logout(); navigate("/login"); };

  const handleSend = (text) => {
    const msg = (text || inputText).trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setInputText("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply = getAIReply(msg, patient);
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 900 + Math.random() * 500);
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "🍽️" },
    { name: "My Profile", path: "/profile", icon: "🩺" },
    { name: "AI Diet Coach", action: "coach", icon: "🌿" },
    { name: "Weekly Diet Plan", scrollId: "weekly-diet-plan", icon: "📅" },
    { name: "Scan Plate", path: "/scan-plate", icon: "📸" },
    { name: "Meal Check-In", path: "/builder", icon: "📝" },
    { name: "Meal History", scrollId: "meal-history", icon: "🍲" },
  ];

  const handleNavClick = (item, e) => {
    if (item.action === "coach") {
      e.preventDefault();
      setChatOpen((prev) => !prev);
    } else if (item.scrollId) {
      e.preventDefault();
      if (location.pathname === "/dashboard") {
        document.getElementById(item.scrollId)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(`/dashboard#${item.scrollId}`);
      }
    }
  };

  const displayName = patient.preferred_name || patient.name || "Patient";
  const avatarLetter = displayName[0]?.toUpperCase() || "P";
  const suggestions = getSuggestions(patient);

  // Hash scroll observer
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen w-full flex bg-transparent text-[#1E1B18] dark:text-gray-100 transition-colors duration-300">

      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-60 fixed top-0 bottom-0 left-0 bg-white/90 dark:bg-[#201714]/95 border-r border-primary/10 dark:border-primary/20 flex flex-col justify-between p-5 z-20 backdrop-blur-md">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg shadow-md shadow-primary/10">
              🥗
            </div>
            <div>
              <span className="block text-sm font-bold leading-tight text-ink dark:text-white">Plate Correct</span>
              <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">AI Coach</span>
            </div>
          </div>

          {/* Patient badge */}
          <div className="flex items-center gap-3 p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl mb-6">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs truncate text-ink dark:text-white">{displayName}</div>
              <div className="text-[10px] text-muted dark:text-gray-400 font-semibold">{patient.id}</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = item.path && location.pathname === item.path;
              if (item.action === "coach") {
                return (
                  <button
                    key={item.name}
                    onClick={() => setChatOpen((prev) => !prev)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#5c6870] dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-[#241B18]/60 hover:text-primary dark:hover:text-primary transition-all text-left"
                  >
                    <span className="text-sm">{item.icon}</span>
                    {item.name}
                  </button>
                );
              }
              if (item.scrollId) {
                return (
                  <a
                    key={item.name}
                    href={`#${item.scrollId}`}
                    onClick={(e) => handleNavClick(item, e)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#5c6870] dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-[#241B18]/60 hover:text-primary dark:hover:text-primary transition-all"
                  >
                    <span className="text-sm">{item.icon}</span>
                    {item.name}
                  </a>
                );
              }
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-[#5c6870] dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-[#241B18]/60 hover:text-primary dark:hover:text-primary"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-danger hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
            >
              <span className="text-sm">🚪</span>
              Logout
            </button>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="space-y-1.5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-muted dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-[#241B18]/60 hover:text-primary dark:hover:text-primary transition-all text-left"
          >
            <span>{theme === "light" ? "🌙" : "☀️"}</span>
            {theme === "light" ? "Dark Theme" : "Light Theme"}
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 pl-60 flex flex-col min-h-screen">
        <main className="flex-grow p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* ── Floating Action Button (FAB) ─────────────────────────────────── */}
      <button
        onClick={() => setChatOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-primary hover:from-secondary-dark hover:to-primary-dark text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center z-40 group"
        title="AI Diet Coach"
        id="ai-coach-fab"
      >
        {/* Pulsing online status indicator */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-[#201714] rounded-full animate-pulse" />
        <span className="text-2xl group-hover:rotate-12 transition-transform duration-200">🌿</span>
      </button>

      {/* ── Floating Chat Widget popover ─────────────────────────────────── */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white/95 dark:bg-[#201714]/95 border border-primary/15 dark:border-primary/25 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-md animate-fadeInUp">
          {/* Widget Header */}
          <div className="bg-gradient-to-r from-secondary to-primary px-4 py-3.5 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-sm">
                  🌿
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xs leading-none">AI Diet Coach</h2>
                <p className="text-white/70 text-[9px] font-semibold mt-0.5">Online · Personalised advice</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white/80 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
            >
              ✕
            </button>
          </div>

          {/* Patient context badge */}
          <div className="px-3.5 py-1.5 bg-primary/5 border-b border-primary/10 text-[9px] text-muted dark:text-gray-400 font-semibold flex items-center justify-between flex-shrink-0">
            <span>Context: {patient.preferred_name || patient.name}</span>
            <span className="uppercase tracking-wider text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {patient.medical_conditions ? "Medical Profile" : "General"}
            </span>
          </div>

          {/* Messages area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-1.5 bg-cream/30 dark:bg-[#160E0C]/60 scrollbar-thin">
            {messages.map((msg, idx) => (
              <Bubble key={idx} msg={msg} />
            ))}
            {isTyping && <TypingDots />}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested questions (visible when messages list is small) */}
          {messages.length <= 1 && (
            <div className="px-3.5 py-3 border-t border-primary/10 dark:border-primary/20 flex-shrink-0 bg-cream/40 dark:bg-[#160E0C]/80 max-h-[160px] overflow-y-auto">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted dark:text-gray-500 mb-2">
                Suggested Questions
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.query)}
                    className="text-left text-[10px] font-semibold text-[#D95D39] dark:text-[#F4978E] bg-primary/5 dark:bg-primary/10 hover:bg-primary/15 dark:hover:bg-[#241B18]/60 border border-primary/10 dark:border-primary/15 rounded-xl px-3 py-1.5 transition-all duration-150 flex items-center gap-2"
                  >
                    <span>{s.label}</span>
                    <span className="ml-auto text-[#D95D39]/50 dark:text-[#F4978E]/50 text-xs">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick suggestion chips (visible after chat starts) */}
          {messages.length > 1 && suggestions.length > 0 && (
            <div className="px-3.5 py-2 border-t border-primary/10 dark:border-primary/20 bg-cream/40 dark:bg-[#160E0C]/80 flex-shrink-0">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.query)}
                    className="whitespace-nowrap text-[10px] font-bold text-primary bg-white dark:bg-[#201714] border border-primary/25 dark:border-primary/15 hover:border-primary hover:bg-cream dark:hover:bg-primary/10 rounded-full px-3 py-1 transition-all"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 bg-white dark:bg-[#201714] border-t border-primary/10 dark:border-primary/20 flex-shrink-0">
            <div className={`flex items-center gap-2 bg-cream dark:bg-[#160E0C]/85 rounded-xl px-3 py-2 border transition-all duration-200 ${
              inputFocused ? "border-primary shadow-sm shadow-primary/10" : "border-primary/10 dark:border-primary/20"
            }`}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about diet, nutrition, meals…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                className="flex-1 text-[11px] bg-transparent outline-none font-semibold placeholder:text-muted/60 dark:placeholder:text-gray-600 dark:text-white min-w-0"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="w-7 h-7 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center flex-shrink-0 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen Expanded Coach Overlay ──────────────────────────── */}
      {coachExpanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="w-[480px] h-full bg-white dark:bg-[#201714] flex flex-col shadow-2xl animate-fadeInUp border-l border-primary/10 dark:border-primary/20">
            <div className="bg-gradient-to-r from-secondary to-primary px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">🌿</div>
                <div>
                  <h2 className="text-white font-bold text-sm">AI Diet Coach — Full Chat</h2>
                  <p className="text-white/70 text-[10px]">Personalised for {displayName}</p>
                </div>
              </div>
              <button onClick={() => setCoachExpanded(false)} className="text-white hover:text-gray-200 text-xl font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-cream/30 dark:bg-[#160E0C]/60">
              {messages.map((msg, idx) => <Bubble key={idx} msg={msg} />)}
              {isTyping && <TypingDots />}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white dark:bg-[#201714] border-t border-primary/10 dark:border-primary/20 flex gap-2">
              <input
                type="text"
                placeholder="Ask anything about nutrition, meals, health…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-primary/10 dark:border-primary/20 bg-cream dark:bg-[#160E0C]/50 outline-none focus:border-secondary dark:text-white font-semibold"
              />
              <button
                onClick={() => handleSend()}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
