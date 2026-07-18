import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { insertMealCheckin, updateMealCheckin } from "../api/supabase";
import Layout from "../components/Layout";
import ChoiceGroup from "../components/ChoiceGroup";
import Spinner from "../components/Spinner";

const STEP_NAMES = ["Goal", "Food Setup", "Foods You Eat Often", "Portion Method", "Yesterday's Meals", "Safety Check"];
const LOCAL_STATE_KEY = "pca_builder_state";
const LOCAL_DRAFT_ID_KEY = "pca_builder_draft_id";

const DEFAULT_STATE = {
  goal: { primary_goal: "", target_detail: "", timeframe: "" },
  food_setup: { meals_per_day: "", cooks_at_home: "", dietary_restrictions: [], allergies: "" },
  foods_often: { items: [{ name: "", frequency: "" }] },
  portion_method: { method: "", notes: "" },
  yesterday_meals: { breakfast: "", lunch: "", dinner: "", snacks: "" },
  safety_check: { medical_conditions: "", medications: "", pregnant_or_nursing: "", consult_confirmed: false },
};

export default function Builder() {
  const navigate = useNavigate();
  const { patient } = useAuth();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [state, setState] = useState(DEFAULT_STATE);
  const [errors, setErrors] = useState({});
  const [assessmentId, setAssessmentId] = useState(null);
  const [supabaseRowId, setSupabaseRowId] = useState(null); // Supabase row uuid
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const autosaveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const draftId = localStorage.getItem(LOCAL_DRAFT_ID_KEY);
      if (draftId) {
        try {
          const a = await Api.getAssessment(draftId);
          setAssessmentId(a.id);
          setState({
            goal: { ...DEFAULT_STATE.goal, ...a.goal },
            food_setup: { ...DEFAULT_STATE.food_setup, ...a.food_setup },
            foods_often: a.foods_often?.items?.length ? a.foods_often : DEFAULT_STATE.foods_often,
            portion_method: { ...DEFAULT_STATE.portion_method, ...a.portion_method },
            yesterday_meals: { ...DEFAULT_STATE.yesterday_meals, ...a.yesterday_meals },
            safety_check: { ...DEFAULT_STATE.safety_check, ...a.safety_check },
          });
        } catch {
          localStorage.removeItem(LOCAL_DRAFT_ID_KEY);
        }
      } else {
        const local = localStorage.getItem(LOCAL_STATE_KEY);
        if (local) {
          try { setState(JSON.parse(local)); } catch {}
        }
      }
      setLoading(false);
    })();
  }, []);

  const updateSection = (section, patch) => {
    setState((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  };

  const persistLocally = (next) => localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(next));

  const scheduleAutosave = (next) => {
    persistLocally(next);
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => autosaveDraft(next), 1200);
  };

  const autosaveDraft = async (stateToSave) => {
    setSaving(true);
    const payload = { status: "draft", ...stateToSave };
    try {
      // 1. Save locally (existing mock backend)
      if (assessmentId) {
        await Api.updateAssessment(assessmentId, payload);
      } else {
        const created = await Api.saveAssessment(payload);
        setAssessmentId(created.id);
        localStorage.setItem(LOCAL_DRAFT_ID_KEY, created.id);
      }
      // 2. Sync to Supabase (fire-and-forget on autosave)
      try {
        if (supabaseRowId) {
          await updateMealCheckin(supabaseRowId, stateToSave, patient, "draft");
        } else {
          const row = await insertMealCheckin(stateToSave, patient, "draft");
          if (row?.id) setSupabaseRowId(row.id);
        }
      } catch (sbErr) {
        console.warn("[Supabase] autosave failed (local copy safe):", sbErr.message);
      }
    } catch {
      // silent fail — local copy still safe
    } finally {
      setSaving(false);
    }
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!state.goal.primary_goal) e.primary_goal = "Please choose a goal";
      if (!state.goal.target_detail.trim()) e.target_detail = "Please describe your goal";
      if (!state.goal.timeframe) e.timeframe = "Please choose a timeframe";
    } else if (step === 1) {
      if (!state.food_setup.meals_per_day) e.meals_per_day = "Please select an option";
      if (!state.food_setup.cooks_at_home) e.cooks_at_home = "Please select an option";
    } else if (step === 2) {
      if (!state.foods_often.items.some((i) => i.name.trim())) e.foods_often = "Add at least one food you eat often";
    } else if (step === 3) {
      if (!state.portion_method.method) e.method = "Please select a portion method";
    } else if (step === 4) {
      const m = state.yesterday_meals;
      if (!m.breakfast.trim() && !m.lunch.trim() && !m.dinner.trim()) e.yesterday_meals = "Please fill in at least one meal";
    } else if (step === 5) {
      if (!state.safety_check.pregnant_or_nursing) e.pregnant_or_nursing = "Please select an option";
      if (!state.safety_check.consult_confirmed) e.consult_confirmed = "Please confirm you understand this is not medical advice";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = async () => {
    if (!validateStep()) return;
    persistLocally(state);
    if (step === STEP_NAMES.length - 1) {
      await finish();
      return;
    }
    await autosaveDraft(state);
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    persistLocally(state);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveAndExit = async () => {
    persistLocally(state);
    await autosaveDraft(state);
    navigate("/dashboard");
  };

  const finish = async () => {
    setFinishing(true);
    const payload = { status: "completed", ...state };
    try {
      // 1. Save to local mock backend
      const final = assessmentId
        ? await Api.updateAssessment(assessmentId, payload)
        : await Api.saveAssessment(payload);

      // 2. Save / update completed record in Supabase
      try {
        if (supabaseRowId) {
          await updateMealCheckin(supabaseRowId, state, patient, "completed");
        } else {
          await insertMealCheckin(state, patient, "completed");
        }
      } catch (sbErr) {
        console.warn("[Supabase] final save failed:", sbErr.message);
        // Don't block navigation — data is safe locally
      }

      localStorage.removeItem(LOCAL_DRAFT_ID_KEY);
      localStorage.removeItem(LOCAL_STATE_KEY);
      navigate(`/summary/${final.id}`);
    } catch (err) {
      alert(err.message || "Could not save your Meal Check-In. Please try again.");
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-muted">
        <Spinner /> Preparing your Meal Check-In…
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink dark:text-white">Meal Check-In</h1>
            <p className="text-xs text-muted dark:text-gray-400 font-semibold mt-0.5">Let's log your meals and nutrition goals.</p>
          </div>
          <button
            onClick={saveAndExit}
            className="btn btn-ghost text-xs border border-primary/20 dark:border-gray-800 hover:bg-primary/10 hover:border-primary/30 px-4 py-2 font-bold transition-all rounded-full"
          >
            Save &amp; Exit
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold text-muted mb-2">
            <span>Step {step + 1} of {STEP_NAMES.length}</span>
            <span>{STEP_NAMES[step]}</span>
          </div>
          <div className="h-2.5 bg-orange-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEP_NAMES.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          {step === 0 && (
            <StepGoal state={state.goal} errors={errors} onChange={(p) => scheduleAutosave({ ...state, goal: { ...state.goal, ...p } }) || updateSection("goal", p)} />
          )}
          {step === 1 && (
            <StepFoodSetup state={state.food_setup} errors={errors} onChange={(p) => { updateSection("food_setup", p); scheduleAutosave({ ...state, food_setup: { ...state.food_setup, ...p } }); }} />
          )}
          {step === 2 && (
            <StepFoodsOften items={state.foods_often.items} errors={errors} onChange={(items) => { updateSection("foods_often", { items }); scheduleAutosave({ ...state, foods_often: { items } }); }} />
          )}
          {step === 3 && (
            <StepPortion state={state.portion_method} errors={errors} onChange={(p) => { updateSection("portion_method", p); scheduleAutosave({ ...state, portion_method: { ...state.portion_method, ...p } }); }} />
          )}
          {step === 4 && (
            <StepMeals state={state.yesterday_meals} errors={errors} onChange={(p) => { updateSection("yesterday_meals", p); scheduleAutosave({ ...state, yesterday_meals: { ...state.yesterday_meals, ...p } }); }} />
          )}
          {step === 5 && (
            <StepSafety state={state.safety_check} errors={errors} onChange={(p) => { updateSection("safety_check", p); scheduleAutosave({ ...state, safety_check: { ...state.safety_check, ...p } }); }} />
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" className={`btn btn-secondary flex-1 ${step === 0 ? "invisible" : ""}`} onClick={goPrev}>← Previous</button>
            <button type="button" className="btn btn-primary font-bold flex-1" onClick={goNext} disabled={finishing}>
              {finishing ? <Spinner /> : step === STEP_NAMES.length - 1 ? "Finish & Save ✓" : "Next →"}
            </button>
          </div>

          <div className="text-[10px] text-muted text-center mt-4 flex items-center justify-center gap-1.5 min-h-[16px] font-semibold">
            {saving && (<><Spinner className="!w-3 !h-3" /> Saving...</>)}
            {!saving && assessmentId && (<><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Progress Autosaved</>)}
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ---------------- Step components ---------------- */

function StepGoal({ state, errors, onChange }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-ink dark:text-white">What's your goal?</h2>
      <p className="text-xs text-muted dark:text-gray-400 font-semibold mb-5">Tell us what you're hoping to achieve.</p>

      <Field label="Primary goal" error={errors.primary_goal}>
        <ChoiceGroup
          value={state.primary_goal}
          onChange={(v) => onChange({ primary_goal: v })}
          options={[
            { value: "lose_weight", label: "Lose weight" },
            { value: "gain_muscle", label: "Gain muscle" },
            { value: "maintain", label: "Maintain weight" },
            { value: "eat_healthier", label: "Eat healthier" },
          ]}
        />
      </Field>

      <Field label="Describe your goal in your own words" error={errors.target_detail}>
        <textarea className="field-input min-h-[90px]" placeholder="e.g. I want to lose about 5kg over the next 3 months"
          value={state.target_detail} onChange={(e) => onChange({ target_detail: e.target.value })} />
      </Field>

      <Field label="Timeframe" error={errors.timeframe}>
        <ChoiceGroup
          value={state.timeframe}
          onChange={(v) => onChange({ timeframe: v })}
          options={[
            { value: "1_month", label: "1 month" },
            { value: "3_months", label: "3 months" },
            { value: "6_months", label: "6 months" },
            { value: "ongoing", label: "Ongoing" },
          ]}
        />
      </Field>
    </div>
  );
}

function StepFoodSetup({ state, errors, onChange }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-ink dark:text-white">Your food setup</h2>
      <p className="text-xs text-muted dark:text-gray-400 font-semibold mb-5">Help us understand your everyday eating environment.</p>

      <Field label="How many meals do you eat per day?" error={errors.meals_per_day}>
        <ChoiceGroup value={state.meals_per_day} onChange={(v) => onChange({ meals_per_day: v })}
          options={[{ value: "1-2", label: "1–2" }, { value: "3", label: "3" }, { value: "4-5", label: "4–5" }, { value: "6+", label: "6+" }]} />
      </Field>

      <Field label="Do you mostly cook at home?" error={errors.cooks_at_home}>
        <ChoiceGroup value={state.cooks_at_home} onChange={(v) => onChange({ cooks_at_home: v })}
          options={[{ value: "yes", label: "Yes, mostly" }, { value: "sometimes", label: "Sometimes" }, { value: "rarely", label: "Rarely / mostly eat out" }]} />
      </Field>

      <Field label="Dietary restrictions (select all that apply)">
        <ChoiceGroup multi value={state.dietary_restrictions} onChange={(v) => onChange({ dietary_restrictions: v })}
          options={[
            { value: "vegetarian", label: "Vegetarian" }, { value: "vegan", label: "Vegan" },
            { value: "gluten_free", label: "Gluten-free" }, { value: "dairy_free", label: "Dairy-free" }, { value: "none", label: "None" },
          ]} />
      </Field>

      <Field label="Any food allergies?">
        <input type="text" className="field-input" placeholder="e.g. peanuts, shellfish (leave blank if none)"
          value={state.allergies} onChange={(e) => onChange({ allergies: e.target.value })} />
      </Field>
    </div>
  );
}

function StepFoodsOften({ items, errors, onChange }) {
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => items.length > 1 && onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { name: "", frequency: "" }]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-ink dark:text-white">Foods you eat often</h2>
      <p className="text-xs text-muted dark:text-gray-400 font-semibold mb-5">List a few foods that show up in your diet regularly.</p>

      <div className="flex flex-col gap-2.5 mb-3.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2.5 items-center">
            <input type="text" className="field-input flex-1" placeholder="Food (e.g. rice)" value={item.name} onChange={(e) => update(idx, { name: e.target.value })} />
            <input type="text" className="field-input flex-1" placeholder="Frequency (e.g. daily)" value={item.frequency} onChange={(e) => update(idx, { frequency: e.target.value })} />
            <button type="button" className="w-10 h-10 flex-shrink-0 rounded-xl bg-orange-100 dark:bg-gray-800 text-primary-dark font-bold hover:bg-[#1fad9f]/10" onClick={() => remove(idx)}>✕</button>
          </div>
        ))}
      </div>
      <button type="button" className="border-[1.5px] border-dashed border-[#1FAD9F] text-[#1FAD9F] rounded-xl px-4 py-2.5 text-xs font-bold" onClick={add}>
        + Add another food
      </button>
      <div className="error-text mt-2">{errors.foods_often}</div>
    </div>
  );
}

function StepPortion({ state, errors, onChange }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-ink dark:text-white">How do you measure portions?</h2>
      <p className="text-xs text-muted dark:text-gray-400 font-semibold mb-5">This helps us calibrate recommendations to how you actually eat.</p>

      <Field label="Portion method" error={errors.method}>
        <ChoiceGroup value={state.method} onChange={(v) => onChange({ method: v })}
          options={[
            { value: "hand_method", label: "Hand method" }, { value: "measuring_cups", label: "Cups / spoons" },
            { value: "food_scale", label: "Food scale" }, { value: "eyeballing", label: "Eyeballing / no method" },
          ]} />
      </Field>

      <Field label="Anything else about how you portion meals?">
        <textarea className="field-input min-h-[90px]" placeholder="Optional notes" value={state.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </Field>
    </div>
  );
}

function StepMeals({ state, errors, onChange }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-ink dark:text-white">Yesterday's meals</h2>
      <p className="text-xs text-muted dark:text-gray-400 font-semibold mb-5">Walk us through what you actually ate yesterday.</p>

      {["breakfast", "lunch", "dinner", "snacks"].map((key) => (
        <Field key={key} label={key === "snacks" ? "Snacks / drinks" : key[0].toUpperCase() + key.slice(1)}>
          <textarea className="field-input min-h-[70px]" placeholder={`What did you eat for ${key}?`} value={state[key]} onChange={(e) => onChange({ [key]: e.target.value })} />
        </Field>
      ))}
      <div className="error-text">{errors.yesterday_meals}</div>
    </div>
  );
}

function StepSafety({ state, errors, onChange }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-ink dark:text-white">Safety check</h2>
      <p className="text-xs text-muted dark:text-gray-400 font-semibold mb-5">A few quick questions so recommendations stay safe for you.</p>

      <Field label="Any relevant medical conditions?">
        <textarea className="field-input min-h-[70px]" placeholder="e.g. diabetes, high blood pressure (leave blank if none)"
          value={state.medical_conditions} onChange={(e) => onChange({ medical_conditions: e.target.value })} />
      </Field>

      <Field label="Are you currently taking any medications?">
        <input type="text" className="field-input" placeholder="Leave blank if none" value={state.medications} onChange={(e) => onChange({ medications: e.target.value })} />
      </Field>

      <Field label="Are you currently pregnant or nursing?" error={errors.pregnant_or_nursing}>
        <ChoiceGroup value={state.pregnant_or_nursing} onChange={(v) => onChange({ pregnant_or_nursing: v })}
          options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "prefer_not_say", label: "Prefer not to say" }]} />
      </Field>

      <label className="flex items-center gap-2.5 chip w-full mt-1">
        <input type="checkbox" checked={state.consult_confirmed} onChange={(e) => onChange({ consult_confirmed: e.target.checked })} />
        I understand this is not medical advice and I should consult a doctor for medical concerns.
      </label>
      <div className="error-text">{errors.consult_confirmed}</div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="mb-[18px]">
      <label className="field-label">{label}</label>
      {children}
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
