# Plate Correct AI — React + Vite + Tailwind

This is your app rebuilt to match your existing project structure exactly:
`src/assets`, `src/components`, `src/pages`, `App.jsx`, `main.jsx`, `index.css`, `tailwind.config.js`.

It's a **from-scratch scaffold I built and verified compiles cleanly** (`npm run build` succeeds, zero errors). Merge it into your existing `Plate_correct_ai` project using the steps below — you don't need to redo your setup, just drop these files in.

---

## Step 1 — Install the extra packages your project needs

Open a terminal in your existing project folder (`Plate_correct_ai`) and run:

```bash
npm install react-router-dom lucide-react
```

(You already have Tailwind + PostCSS set up per your screenshot, so no changes needed there.)

---

## Step 2 — Replace/add these files

Copy each file from this package into the matching path in your project, **overwriting** where a file already exists:

| From this package | Goes to (in your project) |
|---|---|
| `tailwind.config.js` | `Plate_correct_ai/tailwind.config.js` |
| `src/index.css` | `Plate_correct_ai/src/index.css` |
| `src/App.jsx` | `Plate_correct_ai/src/App.jsx` |
| `src/main.jsx` | `Plate_correct_ai/src/main.jsx` |
| `src/api/client.js` | `Plate_correct_ai/src/api/client.js` (new folder) |
| `src/context/AuthContext.jsx` | `Plate_correct_ai/src/context/AuthContext.jsx` (new folder) |
| `src/components/*.jsx` | `Plate_correct_ai/src/components/` (alongside your existing `index.js`) |
| `src/pages/Login.jsx` | `Plate_correct_ai/src/pages/Login.jsx` |
| `src/pages/Dashboard.jsx` | `Plate_correct_ai/src/pages/Dashboard.jsx` |
| `src/pages/Builder.jsx` | `Plate_correct_ai/src/pages/Builder.jsx` |
| `src/pages/Summary.jsx` | `Plate_correct_ai/src/pages/Summary.jsx` |
| `src/pages/Profile.jsx` | `Plate_correct_ai/src/pages/Profile.jsx` |

You can delete your current `src/pages/Home.jsx` and `src/App.css` — they're replaced by the pages above and by Tailwind utility classes (no separate CSS file needed anymore).

---

## Step 3 — Point the app at your FastAPI backend

Open `src/api/client.js` and check the top line:

```js
const API_BASE_URL = "http://localhost:8000";
```

Change this if your backend runs somewhere else.

---

## Step 4 — Run it

```bash
npm run dev
```

Visit the printed localhost URL. You should land on `/login` → log in with a Patient ID + Name that matches a row in your Google Sheet → `/dashboard`.

Make sure your FastAPI backend (from earlier) is running on port 8000 at the same time, with `credentials.json` and `.env` configured as described in its README.

---

## What changed structurally vs. the vanilla version

- **Routing**: `react-router-dom` replaces manual `window.location.href` redirects. Routes: `/login`, `/dashboard`, `/builder`, `/summary/:id`, `/profile`.
- **Auth state**: `AuthContext` (`src/context/AuthContext.jsx`) replaces `auth-guard.js` — call `useAuth()` anywhere to get `{ patient, login, logout, isAuthenticated }`.
- **API calls**: `src/api/client.js` is a 1:1 port of the old `api.js`, same endpoints, same shape.
- **Styling**: moved from hand-written CSS to Tailwind utility classes + a few reusable classes in `index.css` (`.btn`, `.card`, `.chip`, `.field-input`, etc.) so you can restyle quickly by editing `tailwind.config.js` instead of hunting through CSS files.

---

## New theme

I swapped the single-accent peach/coral look for a warm-coral + cool-teal pairing on a cream background — a combination that reads as clean and clinical (trustworthy for a health app) while staying warm and approachable:

| Role | Color | Hex |
|---|---|---|
| Primary (buttons, active states) | Coral | `#FF6F5E` |
| Secondary (available for tags/links) | Teal | `#1FAD9F` |
| Background | Cream | `#FFF8F1` |
| Text | Charcoal-brown | `#2B2320` |
| Success / Warning / Danger | Green / Amber / Red | `#22A06B` / `#E8A33D` / `#E4574C` |

All defined in `tailwind.config.js` under `theme.extend.colors` — change any hex there and it updates everywhere (buttons, chips, badges, gradients all reference the same tokens).
