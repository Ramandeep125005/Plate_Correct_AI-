const TOKEN_KEY = "pca_token";
const PATIENT_KEY = "pca_patient";
const ASSESSMENTS_KEY = "pca_mock_assessments";

// ─── Runtime-loaded patient data ──────────────────────────────────────────────
let _patientsCache = null;

// Robust RFC 4180-compliant CSV parser
function parseCSV(csvText) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        currentLine.push(currentField);
        currentField = '';
        if (currentLine.some(field => field.trim() !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
      } else {
        currentField += char;
      }
    }
  }
  if (currentField !== '' || currentLine.length > 0) {
    currentLine.push(currentField);
    if (currentLine.some(field => field.trim() !== '')) {
      lines.push(currentLine);
    }
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index].trim() : '';
    });
    data.push(obj);
  }

  return data;
}

async function getPatientsData() {
  if (_patientsCache) return _patientsCache;

  try {
    // Load from local Patient_Profile_Data.json file (converted from Data/Patient_Profile_Data.xls)
    const res = await fetch(`/Patient_Profile_Data.json?v=${Date.now()}`);
    if (!res.ok) throw new Error("Failed to load local Patient_Profile_Data.json");
    _patientsCache = await res.json();
    console.log(`[Local Dataset] Successfully loaded ${_patientsCache.length} patients from Patient_Profile_Data.json.`);
    return _patientsCache;
  } catch (err) {
    console.error("[Local Dataset] Error fetching Patient_Profile_Data.json, falling back to patients.json:", err);
    // Fallback to local patients.json
    const res = await fetch(`/patients.json?v=${Date.now()}`);
    if (!res.ok) throw new Error("Failed to load local patient data");
    _patientsCache = await res.json();
    return _patientsCache;
  }
}

export function clearPatientsCache() {
  _patientsCache = null;
}


// Storage helper functions
export const Storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getPatient: () => {
    try {
      return JSON.parse(localStorage.getItem(PATIENT_KEY) || "null");
    } catch {
      return null;
    }
  },
  setPatient: (patient) => localStorage.setItem(PATIENT_KEY, JSON.stringify(patient)),
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PATIENT_KEY);
  },
};

// Map raw excel format from patients.json to UI-friendly camelCase/snake_case format
function mapPatient(raw) {
  if (!raw) return null;

  const heightStr = raw["Height"] || "";
  const heightVal = parseFloat(heightStr) || 0;

  const weightStr = raw["Weight"] || "";
  const weightVal = parseFloat(weightStr) || 0;

  // Calculate BMI and Category
  let bmi = 22.0;
  let bmiCategory = "Normal";
  if (heightVal > 0 && weightVal > 0) {
    const heightM = heightVal / 100;
    bmi = parseFloat((weightVal / (heightM * heightM)).toFixed(1));
    if (bmi < 18.5) bmiCategory = "Underweight";
    else if (bmi < 25) bmiCategory = "Normal";
    else if (bmi < 30) bmiCategory = "Overweight";
    else bmiCategory = "Obese";
  }

  // Parse activity percentage
  const activityStr = raw["Activity Level"] || "";
  let activityPercent = 50;
  if (/sedentary/i.test(activityStr)) activityPercent = 15;
  else if (/light/i.test(activityStr)) activityPercent = 45;
  else if (/moderate/i.test(activityStr)) activityPercent = 70;
  else if (/very|high/i.test(activityStr)) activityPercent = 95;

  // Parse sleep percentage
  const sleepStr = raw["Sleep pattern "] || "";
  let sleepPercent = 60;
  if (/< 5|irregular/i.test(sleepStr)) sleepPercent = 30;
  else if (/6\u20137|6-7/i.test(sleepStr)) sleepPercent = 65;
  else if (/7\u20138|7-8|8\+/i.test(sleepStr)) sleepPercent = 85;

  // Parse stress percentage
  const stressStr = raw["Stress Level"] || "";
  let stressPercent = 50;
  if (/low/i.test(stressStr)) stressPercent = 20;
  else if (/moderate/i.test(stressStr)) stressPercent = 55;
  else if (/high/i.test(stressStr)) stressPercent = 85;

  // Medicines and Supplements
  const meds = raw["Are you currently taking any medicines? If yes, mention them.  "] || "";
  const sups = raw["Are taking any supplements, protein powder, herbal or ayurvedic products? If yes, were they prescribed?  "] || raw["Are you taking any supplements, protein powder, herbal or ayurvedic products? If yes, were they prescribed?  "] || "";
  const medsList = [];
  if (meds && meds.toLowerCase() !== "no" && meds.toLowerCase() !== "none") medsList.push(meds);
  if (sups && sups.toLowerCase() !== "no" && sups.toLowerCase() !== "none") medsList.push(sups);
  const medicinesSummary = medsList.length > 0 ? medsList.join("; ") : "None";

  return {
    id: raw["Patient ID"],
    name: raw["Full Name"],
    preferred_name: raw["Full Name"] ? raw["Full Name"].split(" ")[0] : "",
    email: raw["Email ID"],
    age: raw["Age "],
    height: heightStr || `${heightVal} cm`,
    weight: weightStr || `${weightVal} kg`,
    bmi: bmi,
    bmi_category: bmiCategory,
    dietary_preference: raw["Dietary Preference "] || "Vegetarian",
    primary_goal: raw["What is your main reason for using Plate Correct AI?  "] || "Weight management",
    life_stage: raw["Which life stage currently applies to you? "] || "Reproductive age",
    medical_conditions: raw["Have you been diagnosed with any of the following?   (PCOS/PCOD; Thyroid condition; Hypertension; Anemia / low hemoglobin; Prediabetes; Diabetes; Gestational diabetes; Insulin resistance; Fatty liver; Kidney disease; Liver disease; Heart disease; Digestive condition; Autoimmune condition; Recent surgery; Doctor-prescribed restricted diet; None of the above; Other) Specify"] || "None",
    food_allergy: raw["Do you have any food allergies, intolerances, or a doctor-prescribed diet restriction?  "] || "None",
    medicines: medicinesSummary,
    meals_per_day: raw["How many meals do you eat per day ?"] || "3",
    breakfast_habit: raw["How often do you drink tea or coffee, and do you usually have it within 30\u201360 minutes of a meal?  "] || "1 cup/day",
    outside_food_frequency: raw["How often do you eat outside food or consume sweets, bakery items, fried snacks, or sugary drinks?  "] || "Rarely",
    food_budget: raw["Food budget  "] || "Medium",
    
    // Lifestyle metrics for SVG charts
    activity_level: activityStr,
    activity_percent: activityPercent,
    sleep_pattern: sleepStr,
    sleep_percent: sleepPercent,
    stress_level: stressStr,
    stress_percent: stressPercent,
  };
}

// Local storage assessments database helper
function getStoredAssessments() {
  try {
    return JSON.parse(localStorage.getItem(ASSESSMENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveStoredAssessments(list) {
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(list));
}

// Simulate network delay
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const Api = {
  getRegistrationConfig: async () => {
    await delay();
    return {
      registration_form_url: "https://form.typeform.com/to/c8xblE4k",
    };
  },

  login: async (patientId, name) => {
    await delay(300);
    const cleanedId = String(patientId).trim().toUpperCase();
    const cleanedName = String(name).trim().toLowerCase();

    // Look up patient in dataset (loaded live from /public/patients.json)
    const patientsData = await getPatientsData();
    const match = patientsData.find(
      (p) =>
        String(p["Patient ID"]).trim().toUpperCase() === cleanedId &&
        String(p["Full Name"]).trim().toLowerCase() === cleanedName
    );

    if (!match) {
      const error = new Error("Patient record not found");
      error.status = 404;
      throw error;
    }

    const patient = mapPatient(match);
    const token = `mock_token_${patient.id}`;

    return { token, patient };
  },

  validateSession: async () => {
    await delay(100);
    const token = Storage.getToken();
    if (!token || !token.startsWith("mock_token_")) {
      const error = new Error("Invalid session token");
      error.status = 401;
      throw error;
    }

    const patientId = token.replace("mock_token_", "");
    const patientsData = await getPatientsData();
    const match = patientsData.find(
      (p) => String(p["Patient ID"]).trim().toUpperCase() === patientId
    );

    if (!match) {
      const error = new Error("Patient not found");
      error.status = 401;
      throw error;
    }

    return { patient: mapPatient(match) };
  },

  logout: async () => {
    await delay(50);
    return { success: true };
  },

  getProfile: async () => {
    const session = await Api.validateSession();
    return session.patient;
  },

  saveAssessment: async (payload) => {
    await delay(200);
    const session = await Api.validateSession();
    const list = getStoredAssessments();

    const newAssessment = {
      id: `asm_${Math.floor(100000 + Math.random() * 900000)}`,
      patient_id: session.patient.id,
      created_at: new Date().toISOString(),
      status: payload.status || "draft",
      goal: payload.goal || {},
      food_setup: payload.food_setup || {},
      foods_often: payload.foods_often || {},
      portion_method: payload.portion_method || {},
      yesterday_meals: payload.yesterday_meals || {},
      safety_check: payload.safety_check || {},
    };

    list.push(newAssessment);
    saveStoredAssessments(list);

    return newAssessment;
  },

  updateAssessment: async (id, payload) => {
    await delay(200);
    const session = await Api.validateSession();
    const list = getStoredAssessments();

    const idx = list.findIndex(
      (a) => a.id === id && a.patient_id === session.patient.id
    );

    if (idx === -1) {
      const error = new Error("Assessment not found");
      error.status = 404;
      throw error;
    }

    const updated = {
      ...list[idx],
      status: payload.status || list[idx].status,
      goal: payload.goal || list[idx].goal,
      food_setup: payload.food_setup || list[idx].food_setup,
      foods_often: payload.foods_often || list[idx].foods_often,
      portion_method: payload.portion_method || list[idx].portion_method,
      yesterday_meals: payload.yesterday_meals || list[idx].yesterday_meals,
      safety_check: payload.safety_check || list[idx].safety_check,
      updated_at: new Date().toISOString(),
    };

    list[idx] = updated;
    saveStoredAssessments(list);

    return updated;
  },

  getAssessment: async (id) => {
    await delay(100);
    const session = await Api.validateSession();
    const list = getStoredAssessments();

    const found = list.find(
      (a) => a.id === id && a.patient_id === session.patient.id
    );

    if (!found) {
      const error = new Error("Assessment not found");
      error.status = 404;
      throw error;
    }

    return found;
  },

  getDraft: async () => {
    await delay(100);
    const session = await Api.validateSession();
    const list = getStoredAssessments();

    const draft = list.find(
      (a) => a.patient_id === session.patient.id && a.status === "draft"
    );

    return { draft: draft || null };
  },

  getHistory: async () => {
    await delay(100);
    const session = await Api.validateSession();
    const list = getStoredAssessments();

    const history = list
      .filter((a) => a.patient_id === session.patient.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { assessments: history };
  },

  deleteAssessment: async (id) => {
    await delay(100);
    const session = await Api.validateSession();
    const list = getStoredAssessments();

    const filtered = list.filter(
      (a) => !(a.id === id && a.patient_id === session.patient.id)
    );

    saveStoredAssessments(filtered);
    return { success: true };
  },
};
