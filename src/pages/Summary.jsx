import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Api } from "../api/client";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";

const LABELS = {
  primary_goal: { lose_weight: "Lose weight", gain_muscle: "Gain muscle", maintain: "Maintain weight", eat_healthier: "Eat healthier" },
  timeframe: { "1_month": "1 month", "3_months": "3 months", "6_months": "6 months", ongoing: "Ongoing" },
  meals_per_day: { "1-2": "1–2 meals", "3": "3 meals", "4-5": "4–5 meals", "6+": "6+ meals" },
  cooks_at_home: { yes: "Yes, mostly", sometimes: "Sometimes", rarely: "Rarely / mostly eat out" },
  dietary_restrictions: { vegetarian: "Vegetarian", vegan: "Vegan", gluten_free: "Gluten-free", dairy_free: "Dairy-free", none: "None" },
  method: { hand_method: "Hand method", measuring_cups: "Cups / spoons", food_scale: "Food scale", eyeballing: "Eyeballing / no method" },
  pregnant_or_nursing: { yes: "Yes", no: "No", prefer_not_say: "Prefer not to say" },
};

const label = (field, value) => (value ? LABELS[field]?.[value] || value : "—");

function Row({ label: l, value }) {
  return (
    <div className="flex justify-between gap-3 py-2 text-xs border-b border-orange-50/50 dark:border-gray-800 last:border-0">
      <span className="text-muted dark:text-gray-400 font-semibold">{l}</span>
      <span className="font-bold text-right text-ink dark:text-gray-200">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-b border-[#e0eded] dark:border-gray-800 last:border-0 py-4.5">
      <h3 className="text-xs font-bold text-[#1FAD9F] uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function Summary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Api.getAssessment(id).then(setAssessment).catch(() => setError("Could not load this check-in."));
  }, [id]);

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-muted font-bold text-sm">
          {error}
        </div>
      </Layout>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-muted">
        <Spinner /> Loading your Meal Check-In summary...
      </div>
    );
  }

  const { goal = {}, food_setup = {}, foods_often = {}, portion_method = {}, yesterday_meals = {}, safety_check = {} } = assessment;
  const items = foods_often.items || [];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {assessment.status === "completed" && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-success border border-[#22A06B]/25 font-bold text-xs rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            ✅ Your Meal Check-In has been saved successfully!
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-bold mb-1 text-ink dark:text-white">Meal Check-In Summary</h2>
          <p className="text-xs text-muted dark:text-gray-400 font-semibold mb-4">
            Created on {new Date(assessment.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <Section title="🎯 Goal">
            <Row label="Primary goal" value={label("primary_goal", goal.primary_goal)} />
            <Row label="Details" value={goal.target_detail} />
            <Row label="Timeframe" value={label("timeframe", goal.timeframe)} />
          </Section>

          <Section title="🍳 Food Setup">
            <Row label="Meals per day" value={label("meals_per_day", food_setup.meals_per_day)} />
            <Row label="Cooks at home" value={label("cooks_at_home", food_setup.cooks_at_home)} />
            <Row label="Dietary restrictions" value={(food_setup.dietary_restrictions || []).map((d) => label("dietary_restrictions", d)).join(", ")} />
            <Row label="Allergies" value={food_setup.allergies} />
          </Section>

          <Section title="🥗 Foods You Eat Often">
            {items.filter((f) => f.name).length ? items.filter((f) => f.name).map((f, i) => <Row key={i} label={f.name} value={f.frequency} />) : <Row label="Foods" value="—" />}
          </Section>

          <Section title="⚖️ Portion Method">
            <Row label="Method" value={label("method", portion_method.method)} />
            <Row label="Notes" value={portion_method.notes} />
          </Section>

          <Section title="🍽️ Yesterday's Meals">
            <Row label="Breakfast" value={yesterday_meals.breakfast} />
            <Row label="Lunch" value={yesterday_meals.lunch} />
            <Row label="Dinner" value={yesterday_meals.dinner} />
            <Row label="Snacks / drinks" value={yesterday_meals.snacks} />
          </Section>

          <Section title="🛡️ Safety Check">
            <Row label="Medical conditions" value={safety_check.medical_conditions} />
            <Row label="Medications" value={safety_check.medications} />
            <Row label="Pregnant / nursing" value={label("pregnant_or_nursing", safety_check.pregnant_or_nursing)} />
            <Row label="Confirmed not medical advice" value={safety_check.consult_confirmed ? "Yes" : "No"} />
          </Section>
        </div>

        <button
          className="btn btn-primary w-full font-bold mt-5"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    </Layout>
  );
}
