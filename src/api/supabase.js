// ─── Supabase Client ──────────────────────────────────────────────────────────
// Project: tcbwqarjcfluejxffyfh (Plate Correct AI)
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env. " +
    "Meal Check-In data will only be saved locally."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ─── Meal Check-In helpers ────────────────────────────────────────────────────

/**
 * Save or update a Meal Check-In record in Supabase.
 *
 * Table: meal_checkins
 * Columns match the DEFAULT_STATE structure from Builder.jsx:
 *   id            uuid (PK, default gen_random_uuid())
 *   patient_id    text
 *   patient_name  text
 *   status        text  ('draft' | 'completed')
 *   primary_goal  text
 *   target_detail text
 *   timeframe     text
 *   meals_per_day text
 *   cooks_at_home text
 *   dietary_restrictions  jsonb
 *   allergies     text
 *   foods_often   jsonb   (array of {name, frequency})
 *   portion_method text
 *   portion_notes  text
 *   breakfast     text
 *   lunch         text
 *   dinner        text
 *   snacks        text
 *   medical_conditions  text
 *   medications   text
 *   pregnant_or_nursing text
 *   consult_confirmed   boolean
 *   created_at    timestamptz (default now())
 *   updated_at    timestamptz (default now())
 *
 * Run the SQL in supabase_schema.sql in your Supabase SQL editor to create this table.
 */

/**
 * Flatten the nested Builder state into a flat Supabase row.
 */
function flattenState(state, patient, status = "draft") {
  return {
    patient_id:   patient?.id   || null,
    patient_name: patient?.name || null,
    status,

    // Goal
    primary_goal:  state.goal?.primary_goal  || null,
    target_detail: state.goal?.target_detail || null,
    timeframe:     state.goal?.timeframe     || null,

    // Food Setup
    meals_per_day:        state.food_setup?.meals_per_day || null,
    cooks_at_home:        state.food_setup?.cooks_at_home || null,
    dietary_restrictions: state.food_setup?.dietary_restrictions || [],
    allergies:            state.food_setup?.allergies || null,

    // Foods Often
    foods_often: state.foods_often?.items || [],

    // Portion
    portion_method: state.portion_method?.method || null,
    portion_notes:  state.portion_method?.notes  || null,

    // Yesterday's Meals
    breakfast: state.yesterday_meals?.breakfast || null,
    lunch:     state.yesterday_meals?.lunch     || null,
    dinner:    state.yesterday_meals?.dinner    || null,
    snacks:    state.yesterday_meals?.snacks    || null,

    // Safety
    medical_conditions:  state.safety_check?.medical_conditions  || null,
    medications:         state.safety_check?.medications         || null,
    pregnant_or_nursing: state.safety_check?.pregnant_or_nursing || null,
    consult_confirmed:   state.safety_check?.consult_confirmed   || false,

    updated_at: new Date().toISOString(),
  };
}

/**
 * Insert a new Meal Check-In row. Returns the created row (with id).
 */
export async function insertMealCheckin(state, patient, status = "draft") {
  if (!supabase) return null;
  const row = flattenState(state, patient, status);
  const { data, error } = await supabase
    .from("meal_checkins")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update an existing Meal Check-In row by Supabase row id.
 */
export async function updateMealCheckin(supabaseRowId, state, patient, status = "draft") {
  if (!supabase) return null;
  const row = flattenState(state, patient, status);
  const { data, error } = await supabase
    .from("meal_checkins")
    .update(row)
    .eq("id", supabaseRowId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
