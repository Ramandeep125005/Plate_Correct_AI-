import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Api } from "../api/client";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import ScanPlate from "../components/ScanPlate";

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-primary/5 dark:bg-[#111C16]/50 border border-emerald-100/40 dark:border-emerald-950/80 rounded-xl p-2.5 flex-1">
      <span className="text-[9px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider block mb-0.5">
        {label}
      </span>
      <div className="text-xs font-bold text-ink dark:text-white flex items-center gap-1">
        <span>{icon}</span>
        {value}
      </div>
    </div>
  );
}

function CircularGauge({ percent, color, label, icon, size = 52, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center flex-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className="text-emerald-100/40 dark:text-emerald-950/40"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base">
          {icon}
        </div>
      </div>
      <span className="text-[9px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider mt-1.5 text-center leading-tight">
        {label}
      </span>
      <span className="text-[10px] font-bold text-ink dark:text-gray-200 mt-0.5">
        {percent}%
      </span>
    </div>
  );
}

function BMIGauge({ bmi, category }) {
  // Map BMI ranges from 15 to 35 onto a 0-100 gauge scale
  const normalized = Math.max(0, Math.min(100, ((bmi - 15) / 20) * 100));
  const size = 95;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalized / 100) * circumference;

  let color = "#4E9F6D"; // leaf green
  let categoryBg = "bg-primary/10 dark:bg-primary/20 text-primary";

  if (category === "Underweight") {
    color = "#FF9F43"; // orange
    categoryBg = "bg-orange/15 dark:bg-orange/20 text-orange";
  } else if (category === "Overweight") {
    color = "#FF7E67"; // coral
    categoryBg = "bg-coral/15 dark:bg-coral/20 text-coral";
  } else if (category === "Obese") {
    color = "#E5624C"; // dark coral/red
    categoryBg = "bg-coral/20 dark:bg-coral/30 text-coral";
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className="text-emerald-100/40 dark:text-emerald-950/40"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-ink dark:text-white leading-none">{bmi}</span>
          <span className={`text-[8px] font-extrabold mt-1 uppercase tracking-wider px-1.5 py-0.5 rounded-full ${categoryBg}`}>
            {category}
          </span>
        </div>
      </div>
    </div>
  );
}

// Static database of highly customized meal recommendations
const MEAL_DATABASE = {
  thyroid_nonveg: {
    breakfast: {
      name: "Egg & Avocado Toast",
      emoji: "🍳",
      rec: "Soft-boiled eggs on sourdough toast with avocado. Rich in Selenium for thyroid support.",
      calories: "320 kcal", protein: "14g", carbs: "22g", fats: "16g",
      ingredients: ["2 large eggs", "1 slice sourdough bread", "1/2 ripe avocado", "Lemon juice", "Salt & black pepper"],
      steps: ["Toast the sourdough slice.", "Mash avocado with lemon juice, salt, and pepper, then spread on toast.", "Soft-boil the eggs for 6 minutes, peel, halve, and place on top."]
    },
    lunch: {
      name: "Grilled Salmon & Asparagus",
      emoji: "🐟",
      rec: "Pan-seared salmon with roasted sweet potato. High in Iodine and Omega-3s.",
      calories: "450 kcal", protein: "34g", carbs: "28g", fats: "20g",
      ingredients: ["150g Salmon fillet", "1 medium sweet potato", "5-6 asparagus spears", "1 tsp olive oil", "Garlic powder"],
      steps: ["Preheat oven to 200°C. Cube sweet potato and toss with olive oil and seasoning.", "Roast potato cubes and asparagus for 20 minutes.", "Pan-sear salmon in a hot skillet for 4-5 minutes per side. Serve together."]
    },
    dinner: {
      name: "Chicken & Quinoa Plate",
      emoji: "🍗",
      rec: "Grilled chicken breast, quinoa, and cooked bell peppers. Cooking veggies neutralizes goitrogens.",
      calories: "380 kcal", protein: "30g", carbs: "32g", fats: "10g",
      ingredients: ["120g Chicken breast", "1/2 cup cooked quinoa", "1/2 red bell pepper", "1/2 yellow bell pepper", "1 tbsp olive oil"],
      steps: ["Grill chicken breast in a skillet until fully cooked (7-8 minutes per side).", "Sauté chopped bell peppers in olive oil until fully tender.", "Serve grilled chicken over cooked quinoa with the sautéed peppers."]
    },
    snacks: {
      name: "Walnuts & Pumpkin Seeds",
      emoji: "🌰",
      rec: "A handful of raw pumpkin seeds and walnuts. Zinc booster to aid thyroid function.",
      calories: "160 kcal", protein: "6g", carbs: "5g", fats: "14g",
      ingredients: ["5-6 Walnut halves", "2 tbsp Raw pumpkin seeds"],
      steps: ["Combine in a small bowl.", "Enjoy as a mid-afternoon snack to maintain energy levels."]
    }
  },
  pcos_veg: {
    breakfast: {
      name: "Chia Seed Berry Pudding",
      emoji: "🍧",
      rec: "Chia seeds in almond milk with berries. Low GI to prevent insulin spikes.",
      calories: "220 kcal", protein: "6g", carbs: "18g", fats: "12g",
      ingredients: ["3 tbsp Chia seeds", "1 cup Unsweetened almond milk", "1/4 cup Fresh blueberries", "5 Almonds, chopped"],
      steps: ["Mix chia seeds and almond milk in a jar; stir well.", "Let sit in the fridge overnight.", "Top with blueberries and chopped almonds before eating."]
    },
    lunch: {
      name: "Lentil & Sautéed Tofu Plate",
      emoji: "🥗",
      rec: "Spiced brown lentils with sautéed tofu and mixed greens. Protein-dense plant plate.",
      calories: "390 kcal", protein: "24g", carbs: "38g", fats: "14g",
      ingredients: ["1/2 cup cooked brown lentils", "100g Firm tofu", "1 cup Spinach", "1/2 bell pepper", "Spices"],
      steps: ["Cube tofu and pan-fry until golden on each side.", "Add spinach and chopped bell pepper, cook until wilted.", "Combine with cooked lentils, season with turmeric, cumin, and salt."]
    },
    dinner: {
      name: "Paneer Quinoa Khichdi",
      emoji: "🍲",
      rec: "Quinoa and yellow moong dal with low-fat paneer cubes. Balanced complex carbs.",
      calories: "340 kcal", protein: "18g", carbs: "42g", fats: "9g",
      ingredients: ["1/3 cup Quinoa", "2 tbsp Yellow moong dal", "50g Low-fat paneer", "Tomato & onion", "Ginger-garlic paste"],
      steps: ["Rinse quinoa and dal together.", "Sauté onion, tomato, and ginger-garlic paste in a pressure cooker.", "Add quinoa, dal, water, and cook for 3 whistles. Stir in paneer cubes before serving."]
    },
    snacks: {
      name: "Spiced Roasted Chickpeas",
      emoji: "🍿",
      rec: "Oven-roasted chickpeas with cumin and pepper. High fiber and steady glucose release.",
      calories: "140 kcal", protein: "7g", carbs: "22g", fats: "3g",
      ingredients: ["1/2 cup Boiled chickpeas", "1/2 tsp Cumin powder", "1/4 tsp Black pepper", "Pinch of salt"],
      steps: ["Dry chickpeas with a towel.", "Toss with salt and spices.", "Roast in a dry pan or oven at 180°C until crunchy (15 mins)."]
    }
  },
  anemia_eggetarian: {
    breakfast: {
      name: "Spinach & Egg Scramble",
      emoji: "🍳",
      rec: "Eggs scrambled with spinach. Vitamin C in tomatoes aids iron absorption.",
      calories: "240 kcal", protein: "16g", carbs: "6g", fats: "16g",
      ingredients: ["2 large eggs", "1 cup Fresh baby spinach", "4 Cherry tomatoes", "1 tsp butter"],
      steps: ["Whisk eggs in a bowl with a pinch of salt.", "Sauté chopped spinach and halved cherry tomatoes in a pan with butter.", "Pour eggs over veggies and scramble gently until cooked."]
    },
    lunch: {
      name: "Chickpea & Pomegranate Salad",
      emoji: "🥗",
      rec: "Chickpeas with pomegranate seeds. High non-heme iron and vitamin C combination.",
      calories: "310 kcal", protein: "12g", carbs: "48g", fats: "5g",
      ingredients: ["1 cup Boiled chickpeas", "1/3 cup Pomegranate seeds", "1/2 cucumber, diced", "Lemon juice dressing"],
      steps: ["Combine chickpeas, pomegranate, and cucumber in a bowl.", "Toss with fresh lemon juice and a pinch of black salt.", "Serve chilled."]
    },
    dinner: {
      name: "Egg Curry & Brown Rice",
      emoji: "🍛",
      rec: "Boiled egg curry with a small portion of brown rice. High bioavailable protein.",
      calories: "410 kcal", protein: "18g", carbs: "45g", fats: "15g",
      ingredients: ["2 Hard-boiled eggs", "1/2 cup cooked brown rice", "Tomato-onion gravy", "Garlic & coriander"],
      steps: ["Prepare a basic gravy using onions, tomatoes, garlic, ginger, and turmeric.", "Prick eggs with a fork, add to the gravy, and simmer for 5 minutes.", "Serve alongside warm brown rice, topped with fresh coriander."]
    },
    snacks: {
      name: "Beetroot Carrot Juice & Almonds",
      emoji: "🍹",
      rec: "Fresh beet-carrot juice with a squeeze of lime. Natural iron and red blood cell booster.",
      calories: "130 kcal", protein: "4g", carbs: "16g", fats: "6g",
      ingredients: ["1/2 medium beetroot", "1 carrot", "Juice of 1/2 lime", "6 Almonds"],
      steps: ["Juice the beetroot and carrot together.", "Stir in lime juice (adds Vitamin C for iron absorption).", "Drink alongside a handful of almonds."]
    }
  },
  prediabetes_veg: {
    breakfast: {
      name: "Cinnamon Oats & Walnuts",
      emoji: "🥣",
      rec: "Sugar-free steel-cut oats with cinnamon. Soluble fiber helps regulate blood glucose.",
      calories: "250 kcal", protein: "8g", carbs: "36g", fats: "9g",
      ingredients: ["1/2 cup Steel-cut oats", "1 cup skimmed milk", "1/2 tsp Cinnamon powder", "4 Walnut halves"],
      steps: ["Cook oats in milk until soft.", "Stir in cinnamon powder.", "Top with chopped walnuts and serve warm."]
    },
    lunch: {
      name: "Low-Salt Palak Paneer & Roti",
      emoji: "🍛",
      rec: "Paneer cooked in spinach gravy, served with 1 multigrain roti. Low sodium load.",
      calories: "380 kcal", protein: "20g", carbs: "38g", fats: "14g",
      ingredients: ["80g Low-fat paneer", "2 cups Spinach (blanched & pureed)", "1 Multigrain roti", "Minimal spices"],
      steps: ["Cook spinach puree with garlic, green chilies, and a tiny pinch of salt.", "Add paneer cubes and simmer for 3 minutes.", "Serve hot with one fresh multigrain roti."]
    },
    dinner: {
      name: "Sprouted Moong Salad Bowl",
      emoji: "🥗",
      rec: "Steamed moong sprouts with cucumber and onion. High protein, very low GI.",
      calories: "210 kcal", protein: "14g", carbs: "32g", fats: "2g",
      ingredients: ["1 cup Moong sprouts", "1/2 cucumber, chopped", "1/2 onion, chopped", "Lime juice", "Chaat masala"],
      steps: ["Steam sprouts for 5 minutes (makes them easier to digest).", "Let cool, then mix with cucumber, onion, and lime juice.", "Dust with a pinch of chaat masala and enjoy."]
    },
    snacks: {
      name: "Apple Slices & Almond Butter",
      emoji: "🍎",
      rec: "Apple slices with raw unsalted almond butter. Balanced fat & fiber.",
      calories: "150 kcal", protein: "3g", carbs: "18g", fats: "8g",
      ingredients: ["1 small Apple", "1 tbsp Almond butter"],
      steps: ["Slice the apple.", "Serve with 1 tbsp of raw almond butter as a dip."]
    }
  },
  general_veg: {
    breakfast: {
      name: "Vegetable Oats Upma",
      emoji: "🥣",
      rec: "Oats cooked with green peas, carrots, and roasted peanuts. Fiber-rich, low GI.",
      calories: "260 kcal", protein: "8g", carbs: "38g", fats: "7g",
      ingredients: ["1/2 cup Rolled oats", "1/4 cup Mixed chopped veggies", "1 tsp mustard seeds", "1 tsp oil", "6-8 peanuts"],
      steps: ["Dry roast oats for 2-3 minutes.", "Sauté mustard seeds, curry leaves, and veggies in oil until tender.", "Add 1 cup water, bring to boil, add oats, and cook until water absorbs. Top with peanuts."]
    },
    lunch: {
      name: "Brown Rice, Dal & Cauliflower",
      emoji: "🍛",
      rec: "Brown rice with yellow moong dal and sautéed cauliflower. Balanced vegan plate.",
      calories: "410 kcal", protein: "14g", carbs: "68g", fats: "8g",
      ingredients: ["1/2 cup cooked brown rice", "1/2 cup Yellow dal", "1 cup Sautéed cauliflower & peas", "Turmeric"],
      steps: ["Prepare yellow dal with turmeric and cumin tempering.", "Sauté cauliflower florets with minimal oil.", "Serve together on a single balanced plate."]
    },
    dinner: {
      name: "Pan-Fried Tofu & Broccoli",
      emoji: "🥦",
      rec: "Firm tofu cubes pan-fried with broccoli florets in sesame oil. Light protein meal.",
      calories: "280 kcal", protein: "18g", carbs: "12g", fats: "16g",
      ingredients: ["120g Firm tofu", "1.5 cups Broccoli florets", "1 tsp sesame oil", "Soy sauce", "Garlic"],
      steps: ["Cube tofu and sauté in sesame oil with minced garlic until lightly browned.", "Add broccoli florets and splash with 1 tbsp soy sauce and 2 tbsp water.", "Cover and steam-fry for 3-4 minutes until broccoli is bright green."]
    },
    snacks: {
      name: "Turmeric Roasted Makhana",
      emoji: "🍿",
      rec: "Foxnuts dry-roasted with a pinch of turmeric and black salt. Crunchy low-calorie bite.",
      calories: "110 kcal", protein: "3g", carbs: "20g", fats: "2g",
      ingredients: ["1.5 cups Makhana (foxnuts)", "1/2 tsp Turmeric", "Pinch of black salt", "1/2 tsp Ghee"],
      steps: ["Heat ghee in a pan, add turmeric.", "Add makhana and roast on low flame until highly crispy (5-6 minutes).", "Sprinkle with black salt and serve."]
    }
  }
};

const getMealSuggestions = (patient) => {
  const conds = (patient.medical_conditions || "").toLowerCase();
  if (conds.includes("thyroid")) return MEAL_DATABASE.thyroid_nonveg;
  if (conds.includes("pcos") || conds.includes("pcod")) return MEAL_DATABASE.pcos_veg;
  if (conds.includes("anemia") || conds.includes("hemoglobin")) return MEAL_DATABASE.anemia_eggetarian;
  if (conds.includes("prediabetes") || conds.includes("diabetes") || conds.includes("hypertension")) {
    return MEAL_DATABASE.prediabetes_veg;
  }
  return MEAL_DATABASE.general_veg;
};

const DAYS = [
  { dayShort: "MON", dayLabel: "Monday" },
  { dayShort: "TUE", dayLabel: "Tuesday" },
  { dayShort: "WED", dayLabel: "Wednesday" },
  { dayShort: "THU", dayLabel: "Thursday" },
  { dayShort: "FRI", dayLabel: "Friday" },
  { dayShort: "SAT", dayLabel: "Saturday" },
  { dayShort: "SUN", dayLabel: "Sunday" },
];

// 7-day meal schedule per condition group
const WEEKLY_PLANS = {
  thyroid_nonveg: [
    // Monday
    [{ category: "Breakfast", emoji: "🍳", name: "Egg & Avocado Toast", rec: "Selenium-rich eggs on sourdough with avocado.", calories: "320", protein: "14g", carbs: "22g", fats: "16g" }, { category: "Lunch", emoji: "🐟", name: "Grilled Salmon Plate", rec: "Iodine-rich salmon with asparagus & sweet potato.", calories: "450", protein: "34g", carbs: "28g", fats: "20g" }, { category: "Dinner", emoji: "🍗", name: "Chicken Quinoa Bowl", rec: "Lean protein with cooked bell peppers & quinoa.", calories: "380", protein: "30g", carbs: "32g", fats: "10g" }, { category: "Snacks", emoji: "🌰", name: "Walnuts & Pumpkin Seeds", rec: "Zinc-rich snack to support thyroid hormone production.", calories: "160", protein: "6g", carbs: "5g", fats: "14g" }],
    // Tuesday
    [{ category: "Breakfast", emoji: "🥣", name: "Iodine Oats Bowl", rec: "Oats cooked in cow's milk with banana and flax seeds.", calories: "290", protein: "10g", carbs: "40g", fats: "9g" }, { category: "Lunch", emoji: "🍛", name: "Tuna Salad Wrap", rec: "Canned tuna in whole-wheat wrap with leafy greens.", calories: "360", protein: "28g", carbs: "30g", fats: "10g" }, { category: "Dinner", emoji: "🍲", name: "Turkey & Veggie Soup", rec: "Light turkey soup with carrots and cooked spinach.", calories: "310", protein: "24g", carbs: "20g", fats: "8g" }, { category: "Snacks", emoji: "🥚", name: "Boiled Egg & Almonds", rec: "Quick protein hit; almonds provide selenium and zinc.", calories: "170", protein: "10g", carbs: "4g", fats: "12g" }],
    // Wednesday
    [{ category: "Breakfast", emoji: "🍳", name: "Spinach Omelette", rec: "3-egg omelette with sautéed spinach and tomatoes.", calories: "280", protein: "20g", carbs: "6g", fats: "18g" }, { category: "Lunch", emoji: "🐠", name: "Mackerel Rice Bowl", rec: "Mackerel over brown rice with cucumber salad. Omega-3 boost.", calories: "430", protein: "32g", carbs: "36g", fats: "14g" }, { category: "Dinner", emoji: "🥗", name: "Grilled Chicken Salad", rec: "Grilled chicken breast over mixed greens, olive oil dressing.", calories: "340", protein: "30g", carbs: "10g", fats: "14g" }, { category: "Snacks", emoji: "🧀", name: "Cottage Cheese & Seeds", rec: "Low-fat paneer/cottage cheese with sunflower seeds.", calories: "150", protein: "12g", carbs: "5g", fats: "8g" }],
    // Thursday
    [{ category: "Breakfast", emoji: "🥞", name: "Banana Egg Pancakes", rec: "2-ingredient pancakes (banana + egg). Quick and nutritious.", calories: "220", protein: "12g", carbs: "24g", fats: "8g" }, { category: "Lunch", emoji: "🍗", name: "Lemon Herb Chicken", rec: "Baked chicken with lemon herb marinade and steamed broccoli.", calories: "410", protein: "36g", carbs: "12g", fats: "16g" }, { category: "Dinner", emoji: "🐟", name: "Baked Cod & Veggies", rec: "Baked cod fillet with zucchini and cherry tomatoes.", calories: "300", protein: "28g", carbs: "14g", fats: "10g" }, { category: "Snacks", emoji: "🥜", name: "Peanut Butter Celery", rec: "Celery sticks with natural peanut butter. Crunch & protein.", calories: "140", protein: "5g", carbs: "8g", fats: "10g" }],
    // Friday
    [{ category: "Breakfast", emoji: "🍳", name: "Egg & Feta Scramble", rec: "Scrambled eggs with crumbled feta and cherry tomatoes.", calories: "300", protein: "18g", carbs: "5g", fats: "20g" }, { category: "Lunch", emoji: "🦐", name: "Prawn & Quinoa Bowl", rec: "Stir-fried prawns over quinoa with bell peppers.", calories: "390", protein: "30g", carbs: "34g", fats: "9g" }, { category: "Dinner", emoji: "🍲", name: "Chicken Dal Soup", rec: "Shredded chicken in lentil-tomato broth. Cosy and iodine-smart.", calories: "360", protein: "28g", carbs: "28g", fats: "8g" }, { category: "Snacks", emoji: "🌰", name: "Brazil Nuts (3 pcs)", rec: "3 Brazil nuts = 100%+ daily selenium for thyroid. Don't overeat.", calories: "100", protein: "2g", carbs: "2g", fats: "10g" }],
    // Saturday
    [{ category: "Breakfast", emoji: "🥣", name: "Poha with Peanuts", rec: "Flattened rice with mustard seeds, peas and roasted peanuts.", calories: "270", protein: "8g", carbs: "42g", fats: "7g" }, { category: "Lunch", emoji: "🐟", name: "Sardines on Toast", rec: "Canned sardines (iodine powerhouse!) on multigrain toast.", calories: "370", protein: "26g", carbs: "28g", fats: "14g" }, { category: "Dinner", emoji: "🍗", name: "Stir-Fry Chicken & Kale", rec: "Sautéed chicken with kale and garlic in olive oil.", calories: "350", protein: "30g", carbs: "10g", fats: "14g" }, { category: "Snacks", emoji: "🫐", name: "Yoghurt & Blueberries", rec: "Plain Greek yoghurt with blueberries. Antioxidant boost.", calories: "140", protein: "10g", carbs: "14g", fats: "3g" }],
    // Sunday
    [{ category: "Breakfast", emoji: "🍳", name: "Mushroom & Egg Toast", rec: "Sautéed mushrooms and scrambled eggs on sourdough.", calories: "310", protein: "16g", carbs: "24g", fats: "14g" }, { category: "Lunch", emoji: "🍛", name: "Grilled Chicken Curry", rec: "Light coconut-tomato curry (cooked greens, no raw goitrogens).", calories: "420", protein: "32g", carbs: "26g", fats: "16g" }, { category: "Dinner", emoji: "🥗", name: "Tuna Nicoise Salad", rec: "Tuna, green beans, boiled egg, olives — classic thyroid-friendly.", calories: "330", protein: "28g", carbs: "12g", fats: "14g" }, { category: "Snacks", emoji: "🥒", name: "Hummus & Cucumber Sticks", rec: "Tahini hummus with cucumber. Light and selenium-aware.", calories: "120", protein: "5g", carbs: "12g", fats: "6g" }],
  ],
  pcos_veg: [
    [{ category: "Breakfast", emoji: "🍧", name: "Chia Berry Pudding", rec: "Low-GI chia pudding with almond milk and blueberries.", calories: "220", protein: "6g", carbs: "18g", fats: "12g" }, { category: "Lunch", emoji: "🥗", name: "Lentil Tofu Plate", rec: "Spiced lentils with sautéed tofu and spinach.", calories: "390", protein: "24g", carbs: "38g", fats: "14g" }, { category: "Dinner", emoji: "🍲", name: "Paneer Quinoa Khichdi", rec: "Quinoa + moong dal with paneer. Balanced insulin-friendly meal.", calories: "340", protein: "18g", carbs: "42g", fats: "9g" }, { category: "Snacks", emoji: "🍿", name: "Roasted Chickpeas", rec: "Cumin-spiced chickpeas. Fiber for steady glucose release.", calories: "140", protein: "7g", carbs: "22g", fats: "3g" }],
    [{ category: "Breakfast", emoji: "🥦", name: "Veggie Moong Chilla", rec: "Green moong protein pancakes with spinach and ginger.", calories: "240", protein: "14g", carbs: "28g", fats: "5g" }, { category: "Lunch", emoji: "🍛", name: "Rajma Brown Rice", rec: "Kidney beans in tomato curry with a small portion of brown rice.", calories: "380", protein: "18g", carbs: "52g", fats: "6g" }, { category: "Dinner", emoji: "🥗", name: "Sautéed Tofu Salad", rec: "Golden tofu with mixed greens and lemon-tahini dressing.", calories: "280", protein: "20g", carbs: "10g", fats: "16g" }, { category: "Snacks", emoji: "🥜", name: "Almonds & Walnuts", rec: "Omega-3 and magnesium combo to reduce PCOS inflammation.", calories: "160", protein: "5g", carbs: "6g", fats: "14g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Steel-Cut Oats & Seeds", rec: "Oats with chia, flax, and a handful of berries.", calories: "260", protein: "8g", carbs: "38g", fats: "8g" }, { category: "Lunch", emoji: "🥗", name: "Sprouted Chickpea Salad", rec: "Raw sprouted chickpeas, cucumber, onion, lemon dressing.", calories: "280", protein: "14g", carbs: "36g", fats: "4g" }, { category: "Dinner", emoji: "🍲", name: "Dal Palak", rec: "Yellow dal simmered with spinach and mild spices.", calories: "310", protein: "16g", carbs: "38g", fats: "6g" }, { category: "Snacks", emoji: "🍵", name: "Spearmint Tea & Almonds", rec: "Spearmint helps reduce androgens in PCOS. Paired with almonds.", calories: "80", protein: "3g", carbs: "4g", fats: "6g" }],
    [{ category: "Breakfast", emoji: "🍳", name: "Spinach Besan Chilla", rec: "Gram flour (besan) pancakes with spinach and tomato.", calories: "230", protein: "12g", carbs: "26g", fats: "6g" }, { category: "Lunch", emoji: "🍛", name: "Chole & Jeera Rice", rec: "Light chickpea gravy with a small portion of cumin rice.", calories: "400", protein: "16g", carbs: "58g", fats: "8g" }, { category: "Dinner", emoji: "🥗", name: "Tofu Stir-Fry & Cauliflower", rec: "Low-carb stir-fry with tofu, cauliflower, broccoli, soy.", calories: "260", protein: "18g", carbs: "14g", fats: "12g" }, { category: "Snacks", emoji: "🫐", name: "Greek Yoghurt & Berries", rec: "Probiotics + antioxidants. Gut-hormone connection for PCOS.", calories: "130", protein: "10g", carbs: "14g", fats: "2g" }],
    [{ category: "Breakfast", emoji: "🧆", name: "Oats Idli & Chutney", rec: "Steamed oats idlis with coconut chutney. Gut-friendly.", calories: "200", protein: "6g", carbs: "34g", fats: "4g" }, { category: "Lunch", emoji: "🍲", name: "Moth Bean Curry", rec: "Moth beans in a tangy tomato-onion gravy. High zinc.", calories: "350", protein: "18g", carbs: "44g", fats: "6g" }, { category: "Dinner", emoji: "🥗", name: "Quinoa Veggie Bowl", rec: "Quinoa with roasted zucchini, bell peppers, olive oil.", calories: "310", protein: "12g", carbs: "42g", fats: "10g" }, { category: "Snacks", emoji: "🥒", name: "Cucumber Raita", rec: "Grated cucumber in low-fat yoghurt. Cooling and probiotic.", calories: "90", protein: "5g", carbs: "8g", fats: "2g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Ragi Porridge", rec: "Finger millet porridge with banana. Calcium-rich, low GI.", calories: "240", protein: "7g", carbs: "44g", fats: "3g" }, { category: "Lunch", emoji: "🍛", name: "Lentil Soup & Multigrain Roti", rec: "Thick masoor dal with one multigrain roti.", calories: "360", protein: "18g", carbs: "50g", fats: "6g" }, { category: "Dinner", emoji: "🥗", name: "Cottage Cheese Stir-Fry", rec: "Low-fat paneer cubes with broccoli, capsicum, garlic.", calories: "290", protein: "20g", carbs: "10g", fats: "14g" }, { category: "Snacks", emoji: "🍎", name: "Apple & Peanut Butter", rec: "Low-GI apple slices with natural peanut butter.", calories: "150", protein: "4g", carbs: "18g", fats: "7g" }],
    [{ category: "Breakfast", emoji: "🍧", name: "Banana Smoothie Bowl", rec: "Blended banana + yoghurt base, topped with seeds and oats.", calories: "260", protein: "9g", carbs: "40g", fats: "6g" }, { category: "Lunch", emoji: "🍲", name: "Mixed Bean Curry", rec: "Rajma + chickpeas + black-eyed peas in spiced tomato gravy.", calories: "390", protein: "20g", carbs: "52g", fats: "7g" }, { category: "Dinner", emoji: "🥗", name: "Tofu Palak", rec: "Tofu cubes in creamy spinach gravy. Plant-protein powerhouse.", calories: "300", protein: "20g", carbs: "14g", fats: "14g" }, { category: "Snacks", emoji: "🌱", name: "Sprouts Chaat", rec: "Steamed mixed sprouts with lemon, chaat masala, coriander.", calories: "120", protein: "8g", carbs: "18g", fats: "1g" }],
  ],
  anemia_eggetarian: [
    [{ category: "Breakfast", emoji: "🍳", name: "Spinach Egg Scramble", rec: "Iron + Vitamin C combo boosts red blood cell production.", calories: "240", protein: "16g", carbs: "6g", fats: "16g" }, { category: "Lunch", emoji: "🥗", name: "Chickpea Pomegranate Salad", rec: "Non-heme iron with Vitamin C for maximum absorption.", calories: "310", protein: "12g", carbs: "48g", fats: "5g" }, { category: "Dinner", emoji: "🍛", name: "Egg Curry & Brown Rice", rec: "High bioavailable protein with complex carbs.", calories: "410", protein: "18g", carbs: "45g", fats: "15g" }, { category: "Snacks", emoji: "🍹", name: "Beet Carrot Juice & Almonds", rec: "Natural iron + Vitamin C in liquid form for fast absorption.", calories: "130", protein: "4g", carbs: "16g", fats: "6g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Ragi Porridge & Dates", rec: "Ragi is rich in iron; dates add natural iron and sweetness.", calories: "250", protein: "7g", carbs: "46g", fats: "3g" }, { category: "Lunch", emoji: "🍲", name: "Palak Dal & Egg", rec: "Spinach lentil soup with a boiled egg. Double iron source.", calories: "370", protein: "22g", carbs: "38g", fats: "10g" }, { category: "Dinner", emoji: "🥗", name: "Bean & Spinach Salad", rec: "Kidney beans + baby spinach + lemon dressing. Iron-packed.", calories: "290", protein: "14g", carbs: "42g", fats: "5g" }, { category: "Snacks", emoji: "🌰", name: "Figs & Cashews", rec: "Dried figs are one of the best plant sources of iron.", calories: "160", protein: "4g", carbs: "24g", fats: "6g" }],
    [{ category: "Breakfast", emoji: "🍳", name: "Egg & Tomato Bhurji", rec: "Scrambled eggs with tomatoes and a squeeze of lemon.", calories: "260", protein: "16g", carbs: "8g", fats: "16g" }, { category: "Lunch", emoji: "🥗", name: "Sprouted Moong Salad", rec: "Sprouted lentils with cucumber and amla (gooseberry) chutney.", calories: "220", protein: "14g", carbs: "30g", fats: "2g" }, { category: "Dinner", emoji: "🍛", name: "Methi Dal", rec: "Fenugreek leaves in yellow dal. Iron & folate powerhouse.", calories: "340", protein: "18g", carbs: "42g", fats: "6g" }, { category: "Snacks", emoji: "🍊", name: "Orange & Pumpkin Seeds", rec: "Vitamin C (orange) + iron (pumpkin seeds) = perfect absorption pair.", calories: "120", protein: "5g", carbs: "16g", fats: "5g" }],
    [{ category: "Breakfast", emoji: "🍳", name: "Masala Omelette", rec: "2-egg omelette with onion, tomato, coriander and green chilli.", calories: "240", protein: "16g", carbs: "6g", fats: "16g" }, { category: "Lunch", emoji: "🍲", name: "Rajma & Brown Rice", rec: "Kidney beans are one of the richest plant sources of iron.", calories: "400", protein: "18g", carbs: "58g", fats: "6g" }, { category: "Dinner", emoji: "🥗", name: "Beetroot Stir-Fry", rec: "Sautéed beet with onion and cumin. Folate and iron-rich.", calories: "210", protein: "6g", carbs: "34g", fats: "4g" }, { category: "Snacks", emoji: "🍌", name: "Banana & Peanut Butter", rec: "Banana provides B6 and folate; peanut butter adds iron.", calories: "170", protein: "6g", carbs: "22g", fats: "8g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Poha with Lemon & Coriander", rec: "Flattened rice with turmeric + lemon. Iron with Vitamin C.", calories: "230", protein: "6g", carbs: "40g", fats: "5g" }, { category: "Lunch", emoji: "🍳", name: "Egg Fried Brown Rice", rec: "Brown rice stir-fried with 2 eggs and colourful vegetables.", calories: "390", protein: "18g", carbs: "50g", fats: "10g" }, { category: "Dinner", emoji: "🍲", name: "Tomato & Tofu Soup", rec: "Silken tofu in tomato broth. Light but iron-containing.", calories: "200", protein: "12g", carbs: "16g", fats: "6g" }, { category: "Snacks", emoji: "🫐", name: "Kiwi & Almonds", rec: "Kiwi provides Vitamin C to boost iron from almonds.", calories: "130", protein: "4g", carbs: "16g", fats: "6g" }],
    [{ category: "Breakfast", emoji: "🍳", name: "Egg & Avocado Toast", rec: "Iron-rich eggs with healthy fats on multigrain toast.", calories: "320", protein: "14g", carbs: "24g", fats: "16g" }, { category: "Lunch", emoji: "🥗", name: "Kala Chana Salad", rec: "Black chickpeas with onion, lemon, cumin. Excellent iron source.", calories: "300", protein: "16g", carbs: "44g", fats: "4g" }, { category: "Dinner", emoji: "🍛", name: "Moringa Dal", rec: "Drumstick leaf dal (moringa = 3x iron of spinach!).", calories: "330", protein: "18g", carbs: "38g", fats: "6g" }, { category: "Snacks", emoji: "🍹", name: "Pomegranate & Walnut", rec: "Pomegranate stimulates haemoglobin production. Walnuts add iron.", calories: "140", protein: "3g", carbs: "20g", fats: "7g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Iron Oats Smoothie Bowl", rec: "Oats soaked in beetroot juice, topped with seeds and nuts.", calories: "280", protein: "9g", carbs: "42g", fats: "8g" }, { category: "Lunch", emoji: "🍛", name: "Egg & Lentil Khichdi", rec: "Protein-packed one-pot dish with a soft-boiled egg on top.", calories: "390", protein: "22g", carbs: "50g", fats: "9g" }, { category: "Dinner", emoji: "🥗", name: "Stir-Fried Amaranth Leaves", rec: "Rajgira (amaranth) leaves are one of the richest vegetable iron sources.", calories: "180", protein: "10g", carbs: "22g", fats: "4g" }, { category: "Snacks", emoji: "🌰", name: "Trail Mix (Dates, Seeds, Nuts)", rec: "Iron-dense snack pack. Perfect mid-day blood-building treat.", calories: "180", protein: "5g", carbs: "24g", fats: "9g" }],
  ],
  prediabetes_veg: [
    [{ category: "Breakfast", emoji: "🥣", name: "Cinnamon Oats & Walnuts", rec: "Soluble fiber in oats blunts blood glucose spike.", calories: "250", protein: "8g", carbs: "36g", fats: "9g" }, { category: "Lunch", emoji: "🍛", name: "Low-Salt Palak Paneer & Roti", rec: "Low-sodium spinach curry with one multigrain roti.", calories: "380", protein: "20g", carbs: "38g", fats: "14g" }, { category: "Dinner", emoji: "🥗", name: "Sprouted Moong Salad Bowl", rec: "High protein, very low GI meal for stable evening glucose.", calories: "210", protein: "14g", carbs: "32g", fats: "2g" }, { category: "Snacks", emoji: "🍎", name: "Apple & Almond Butter", rec: "Low-GI apple with healthy fat. Prevents snack-time spikes.", calories: "150", protein: "3g", carbs: "18g", fats: "8g" }],
    [{ category: "Breakfast", emoji: "🍳", name: "Besan Chilla & Mint Chutney", rec: "Gram flour pancakes are low-GI and high in protein.", calories: "220", protein: "12g", carbs: "24g", fats: "5g" }, { category: "Lunch", emoji: "🥗", name: "Jowar Roti & Mixed Veg", rec: "Sorghum roti (low-GI ancient grain) with light sabzi.", calories: "340", protein: "12g", carbs: "52g", fats: "6g" }, { category: "Dinner", emoji: "🍲", name: "Moong Dal Soup", rec: "Light soup with minimal oil. Excellent bedtime meal for BP.", calories: "240", protein: "14g", carbs: "30g", fats: "4g" }, { category: "Snacks", emoji: "🌱", name: "Sprouts & Lemon", rec: "Raw sprouts with lemon juice. Near-zero GI powerhouse.", calories: "90", protein: "7g", carbs: "12g", fats: "1g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Dalia Upma", rec: "Broken wheat upma with veggies. Fiber-rich and slow-digesting.", calories: "260", protein: "9g", carbs: "40g", fats: "6g" }, { category: "Lunch", emoji: "🍛", name: "Chole & Multigrain Roti", rec: "Chickpea curry (low GI) with one multigrain roti. Protein rich.", calories: "390", protein: "18g", carbs: "54g", fats: "8g" }, { category: "Dinner", emoji: "🥗", name: "Bitter Gourd Stir-Fry", rec: "Karela sabzi — bitter gourd is clinically proven to lower blood sugar.", calories: "160", protein: "4g", carbs: "18g", fats: "6g" }, { category: "Snacks", emoji: "🥒", name: "Cucumber & Hummus", rec: "Low-calorie, hydrating, zero-GI snack combination.", calories: "110", protein: "4g", carbs: "12g", fats: "5g" }],
    [{ category: "Breakfast", emoji: "🧆", name: "Oats & Veggie Idli", rec: "Oats-based steamed idlis — light, low-GI, gut-friendly.", calories: "200", protein: "6g", carbs: "32g", fats: "4g" }, { category: "Lunch", emoji: "🥗", name: "Brown Rice & Avial", rec: "Brown rice with South Indian mixed vegetable curry.", calories: "380", protein: "10g", carbs: "58g", fats: "10g" }, { category: "Dinner", emoji: "🍲", name: "Tomato Rasam & Steamed Veggies", rec: "Pepper rasam with steam-cooked vegetables. Anti-inflammatory.", calories: "180", protein: "6g", carbs: "24g", fats: "4g" }, { category: "Snacks", emoji: "🫐", name: "Berries & Flax Seeds", rec: "Berries are among the lowest-GI fruits. Flax adds omega-3.", calories: "100", protein: "2g", carbs: "14g", fats: "4g" }],
    [{ category: "Breakfast", emoji: "🍳", name: "Methi Paratha (No Oil)", rec: "Fenugreek flatbread baked without oil. Lowers fasting glucose.", calories: "230", protein: "8g", carbs: "36g", fats: "4g" }, { category: "Lunch", emoji: "🍛", name: "Black Bean Dal & Roti", rec: "Black beans have the lowest GI of all legumes.", calories: "360", protein: "18g", carbs: "50g", fats: "6g" }, { category: "Dinner", emoji: "🥗", name: "Sautéed Mushroom & Spinach", rec: "Light, ultra-low-carb dinner perfect for maintaining night BP.", calories: "160", protein: "8g", carbs: "12g", fats: "8g" }, { category: "Snacks", emoji: "🌰", name: "Pumpkin Seeds & Amla", rec: "Amla is clinically shown to reduce postprandial glucose.", calories: "120", protein: "5g", carbs: "10g", fats: "8g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Overnight Oats & Chia", rec: "Cold oats with chia seeds and unsweetened almond milk.", calories: "250", protein: "8g", carbs: "34g", fats: "8g" }, { category: "Lunch", emoji: "🥗", name: "Tofu & Cauliflower Rice", rec: "Cauliflower rice is low-carb replacement for diabetic-friendly lunch.", calories: "280", protein: "18g", carbs: "16g", fats: "14g" }, { category: "Dinner", emoji: "🍲", name: "Rajma Soup (No Rice)", rec: "Kidney bean broth as a hearty, low-GI, high-fiber dinner.", calories: "290", protein: "16g", carbs: "38g", fats: "4g" }, { category: "Snacks", emoji: "🫐", name: "Yoghurt & Cinnamon", rec: "Unsweetened yoghurt with cinnamon. Insulin sensitizer.", calories: "100", protein: "8g", carbs: "10g", fats: "2g" }],
    [{ category: "Breakfast", emoji: "🍳", name: "Moong Sprout Chilla", rec: "Sprout-based protein pancake. Low GI, high satiety.", calories: "220", protein: "14g", carbs: "22g", fats: "4g" }, { category: "Lunch", emoji: "🍛", name: "Lobia Dal & Barley Roti", rec: "Black-eyed peas are low GI. Barley roti is better than wheat.", calories: "370", protein: "16g", carbs: "54g", fats: "6g" }, { category: "Dinner", emoji: "🥗", name: "Palak Tofu Stir-Fry", rec: "Crispy tofu with wilted spinach and garlic. Light, high-protein.", calories: "270", protein: "18g", carbs: "10g", fats: "14g" }, { category: "Snacks", emoji: "🌿", name: "Jamun & Seeds", rec: "Jamun (Java plum) is renowned for blood sugar control in Ayurveda.", calories: "100", protein: "2g", carbs: "14g", fats: "3g" }],
  ],
  general_veg: [
    [{ category: "Breakfast", emoji: "🥣", name: "Vegetable Oats Upma", rec: "Fiber-rich oats upma with carrots, peas and peanuts.", calories: "260", protein: "8g", carbs: "38g", fats: "7g" }, { category: "Lunch", emoji: "🍛", name: "Brown Rice, Dal & Cauliflower", rec: "Balanced vegan plate with complex carbs and plant protein.", calories: "410", protein: "14g", carbs: "68g", fats: "8g" }, { category: "Dinner", emoji: "🥦", name: "Pan-Fried Tofu & Broccoli", rec: "Light sesame-soy stir-fry with crispy tofu and broccoli.", calories: "280", protein: "18g", carbs: "12g", fats: "16g" }, { category: "Snacks", emoji: "🍿", name: "Turmeric Roasted Makhana", rec: "Foxnuts roasted in ghee and turmeric. Crunchy and satiating.", calories: "110", protein: "3g", carbs: "20g", fats: "2g" }],
    [{ category: "Breakfast", emoji: "🍳", name: "Besan Moong Chilla", rec: "Protein-packed savoury pancake with coriander chutney.", calories: "230", protein: "12g", carbs: "28g", fats: "5g" }, { category: "Lunch", emoji: "🥗", name: "Quinoa Vegetable Bowl", rec: "Complete amino acid profile with rainbow vegetables.", calories: "350", protein: "14g", carbs: "50g", fats: "9g" }, { category: "Dinner", emoji: "🍲", name: "Mixed Vegetable Dal", rec: "Seasonal veggies slow-cooked in yellow dal.", calories: "300", protein: "14g", carbs: "40g", fats: "6g" }, { category: "Snacks", emoji: "🥜", name: "Peanut Chikki & Buttermilk", rec: "Natural peanut energy bar with cooling spiced buttermilk.", calories: "160", protein: "6g", carbs: "18g", fats: "8g" }],
    [{ category: "Breakfast", emoji: "🧆", name: "Rava Idli & Coconut Chutney", rec: "Light steamed semolina idlis with coconut-coriander chutney.", calories: "220", protein: "7g", carbs: "38g", fats: "5g" }, { category: "Lunch", emoji: "🍛", name: "Chole Palak & Multigrain Roti", rec: "Iron-rich spinach chickpea curry with 2 multigrain rotis.", calories: "420", protein: "18g", carbs: "58g", fats: "9g" }, { category: "Dinner", emoji: "🥗", name: "Paneer Tikka Salad", rec: "Grilled paneer with cucumber, tomato, mint-yoghurt dressing.", calories: "310", protein: "22g", carbs: "10g", fats: "18g" }, { category: "Snacks", emoji: "🫐", name: "Mixed Fruit Chaat", rec: "Seasonal fruits with chaat masala and lemon. Vitamins boost.", calories: "100", protein: "2g", carbs: "22g", fats: "0g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Banana Walnut Oatmeal", rec: "Creamy oats with banana, walnuts and a drizzle of honey.", calories: "280", protein: "8g", carbs: "44g", fats: "9g" }, { category: "Lunch", emoji: "🍲", name: "Sambar & Brown Rice", rec: "South Indian lentil and vegetable broth over brown rice.", calories: "380", protein: "14g", carbs: "62g", fats: "6g" }, { category: "Dinner", emoji: "🥗", name: "Stir-Fried Veggies & Soba", rec: "Buckwheat noodles with stir-fried vegetables and sesame.", calories: "290", protein: "10g", carbs: "48g", fats: "7g" }, { category: "Snacks", emoji: "🧀", name: "Paneer & Cucumber Sticks", rec: "Protein-rich cubed paneer with fresh cucumber sticks.", calories: "140", protein: "10g", carbs: "4g", fats: "9g" }],
    [{ category: "Breakfast", emoji: "🍵", name: "Masala Dosa (Oats Variety)", rec: "Thin oats dosa with potato-onion filling and sambar.", calories: "270", protein: "8g", carbs: "44g", fats: "6g" }, { category: "Lunch", emoji: "🍛", name: "Rajma Masala & Jeera Rice", rec: "Kidney beans in aromatic masala gravy with cumin rice.", calories: "430", protein: "18g", carbs: "66g", fats: "8g" }, { category: "Dinner", emoji: "🥦", name: "Sautéed Paneer & Bok Choy", rec: "Paneer cubes with bok choy in garlic-soy sauce. Fusion dinner.", calories: "300", protein: "22g", carbs: "10g", fats: "18g" }, { category: "Snacks", emoji: "🌰", name: "Roasted Chana Dal", rec: "Spiced roasted chana dal — classic fiber-protein tea-time snack.", calories: "120", protein: "7g", carbs: "18g", fats: "2g" }],
    [{ category: "Breakfast", emoji: "🥞", name: "Ragi Dosa & Sambar", rec: "Finger millet dosa is calcium-rich and has a low GI.", calories: "240", protein: "7g", carbs: "40g", fats: "5g" }, { category: "Lunch", emoji: "🥗", name: "Buddha Bowl", rec: "Brown rice, roasted veggies, chickpeas, tahini dressing.", calories: "390", protein: "14g", carbs: "58g", fats: "10g" }, { category: "Dinner", emoji: "🍲", name: "Lauki Chana Dal", rec: "Bottle gourd with split chickpeas — light and easy to digest.", calories: "260", protein: "12g", carbs: "36g", fats: "5g" }, { category: "Snacks", emoji: "🍎", name: "Apple Cinnamon Yoghurt", rec: "Diced apple stirred into yoghurt with a pinch of cinnamon.", calories: "120", protein: "6g", carbs: "18g", fats: "2g" }],
    [{ category: "Breakfast", emoji: "🥣", name: "Poha & Green Tea", rec: "Light flattened rice with peanuts, curry leaves, and lemon.", calories: "230", protein: "6g", carbs: "38g", fats: "6g" }, { category: "Lunch", emoji: "🍛", name: "Dal Makhani (Light) & Roti", rec: "Creamy black dal with minimal butter, served with 2 rotis.", calories: "440", protein: "18g", carbs: "60g", fats: "12g" }, { category: "Dinner", emoji: "🥗", name: "Palak Corn Salad", rec: "Baby spinach, sweet corn, cherry tomatoes, olive-lemon dressing.", calories: "200", protein: "7g", carbs: "28g", fats: "7g" }, { category: "Snacks", emoji: "🫐", name: "Blueberry & Nut Mix", rec: "Antioxidant-rich blueberries with mixed unsalted nuts.", calories: "140", protein: "4g", carbs: "14g", fats: "9g" }],
  ],
};

const getWeeklyPlan = (patient, checkin) => {
  const conds = ((patient.medical_conditions || "") + " " + (checkin?.safety_check?.medical_conditions || "")).toLowerCase();
  let planKey = "general_veg";
  if (conds.includes("thyroid")) planKey = "thyroid_nonveg";
  else if (conds.includes("pcos") || conds.includes("pcod")) planKey = "pcos_veg";
  else if (conds.includes("anemia") || conds.includes("hemoglobin")) planKey = "anemia_eggetarian";
  else if (conds.includes("prediabetes") || conds.includes("diabetes") || conds.includes("hypertension")) planKey = "prediabetes_veg";

  const restrictions = [
    ...(patient.dietary_preference ? [patient.dietary_preference] : []),
    ...(checkin?.food_setup?.dietary_restrictions || [])
  ].map(r => r.toLowerCase());

  return DAYS.map((day, idx) => {
    let dayMeals = [...WEEKLY_PLANS[planKey][idx]];

    // Adapt meals for vegetarian/vegan diets if planKey is thyroid_nonveg
    if (restrictions.some(r => r.includes("veg") && !r.includes("non")) && planKey === "thyroid_nonveg") {
      dayMeals = dayMeals.map(meal => {
        if (meal.category === "Breakfast" && meal.name.includes("Egg")) {
          return { category: "Breakfast", emoji: "🥣", name: "Ragi Porridge & Dates", rec: "Gluten-free calcium rich ragi with iron rich dates.", calories: "260", protein: "8g", carbs: "48g", fats: "4g" };
        }
        if (meal.category === "Lunch" && meal.name.includes("Salmon")) {
          return { category: "Lunch", emoji: "🍛", name: "Tofu Palak & Sweet Potato", rec: "Tofu cooked in low-salt spinach gravy. High Selenium.", calories: "390", protein: "22g", carbs: "30g", fats: "12g" };
        }
        if (meal.category === "Dinner" && meal.name.includes("Chicken")) {
          return { category: "Dinner", emoji: "🥗", name: "Paneer & Quinoa Veggie Salad", rec: "High protein paneer cubes with quinoa and cooked bell peppers.", calories: "380", protein: "18g", carbs: "26g", fats: "15g" };
        }
        return meal;
      });
    }

    return {
      ...day,
      meals: dayMeals,
    };
  });
};

const getPlanSuggestions = (patient, checkin) => {
  if (!checkin) return [];
  const suggestions = [];

  const bmiVal = parseFloat(patient.bmi) || 0;
  const goalType = checkin.goal?.primary_goal || patient.primary_goal || "";
  if (goalType.includes("lose") || goalType.includes("weight")) {
    suggestions.push({
      title: "Calorie Deficit Target",
      text: `Based on your BMI of ${patient.bmi} (${patient.bmi_category}) and weight loss goal, a daily budget of ~1400-1600 kcal is optimal to maintain a safe metabolic deficit.`
    });
  } else if (goalType.includes("muscle") || goalType.includes("gain")) {
    suggestions.push({
      title: "Daily Protein Recommendation",
      text: `To support hypertrophy and tissue preservation, aim for ${(parseFloat(patient.weight) * 1.5).toFixed(0)}g - ${(parseFloat(patient.weight) * 2.0).toFixed(0)}g protein daily based on your weight of ${patient.weight}.`
    });
  }

  const conds = ((patient.medical_conditions || "") + " " + (checkin.safety_check?.medical_conditions || "")).toLowerCase();
  if (conds.includes("pcos") || conds.includes("pcod")) {
    suggestions.push({
      title: "PCOS Insulin Sensitizing",
      text: "Focus strictly on low-GI ancient grains (jowar, bajra, ragi). Pair carbs with protein to reduce insulin spikes that exacerbate androgen levels."
    });
  }
  if (conds.includes("thyroid")) {
    suggestions.push({
      title: "Thyroid Goitrogen Control",
      text: "Avoid raw goitrogens (cauliflower, broccoli, cabbage). Cooking them is necessary to prevent interference with thyroid hormone synthesis."
    });
  }
  if (conds.includes("anemia") || conds.includes("hemoglobin")) {
    suggestions.push({
      title: "Anemia Iron Bioavailability",
      text: "Always consume non-heme iron sources (spinach, lentils) with a source of Vitamin C (lemon juice, oranges) to double iron absorption rates."
    });
  }
  if (conds.includes("diabetes") || conds.includes("prediabetes")) {
    suggestions.push({
      title: "Glycemic Index Management",
      text: "Implement the 'sequence eating' method: consume fiber/veggies first, protein second, and complex carbs last during your main meals."
    });
  }
  if (conds.includes("hypertension")) {
    suggestions.push({
      title: "DASH Diet Sodium Limit",
      text: "Keep daily sodium intake below 1500mg by avoiding processed seasonings, commercial pickles, and choosing home-cooked foods."
    });
  }

  const mealsPerDay = checkin.food_setup?.meals_per_day || patient.meals_per_day;
  suggestions.push({
    title: "Schedules & Satiety",
    text: `Your plan features exactly ${mealsPerDay} meals per day to match your check-in structure, preventing extreme hunger windows.`
  });

  const method = checkin.portion_method?.method || "hand_method";
  let explanation = "using your hands as standard scales (e.g. palm, fist, thumb)";
  if (method === "measuring_cups") explanation = "using standard kitchen cups and measuring spoons";
  if (method === "food_scale") explanation = "weighing out portions on a digital scale for maximum precision";
  suggestions.push({
    title: "Portion Method",
    text: `Ensure portion tracking is done ${explanation} as configured in your profile settings.`
  });

  return suggestions.slice(0, 4);
};

const downloadPdf = (weeklyPlan, patient, suggestions) => {
  const printWindow = window.open("", "_blank");
  const html = `
    <html>
      <head>
        <title>Plate Correct AI - Weekly Diet Plan</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #2B2320; background-color: #FFF8F1; }
          h1 { color: #FF6F5E; text-align: center; margin-bottom: 5px; }
          .logo { text-align: center; font-size: 24px; font-weight: bold; color: #1FAD9F; margin-bottom: 20px; }
          h2 { color: #1FAD9F; border-bottom: 2px solid #1FAD9F; padding-bottom: 5px; margin-top: 30px; }
          .meta { margin-bottom: 30px; font-size: 13px; color: #5c6870; text-align: center; border-bottom: 1px solid #e0eded; padding-bottom: 15px; }
          .suggestions { background: #e0f2f1; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
          .suggestions h3 { margin-top: 0; color: #00796b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .suggestions ul { padding-left: 20px; margin: 0; }
          .suggestions li { margin-bottom: 10px; font-size: 12px; line-height: 1.5; color: #004d40; }
          .day-section { margin-bottom: 35px; page-break-inside: avoid; }
          .day-title { color: #FF6F5E; border-bottom: 1px solid #FF6F5E; padding-bottom: 3px; font-size: 16px; margin-bottom: 15px; }
          .meals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .meal-card { background: white; border: 1px solid #e0eded; border-radius: 10px; padding: 12px; font-size: 11px; display: flex; flex-direction: column; justify-content: space-between; }
          .meal-cat { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #5c6870; margin-bottom: 4px; display: flex; justify-content: space-between; }
          .meal-name { font-weight: bold; color: #2B2320; font-size: 12px; margin-bottom: 6px; }
          .meal-rec { color: #5c6870; font-size: 10.5px; line-height: 1.4; flex-grow: 1; }
          .meal-footer { margin-top: 12px; padding-top: 8px; border-top: 1px solid #f3f4f6; font-weight: bold; font-size: 9.5px; color: #1FAD9F; display: flex; justify-content: space-between; }
          @media print {
            body { background-color: white; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="logo">🌿 Plate Correct AI</div>
        <h1>Personalised Weekly Diet Plan</h1>
        <div class="meta">
          <strong>Prepared For:</strong> ${patient.name} (${patient.id}) &nbsp;|&nbsp; 
          <strong>Goal:</strong> ${patient.primary_goal} &nbsp;|&nbsp; 
          <strong>Dietary Preference:</strong> ${patient.dietary_preference} &nbsp;|&nbsp; 
          <strong>Date:</strong> ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        
        <div class="suggestions">
          <h3>Your Clinical Diet Suggestions</h3>
          <ul>
            ${suggestions.map(s => `<li><strong>${s.title}:</strong> ${s.text}</li>`).join("")}
          </ul>
        </div>

        <h2>7-Day Balanced Menu</h2>
        ${weeklyPlan.map(day => `
          <div class="day-section">
            <div class="day-title">${day.dayLabel} (${day.dayShort})</div>
            <div class="meals-grid">
              ${day.meals.map(meal => `
                <div class="meal-card">
                  <div>
                    <div class="meal-cat"><span>${meal.category}</span><span>${meal.emoji}</span></div>
                    <div class="meal-name">${meal.name}</div>
                    <div class="meal-rec">${meal.rec}</div>
                  </div>
                  <div class="meal-footer">
                    <span>~${meal.calories} kcal</span>
                    <span>${meal.protein} protein</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

export default function Dashboard() {
  const { patient } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    Promise.all([Api.getDraft(), Api.getHistory()])
      .then(([d, h]) => {
        setDraft(d.draft);
        setHistory(h.assessments || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const latestCompletedAssessment = history.find(a => a.status === "completed");
  const hasCompletedAssessment = !!latestCompletedAssessment;

  const handleDelete = async (id) => {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    try {
      await Api.deleteAssessment(id);
      setHistory((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message || "Could not delete assessment");
    }
  };

  const handleStart = () => {
    localStorage.removeItem("pca_builder_draft_id");
    localStorage.removeItem("pca_builder_state");
    navigate("/builder");
  };

  const handleContinue = () => {
    if (draft) localStorage.setItem("pca_builder_draft_id", draft.id);
    navigate("/builder");
  };

  if (loading || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-muted">
        <Spinner /> Loading your dashboard...
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const mealSuggestions = getMealSuggestions(patient);

  const handleBuildPlan = () => {
    setIsGenerating(true);
    setWeeklyPlan(null);
    setTimeout(() => {
      setWeeklyPlan(getWeeklyPlan(patient, latestCompletedAssessment));
      setActiveDay(0);
      setIsGenerating(false);
    }, 1800);
  };

  const recentMeals = [];
  history.forEach((a) => {
    if (a.status === "completed" && a.yesterday_meals) {
      const dateStr = new Date(a.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (a.yesterday_meals.breakfast && a.yesterday_meals.breakfast.trim()) {
        recentMeals.push({
          id: `${a.id}-breakfast`,
          assessmentId: a.id,
          type: "Breakfast",
          name: a.yesterday_meals.breakfast,
          date: dateStr,
          emoji: "🍳"
        });
      }
      if (a.yesterday_meals.lunch && a.yesterday_meals.lunch.trim()) {
        recentMeals.push({
          id: `${a.id}-lunch`,
          assessmentId: a.id,
          type: "Lunch",
          name: a.yesterday_meals.lunch,
          date: dateStr,
          emoji: "🍛"
        });
      }
      if (a.yesterday_meals.dinner && a.yesterday_meals.dinner.trim()) {
        recentMeals.push({
          id: `${a.id}-dinner`,
          assessmentId: a.id,
          type: "Dinner",
          name: a.yesterday_meals.dinner,
          date: dateStr,
          emoji: "🍲"
        });
      }
      if (a.yesterday_meals.snacks && a.yesterday_meals.snacks.trim()) {
        recentMeals.push({
          id: `${a.id}-snacks`,
          assessmentId: a.id,
          type: "Snack",
          name: a.yesterday_meals.snacks,
          date: dateStr,
          emoji: "🍿"
        });
      }
    }
  });

  const displayMeals = recentMeals.slice(0, 3);

  return (
    <Layout>
      {/* Premium Dashboard Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50/60 via-pink-50/40 to-orange-50/30 dark:from-[#241B18]/60 dark:via-[#1C1411]/40 dark:to-orange-950/10 border border-primary/10 dark:border-primary/20 rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeInUp shadow-soft">
        {/* Subtle decorative leaf illustrations using absolute SVGs */}
        <div className="absolute right-0 top-0 bottom-0 opacity-20 pointer-events-none flex items-center">
          <svg className="w-48 h-48 text-primary/30" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 15 C20 40, 20 80, 50 85 C80 80, 80 40, 50 15 Z M50 15 C52 35, 52 75, 50 85 Z" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl shadow-md shadow-primary/20 animate-bounce" style={{ animationDuration: "3s" }}>
            🥗
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-ink dark:text-white flex items-center gap-2">
              Welcome back, <span className="text-primary">{patient.preferred_name || patient.name}</span> 👋
            </h1>
            <p className="text-xs text-muted dark:text-gray-400 font-bold mt-1.5 flex items-center gap-1.5">
              <span>📅 {todayStr}</span>
              <span className="text-primary/70">•</span>
              <span className="text-primary flex items-center gap-0.5">🌱 Personalized Wellness</span>
            </p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 self-stretch md:self-auto flex-wrap">
          <button
            onClick={handleStart}
            className="btn btn-primary bg-primary hover:bg-primary-dark font-bold text-xs py-3 px-5 shadow-md shadow-primary/25"
          >
            + Meal Check-In
          </button>
        </div>
      </div>

      {/* Draft Alert Banner */}
      {draft && (
        <div className="bg-orange/10 dark:bg-orange-950/20 border border-orange/20 dark:border-orange-900/30 rounded-2xl p-4.5 mb-6 flex justify-between items-center animate-fadeInUp">
          <div>
            <h4 className="text-sm font-bold text-coral mb-0.5">Meal Check-In in Progress</h4>
            <p className="text-xs text-muted dark:text-gray-400">
              You have an incomplete Meal Check-In saved as a draft.
            </p>
          </div>
          <button
            onClick={handleContinue}
            className="btn btn-primary bg-coral hover:bg-coral-dark shadow-sm text-xs py-2 px-4 h-fit"
          >
            Continue Check-In →
          </button>
        </div>
      )}

      {/* 6-Card Compact Profile Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Health Overview (BMI, Height, Weight) */}
        <div className="card border-t-[5px] border-t-primary flex flex-col justify-between min-h-[250px] h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-gray-400 mb-4 text-center">
              ⚖️ Health Overview
            </h3>
            <div className="flex justify-center my-1">
              <BMIGauge bmi={patient.bmi} category={patient.bmi_category} />
            </div>
          </div>
          <div className="flex gap-2.5 mt-2">
            <StatCard label="Height" value={patient.height} icon="📏" />
            <StatCard label="Weight" value={patient.weight} icon="⚖️" />
          </div>
        </div>

        {/* Card 2: Lifestyle Vitals (Radial gauges for Activity, Sleep, Stress) */}
        <div className="card border-t-[5px] border-t-secondary flex flex-col justify-between min-h-[250px] h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-gray-400 mb-4 text-center">
              🏃 Lifestyle Vitals
            </h3>
            <div className="flex justify-around items-start gap-1 py-1">
              <CircularGauge
                percent={patient.activity_percent}
                color="#1FAD9F"
                label="Activity"
                icon="🏃"
              />
              <CircularGauge
                percent={patient.sleep_percent}
                color="#3b82f6"
                label="Sleep"
                icon="😴"
              />
              <CircularGauge
                percent={patient.stress_percent}
                color="#FF6F5E"
                label="Stress"
                icon="🧘"
              />
            </div>
          </div>
          <div className="border-t border-primary/10 dark:border-primary/20 pt-3 mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-muted dark:text-gray-400">Activity Level</span>
              <span className="text-ink dark:text-gray-200 truncate max-w-[110px]" title={patient.activity_level}>{patient.activity_level}</span>
            </div>
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-muted dark:text-gray-400">Sleep Pattern</span>
              <span className="text-ink dark:text-gray-200 truncate max-w-[110px]" title={patient.sleep_pattern}>{patient.sleep_pattern}</span>
            </div>
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-muted dark:text-gray-400">Stress Level</span>
              <span className="text-danger truncate max-w-[110px]" title={patient.stress_level}>{patient.stress_level}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Primary Goal */}
        <div className="card border-t-[5px] border-t-orange flex flex-col justify-between min-h-[250px] h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-gray-400 mb-4 flex items-center gap-1.5">
              🎯 Primary Goal
            </h3>
            <div className="text-base font-bold text-ink dark:text-white mb-2 leading-snug">
              {patient.primary_goal}
            </div>
            <p className="text-xs text-muted dark:text-gray-400 font-semibold leading-relaxed">
              Your target health outcome for using Plate Correct AI.
            </p>
          </div>
          <div className="border-t border-primary/10 dark:border-primary/20 pt-3 mt-4">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-0.5">Focus Area</span>
            <span className="text-xs font-bold text-ink dark:text-gray-200 block">Personalized Nutrition</span>
          </div>
        </div>

        {/* Card 4: Dietary Preference */}
        <div className="card border-t-[5px] border-t-primary flex flex-col justify-between min-h-[250px] h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-gray-400 mb-4 flex items-center gap-1.5">
              🥗 Dietary Preference
            </h3>
            <div className="text-base font-bold text-ink dark:text-white mb-2 leading-snug">
              {patient.dietary_preference}
            </div>
            <p className="text-xs text-muted dark:text-gray-400 font-semibold leading-relaxed">
              Base diet type used to filter ingredient recommendations.
            </p>
          </div>
          <div className="border-t border-primary/10 dark:border-primary/20 pt-3 mt-4">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-0.5">Budget Class</span>
            <span className="text-xs font-bold text-ink dark:text-gray-200 block">{patient.food_budget}</span>
          </div>
        </div>

        {/* Card 5: Life Stage */}
        <div className="card border-t-[5px] border-t-secondary flex flex-col justify-between min-h-[250px] h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-gray-400 mb-4 flex items-center gap-1.5">
              🌱 Life Stage
            </h3>
            <div className="text-base font-bold text-ink dark:text-white mb-2 leading-snug">
              {patient.life_stage}
            </div>
            <p className="text-xs text-muted dark:text-gray-400 font-semibold leading-relaxed">
              Clinical category based on age and reproductive markers.
            </p>
          </div>
          <div className="border-t border-primary/10 dark:border-primary/20 pt-3 mt-4">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-0.5">Patient Age</span>
            <span className="text-xs font-bold text-ink dark:text-gray-200 block">{patient.age} years</span>
          </div>
        </div>

        {/* Card 6: Medical Summary */}
        <div className="card border-t-[5px] border-t-orange flex flex-col justify-between min-h-[250px] h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-gray-400 mb-4 flex items-center gap-1.5">
              🏥 Medical Summary
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider block mb-1">Diagnoses</span>
                <span className="inline-block bg-yellow-50 dark:bg-yellow-950/20 text-[#E8A33D] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-yellow-100 dark:border-yellow-900/30 truncate max-w-full" title={patient.medical_conditions}>
                  {patient.medical_conditions}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider block mb-1">Medications / Supplements</span>
                <span className="inline-block bg-red-50 dark:bg-red-950/20 text-danger text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-900/30 truncate max-w-full" title={patient.medicines}>
                  {patient.medicines}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Meal Suggestions Section */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
          🥑 Today's Meal Suggestions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Object.entries(mealSuggestions).map(([category, meal]) => (
            <div
              key={category}
              className="bg-gradient-to-b from-white to-cream dark:from-[#241B18] dark:to-[#1C1411] rounded-2xl border border-primary/10 dark:border-primary/20 p-5 flex flex-col justify-between hover:border-secondary dark:hover:border-primary hover:-translate-y-1 transition-all duration-300 shadow-card dark:shadow-none"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted dark:text-gray-400">
                    {category}
                  </span>
                  <span className="text-xl">{meal.emoji}</span>
                </div>
                <h4 className="text-sm font-bold text-ink dark:text-white mb-1.5 leading-snug">
                  {meal.name}
                </h4>
                <p className="text-[11px] text-muted dark:text-gray-400 leading-relaxed font-semibold">
                  {meal.rec}
                </p>
              </div>
              <button
                onClick={() => setSelectedMeal(meal)}
                className="text-[11px] font-bold text-secondary hover:text-secondary-dark mt-4 flex items-center gap-1 self-start transition-all hover:translate-x-0.5"
              >
                View Recipe &amp; Macros →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scan Plate Section */}
      <div id="scan-plate" className="mb-8">
        <ScanPlate patient={patient} />
      </div>

      {/* Weekly Diet Plan Section */}
      <div id="weekly-diet-plan" className="mb-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
              📅 Weekly Diet Plan
            </h2>
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-secondary/15 to-coral/10 border border-secondary/25 text-secondary px-2.5 py-1 rounded-full">
              ✦ AI‑Powered
            </span>
          </div>
          {hasCompletedAssessment && (
            <div className="flex gap-2">
              {weeklyPlan && !isGenerating && (
                <button
                  onClick={() => downloadPdf(weeklyPlan, patient, getPlanSuggestions(patient, latestCompletedAssessment))}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all duration-200"
                >
                  📥 Download PDF
                </button>
              )}
              <button
                onClick={handleBuildPlan}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary to-primary hover:from-secondary-dark hover:to-primary-dark text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-secondary/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed self-start sm:self-auto"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Generating…
                  </>
                ) : weeklyPlan ? "🔄 Regenerate Plan" : "✦ Build My Plan"}
              </button>
            </div>
          )}
        </div>

        {/* Not Checked-In State */}
        {!hasCompletedAssessment && (
          <div className="bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 dark:from-amber-950/10 dark:via-[#241B18] dark:to-[#1C1411] border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-soft">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-primary flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10">
              📝
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-white mb-1">Meal Check-In Required</h3>
              <p className="text-xs text-muted dark:text-gray-400 font-semibold max-w-md leading-relaxed">
                To build your weekly diet plan, we first need to analyze your eating habits, portion methods, and medical parameters. Please complete your first <strong>Meal Check-In</strong>.
              </p>
            </div>
            <button
              onClick={handleStart}
              className="btn btn-primary px-6 py-2.5 text-xs font-bold shadow-md shadow-primary/25"
            >
              📝 Start Meal Check-In
            </button>
          </div>
        )}

        {/* Empty State */}
        {hasCompletedAssessment && !isGenerating && !weeklyPlan && (
          <div className="bg-gradient-to-br from-secondary/5 via-white to-coral/5 dark:from-secondary/10 dark:via-[#241B18] dark:to-[#1C1411]/80 border border-secondary/20 dark:border-secondary/15 rounded-2xl p-10 flex flex-col items-center text-center gap-4 shadow-soft">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-2xl shadow-lg shadow-secondary/15">
              🗓️
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-white mb-1">No Plan Yet</h3>
              <p className="text-xs text-muted dark:text-gray-400 font-semibold max-w-xs leading-relaxed">
                Click <strong className="text-secondary">Build My Plan</strong> to generate a personalised 7-day meal schedule tailored to your medical profile, dietary preference, and health goal.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {["🩺 Condition-aware", "🥗 Diet-matched", "🎯 Goal-aligned", "⚡ Macro-balanced"].map(tag => (
                <span key={tag} className="text-[10px] font-bold text-muted dark:text-gray-400 bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full border border-primary/10 dark:border-primary/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shimmer Loading */}
        {hasCompletedAssessment && isGenerating && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="animate-pulse h-9 w-16 rounded-xl bg-primary/10 dark:bg-primary/20 flex-shrink-0" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse bg-primary/5 dark:bg-[#1E1512]/50 rounded-2xl p-5 space-y-3">
                  <div className="h-3 bg-primary/20 dark:bg-gray-800 rounded w-1/3" />
                  <div className="h-4 bg-primary/20 dark:bg-gray-800 rounded w-2/3" />
                  <div className="h-3 bg-primary/20 dark:bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-primary/20 dark:bg-gray-800 rounded w-4/5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Display */}
        {hasCompletedAssessment && weeklyPlan && !isGenerating && (
          <div>
            {/* Diet Plan Suggestions & Analysis (Dynamic Suggestions based on Check-in parameters) */}
            <div className="mb-6 p-5 bg-gradient-to-br from-teal-50/50 via-white to-secondary/5 dark:from-[#1A2621]/80 dark:via-[#201714] dark:to-[#1C1411] border border-secondary/25 dark:border-secondary/20 rounded-2xl shadow-soft">
              <h3 className="text-xs font-extrabold text-secondary dark:text-[#F4978E] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                💡 Diet Plan Suggestions &amp; Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getPlanSuggestions(patient, latestCompletedAssessment).map((s, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start p-3 bg-white/70 dark:bg-[#241B18]/70 border border-primary/5 dark:border-primary/10 rounded-xl">
                    <span className="text-base flex-shrink-0 mt-0.5">🌟</span>
                    <div>
                      <span className="block text-[11px] font-bold text-ink dark:text-gray-200 mb-0.5">{s.title}</span>
                      <span className="block text-[10px] text-muted dark:text-gray-400 leading-relaxed font-semibold">{s.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-thin">
              {weeklyPlan.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    activeDay === idx
                      ? "bg-secondary text-white shadow-md shadow-secondary/25"
                      : "bg-white dark:bg-[#241B18] border border-primary/10 dark:border-primary/20 text-muted dark:text-gray-400 hover:border-secondary hover:text-secondary"
                  }`}
                >
                  <span className="block text-[9px] uppercase tracking-wider opacity-70">{day.dayShort}</span>
                  <span>{day.dayLabel}</span>
                </button>
              ))}
            </div>

            {/* Day Meals Grid */}
            {weeklyPlan[activeDay] && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {weeklyPlan[activeDay].meals.map((meal, mIdx) => (
                  <div
                    key={mIdx}
                    className="bg-gradient-to-b from-white to-cream dark:from-[#241B18] dark:to-[#1C1411] rounded-2xl border border-primary/10 dark:border-primary/20 p-5 flex flex-col justify-between hover:border-secondary dark:hover:border-secondary/60 hover:-translate-y-0.5 transition-all duration-300 shadow-card dark:shadow-none group"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted dark:text-gray-400">
                          {meal.category}
                        </span>
                        <span className="text-xl">{meal.emoji}</span>
                      </div>
                      <h4 className="text-sm font-bold text-ink dark:text-white mb-1.5 leading-snug">
                        {meal.name}
                      </h4>
                      <p className="text-[11px] text-muted dark:text-gray-400 leading-relaxed font-semibold">
                        {meal.rec}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-primary/10 dark:border-primary/20 flex justify-between text-[10px] font-bold">
                      <span className="text-muted dark:text-gray-500">~{meal.calories} kcal</span>
                      <span className="text-secondary">{meal.protein}g protein</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Daily Totals Bar */}
            {weeklyPlan[activeDay] && (() => {
              const day = weeklyPlan[activeDay];
              const totalCal = day.meals.reduce((sum, m) => sum + parseInt(m.calories), 0);
              const totalProt = day.meals.reduce((sum, m) => sum + parseInt(m.protein), 0);
              const totalCarbs = day.meals.reduce((sum, m) => sum + parseInt(m.carbs || 0), 0);
              const totalFats = day.meals.reduce((sum, m) => sum + parseInt(m.fats || 0), 0);
              return (
                <div className="mt-4 bg-gradient-to-r from-secondary/10 to-primary/5 dark:from-secondary/15 dark:to-primary/20 border border-secondary/20 dark:border-secondary/15 rounded-xl px-5 py-3 flex flex-wrap gap-5 items-center">
                  <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">
                    {day.dayLabel} Totals
                  </span>
                  <div className="flex flex-wrap gap-5 ml-auto">
                    {[
                      { label: "Calories", val: `${totalCal} kcal`, color: "text-ink dark:text-white" },
                      { label: "Protein", val: `${totalProt}g`, color: "text-secondary" },
                      { label: "Carbs", val: `${totalCarbs}g`, color: "text-coral" },
                      { label: "Fats", val: `${totalFats}g`, color: "text-warning" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="text-center">
                        <span className="block text-[9px] text-muted dark:text-gray-400 uppercase tracking-wider">{label}</span>
                        <span className={`text-xs font-extrabold ${color}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Main Features: Eating Habits & Previous Assessments Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eating Habits */}
        <div className="card flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-gray-400 mb-6 flex items-center gap-2">
              ⏰ Eating Habits
            </h3>

            <div className="space-y-5">
              {/* Meals per Day progress slider */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-muted dark:text-gray-400">Meals per Day</span>
                  <span className="text-secondary">{patient.meals_per_day} meals</span>
                </div>
                <div className="h-2 bg-secondary/15 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                    style={{ width: `${(parseFloat(patient.meals_per_day) / 6) * 100}%` }}
                  />
                </div>
              </div>

              {/* Outside Food */}
              <div className="flex justify-between items-center p-3 bg-secondary/5 dark:bg-gray-900/30 rounded-xl border border-primary/10 dark:border-primary/20">
                <span className="text-xs font-bold text-muted dark:text-gray-400 flex items-center gap-1.5">
                  🍔 Outside Food
                </span>
                <span className="text-xs font-bold text-ink dark:text-gray-200">
                  {patient.outside_food_frequency}
                </span>
              </div>

              {/* Tea & Coffee Timing Habit */}
              <div className="flex justify-between items-center p-3 bg-secondary/5 dark:bg-[#1E1512]/50 rounded-xl border border-primary/10 dark:border-primary/20">
                <span className="text-xs font-bold text-muted dark:text-gray-400 flex items-center gap-1.5">
                  ☕ Tea &amp; Coffee Habit
                </span>
                <span className="text-xs font-bold text-ink dark:text-gray-200 text-right max-w-[200px] truncate" title={patient.breakfast_habit}>
                  {patient.breakfast_habit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Meal History / Recent Meals Card */}
        <div id="meal-history" className="card flex flex-col justify-between h-full">
          <div>
            <h2 className="text-base font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
              🍲 Meal History
            </h2>
            {displayMeals.length === 0 ? (
              <div className="text-center text-muted dark:text-gray-400 py-8 text-xs font-semibold">
                No logged meals yet. Start a Meal Check-In to log your meals! 🍽️
              </div>
            ) : (
              <div className="space-y-3">
                {displayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between bg-white/50 dark:bg-[#1E1512]/50 border border-primary/10 dark:border-primary/20 rounded-xl px-4 py-3 hover:border-primary dark:hover:border-primary transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meal.emoji}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-ink dark:text-white">
                            {meal.type}
                          </span>
                          <span className="text-[10px] text-muted dark:text-gray-500">• {meal.date}</span>
                        </div>
                        <p className="text-[11px] text-muted dark:text-gray-400 font-semibold truncate max-w-[180px]" title={meal.name}>
                          {meal.name}
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary border-primary/25 hover:border-primary text-[10px] py-1.5 px-3 rounded-lg font-bold"
                      onClick={() => navigate(`/summary/${meal.assessmentId}`)}
                      title="View Details"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Overlay for Meal Details */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-ink/50 dark:bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeInUp">
          <div className="bg-white dark:bg-[#151821] border border-[#e0eded] dark:border-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#1FAD9F] text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="text-lg">{selectedMeal.emoji}</span> {selectedMeal.name}
              </h3>
              <button
                onClick={() => setSelectedMeal(null)}
                className="text-white hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
              {/* Macros */}
              <div>
                <span className="text-[10px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider block mb-2">Nutritional Values</span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-[#ebf5f6]/50 dark:bg-gray-900/50 p-2 rounded-xl border border-[#e0eded]/50 dark:border-gray-800">
                    <span className="block text-[9px] text-muted dark:text-gray-400 font-semibold mb-0.5">Calories</span>
                    <span className="font-bold text-ink dark:text-white text-xs">{selectedMeal.calories}</span>
                  </div>
                  <div className="bg-[#ebf5f6]/50 dark:bg-gray-900/50 p-2 rounded-xl border border-[#e0eded]/50 dark:border-gray-800">
                    <span className="block text-[9px] text-muted dark:text-gray-400 font-semibold mb-0.5">Protein</span>
                    <span className="font-bold text-[#1FAD9F] text-xs">{selectedMeal.protein}</span>
                  </div>
                  <div className="bg-[#ebf5f6]/50 dark:bg-gray-900/50 p-2 rounded-xl border border-[#e0eded]/50 dark:border-gray-800">
                    <span className="block text-[9px] text-muted dark:text-gray-400 font-semibold mb-0.5">Carbs</span>
                    <span className="font-bold text-[#FF6F5E] text-xs">{selectedMeal.carbs}</span>
                  </div>
                  <div className="bg-[#ebf5f6]/50 dark:bg-gray-900/50 p-2 rounded-xl border border-[#e0eded]/50 dark:border-gray-800">
                    <span className="block text-[9px] text-muted dark:text-gray-400 font-semibold mb-0.5">Fats</span>
                    <span className="font-bold text-[#E8A33D] text-xs">{selectedMeal.fats}</span>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <span className="text-[10px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider block mb-2">Ingredients</span>
                <ul className="list-disc pl-4 space-y-1 text-muted dark:text-gray-300 font-semibold">
                  {selectedMeal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <span className="text-[10px] font-bold text-muted dark:text-gray-400 uppercase tracking-wider block mb-2">Preparation Steps</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-muted dark:text-gray-300 font-semibold">
                  {selectedMeal.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border-t border-[#e0eded] dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setSelectedMeal(null)}
                className="btn btn-primary py-1.5 px-5 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

