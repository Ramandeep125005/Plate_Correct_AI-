import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

function isFilled(value) {
  if (value === null || value === undefined) return false;
  const str = String(value).trim();
  if (!str) return false;
  return !/^(none|na|n\/a|nil|no)$/i.test(str);
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-2.5 text-xs border-b border-[#e0eded] dark:border-gray-800 last:border-0">
      <span className="text-muted dark:text-gray-400 font-semibold">{label}</span>
      <span className="font-bold text-right text-ink dark:text-gray-200">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { patient } = useAuth();
  const navigate = useNavigate();

  if (!patient) return null;

  const displayName = patient.preferred_name || patient.name || "Patient";

  const rows = [];
  if (isFilled(patient.name) && patient.name !== displayName) rows.push(["Full Name", patient.name]);
  if (isFilled(patient.age)) rows.push(["Age", `${patient.age} years`]);
  if (isFilled(patient.height)) rows.push(["Height", patient.height]);
  if (isFilled(patient.weight)) rows.push(["Weight", patient.weight]);
  if (patient.bmi) rows.push(["BMI", `${patient.bmi} (${patient.bmi_category})`]);
  if (isFilled(patient.dietary_preference)) rows.push(["Dietary Preference", patient.dietary_preference]);
  if (isFilled(patient.primary_goal)) rows.push(["Primary Goal", patient.primary_goal]);
  if (isFilled(patient.life_stage)) rows.push(["Life Stage", patient.life_stage]);
  if (isFilled(patient.medical_conditions)) rows.push(["Medical Conditions", patient.medical_conditions]);
  if (isFilled(patient.food_allergy)) rows.push(["Food Allergy / Restriction", patient.food_allergy]);
  if (isFilled(patient.medicines)) rows.push(["Current Medicines / Supplements", patient.medicines]);
  if (isFilled(patient.meals_per_day)) rows.push(["Meals per Day", patient.meals_per_day]);
  if (isFilled(patient.breakfast_habit)) rows.push(["Breakfast/Habit Timing", patient.breakfast_habit]);
  if (isFilled(patient.outside_food_frequency)) rows.push(["Outside Food Frequency", patient.outside_food_frequency]);
  if (isFilled(patient.food_budget)) rows.push(["Food Budget", patient.food_budget]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header summary card */}
        <div className="card text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1FAD9F] to-emerald-400 text-white flex items-center justify-center text-3xl font-extrabold shadow-soft mb-4">
            {displayName[0]?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold mb-1 text-ink dark:text-white">{displayName}</h2>
          <p className="text-xs text-muted dark:text-gray-400 font-semibold">Patient ID: {patient.id}</p>
        </div>

        {/* Detail Rows */}
        <div className="card">
          <h3 className="text-sm font-bold text-ink dark:text-white mb-2">Profile Details</h3>
          <p className="text-xs text-muted dark:text-gray-400 mb-6 font-semibold">
            This information comes from your clinic registration. Contact support to request modifications.
          </p>
          
          <div className="border border-[#e0eded] dark:border-gray-800 rounded-2xl px-5 py-2">
            {rows.length ? (
              rows.map(([label, value]) => <Row key={label} label={label} value={value} />)
            ) : (
              <div className="text-center text-muted py-6 text-xs font-semibold">No details on file yet.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
