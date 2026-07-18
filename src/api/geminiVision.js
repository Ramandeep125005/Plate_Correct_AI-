// ─── Gemini Vision API — Plate Analysis ───────────────────────────────────────
// Uses gemini-1.5-flash vision model via Google AI Studio API.
// Set VITE_GEMINI_API_KEY in your .env file to enable real analysis.
// Without a key, the function returns a realistic mock result for UI development.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

// ─── System prompt for structured dietitian output ────────────────────────────
function buildPrompt(patientContext) {
  const { dietary_preference, medical_conditions, primary_goal, age, bmi_category } =
    patientContext || {};

  return `You are an expert clinical dietitian AI. Analyse the meal photo provided and return ONLY a valid JSON object (no markdown, no extra text, just the JSON).

Patient context:
- Dietary preference: ${dietary_preference || "Vegetarian"}
- Medical conditions: ${medical_conditions || "None"}
- Primary goal: ${primary_goal || "Weight management"}
- Age: ${age || "Adult"}
- BMI category: ${bmi_category || "Normal"}

Return this EXACT JSON structure (fill all fields accurately based on the image):
{
  "mealName": "Short descriptive name for the meal",
  "emoji": "Single most fitting emoji for the dish",
  "detectedFoods": [
    { "name": "Food item name", "amount": "Estimated portion/weight", "flag": "ok|warn|bad", "flagReason": "Brief reason for the flag" }
  ],
  "macros": {
    "calories": "Estimated kcal as string e.g. '~580 kcal'",
    "protein": "e.g. '~18g'",
    "carbs": "e.g. '~90g'",
    "fats": "e.g. '~14g'",
    "fiber": "e.g. '~5g'",
    "sodium": "e.g. '~620mg'"
  },
  "correctedMacros": {
    "calories": "After swaps",
    "protein": "After swaps",
    "carbs": "After swaps",
    "fats": "After swaps",
    "fiber": "After swaps",
    "sodium": "After swaps"
  },
  "portions": {
    "overall": "One sentence summary of portion balance",
    "score": 72,
    "grade": "B"
  },
  "swaps": [
    { "from": "Current ingredient", "to": "Better alternative", "reason": "Clinical reason personalised to patient context" }
  ],
  "addOns": [
    "Actionable add-on tip 1",
    "Actionable add-on tip 2"
  ],
  "alerts": [
    { "icon": "⚠️", "text": "Specific concern for this patient's conditions/goals" }
  ],
  "dietitianNote": "2-3 sentence personalised note for this patient considering their medical conditions and goal"
}

Provide 3–6 detected foods, 2–4 swaps, 2–3 addOns, 1–3 alerts. Be specific and clinically accurate. Base all recommendations on the patient's dietary_preference (respect vegetarian/vegan/non-veg), medical_conditions, and primary_goal.`;
}

// ─── Mock fallback result ─────────────────────────────────────────────────────
function getMockResult(patientContext) {
  const isVeg =
    !patientContext?.dietary_preference ||
    /veg/i.test(patientContext?.dietary_preference);

  return {
    mealName: "Demo Plate Analysis",
    emoji: "🍛",
    detectedFoods: [
      { name: "White rice", amount: "~220g (1.5 cups)", flag: "warn", flagReason: "High glycemic load — oversized portion" },
      { name: "Yellow dal (toor dal)", amount: "~150ml (1 cup)", flag: "ok", flagReason: "Good protein and fibre source" },
      { name: "Aloo sabzi", amount: "~100g", flag: "warn", flagReason: "Second starchy item alongside rice" },
      { name: "Papad (roasted)", amount: "1 piece (~15g)", flag: "ok", flagReason: "Roasted is acceptable — watch sodium" },
      { name: "Pickle / achaar", amount: "~20g (2 tsp)", flag: "bad", flagReason: "High sodium: ~600mg per tbsp" },
    ],
    macros: {
      calories: "~640 kcal",
      protein: "~18g",
      carbs: "~112g",
      fats: "~11g",
      fiber: "~6g",
      sodium: "~820mg",
    },
    correctedMacros: {
      calories: "~470 kcal",
      protein: "~24g",
      carbs: "~72g",
      fats: "~9g",
      fiber: "~12g",
      sodium: "~360mg",
    },
    portions: {
      overall: "Carb-dominant plate — protein adequate but vegetables are missing entirely",
      score: 54,
      grade: "C+",
    },
    swaps: [
      {
        from: "White rice (220g)",
        to: "Brown rice (120g) + cauliflower rice (80g)",
        reason: "Reduces glycaemic load by ~40% while maintaining satiety.",
      },
      {
        from: "Aloo sabzi",
        to: isVeg ? "Palak paneer or mixed vegetable sabzi" : "Chicken curry (small portion)",
        reason: "Potato doubles the starchy load. Leafy greens add iron and fibre.",
      },
      {
        from: "Pickle / achaar (20g)",
        to: "Fresh coriander-lemon chutney",
        reason: "Saves ~600mg sodium per serving. Lemon adds vitamin C for better iron absorption.",
      },
    ],
    addOns: [
      "Add ½ cup sautéed spinach or bottle gourd (lauki) on the side",
      "Start the meal with a small cucumber-tomato salad to aid satiety",
      "Squeeze fresh lemon over dal for better iron absorption",
    ],
    alerts: [
      { icon: "⚠️", text: "Sodium exceeds 800mg in this single meal — reduce if managing hypertension or PCOS water retention" },
      { icon: "🩸", text: "High carb load may spike blood glucose — pair rice with protein first if you have insulin resistance" },
    ],
    dietitianNote:
      "This is a nutritious base with a few important adjustments needed. Reduce the rice portion significantly and eliminate the pickle to bring sodium to a safe level. Adding a green vegetable sabzi would transform this into a well-rounded, goal-aligned meal.",
    _isMock: true,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Analyse a plate image using Gemini vision.
 * @param {string} base64Data — raw base64 string (no data URI prefix)
 * @param {string} mimeType  — e.g. "image/jpeg"
 * @param {object} patientContext — patient profile fields
 * @returns {Promise<object>} parsed analysis result
 */
// Helper to repair truncated or malformed JSON returned by Gemini
function repairJSON(jsonStr) {
  let cleaned = jsonStr.trim();

  // Find the first '{' and keep everything from there
  const startIdx = cleaned.indexOf('{');
  if (startIdx === -1) return {};
  cleaned = cleaned.substring(startIdx);

  let inString = false;
  let isEscaped = false;
  const stack = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  // If we ended up inside an unclosed string, close it
  let repaired = cleaned;
  if (inString) {
    repaired += '"';
  }

  // Close any unclosed braces/brackets in reverse order
  while (stack.length > 0) {
    const lastOpen = stack.pop();
    if (lastOpen === '{') {
      repaired += '}';
    } else if (lastOpen === '[') {
      repaired += ']';
    }
  }

  // Parse check with right-trim fallback for trailing garbage
  try {
    return JSON.parse(repaired);
  } catch (e) {
    let temp = repaired;
    while (temp.length > 0) {
      try {
        return JSON.parse(temp);
      } catch {
        temp = temp.slice(0, -1);
      }
    }
    throw e;
  }
}

export async function analyzeImage(base64Data, mimeType, patientContext = {}) {
  // No API key → return realistic mock
  if (!GEMINI_API_KEY) {
    await new Promise((r) => setTimeout(r, 2200)); // simulate network delay
    return getMockResult(patientContext);
  }

  const prompt = buildPrompt(patientContext);

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const defaultResult = {
    mealName: "Scanned Meal",
    emoji: "🍛",
    detectedFoods: [],
    macros: { calories: "-", protein: "-", carbs: "-", fats: "-", fiber: "-", sodium: "-" },
    correctedMacros: { calories: "-", protein: "-", carbs: "-", fats: "-", fiber: "-", sodium: "-" },
    portions: { overall: "Analysis partially completed.", score: 60, grade: "B-" },
    swaps: [],
    addOns: [],
    alerts: [],
    dietitianNote: "We analyzed your plate, but the model output was truncated. Here are the partially recovered items."
  };

  try {
    const parsed = repairJSON(text);
    return { ...defaultResult, ...parsed };
  } catch (err) {
    throw new Error("Gemini returned non-JSON response. Raw: " + text.slice(0, 200));
  }
}
