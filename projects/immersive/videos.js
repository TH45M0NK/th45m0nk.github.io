/* ===========================================================
   Immersive — the videos on this page.

   ADD A VIDEO: copy one line, paste it where you want it to
   appear, and change the four values.
     id    → the part after "watch?v=" or "shorts/" in the link
     title → shown on hover and in the player
     year  → the year it was made
     type  → "h" for a normal (horizontal) video
             "v" for a vertical video / YouTube Short

   The puzzle arranges itself: two horizontal videos next to
   each other become one stacked piece, and four vertical videos
   after a single vertical one become a 2×2 piece.
   =========================================================== */

const SACRED_GEOMETRY = [
  { id: "zY9m3oyuoJs", title: "E8 Geometry — Dome of Sheikh Lotfollah Mosque", year: 2023, type: "h" },
  { id: "TDf1arRn3FA", title: "Icosahedron Gem", year: 2023, type: "h" },
  { id: "MFwMQM_6NVE", title: "Octahedron Gem", year: 2023, type: "h" },
  { id: "AHY4aLsdFvM", title: "Tesseract — Sacred Geometry Studies", year: 2024, type: "v" },
  { id: "wSPEozwhOis", title: "Hexahedron Gem", year: 2023, type: "h" },
  { id: "rkOqJ0j7ojA", title: "Projections", year: 2023, type: "h" },
  { id: "UwNQxyhrYlQ", title: "Kaleidoscopes — Octahedron Gem", year: 2024, type: "v" },
  { id: "hLwj9TxDE1c", title: "Planes", year: 2023, type: "h" },
  { id: "arT9xL65-1Q", title: "Kaleidoscopes — Hexahedron Gem", year: 2023, type: "v" },
  { id: "9m0jDOgOcyo", title: "Higher Dimensions", year: 2023, type: "h" },
  { id: "KTAlOOGl5EQ", title: "Sacred Pattern", year: 2022, type: "h" },
  { id: "ICxvJfcXzaU", title: "TH45CUBE — Transcendence of Souls", year: 2025, type: "v" },
];

const TOUCHDESIGNER_MAXMSP = [
  { id: "ve10ECj-mE0", title: "Audio Reactive Particles · TouchDesigner", year: 2026, type: "v" },
  { id: "wse_ZQOAIgo", title: "Audio Interactive Fluid — Pink Floyd, Poles Apart · TouchDesigner", year: 2025, type: "v" },
  { id: "fp0w9okN5Bg", title: "Audio Interactive Fluid — Pink Floyd, Brain Damage · TouchDesigner", year: 2025, type: "v" },
  { id: "Oy7WyQXlKRc", title: "Audio Interactive Particles — Pink Floyd, Any Colour You Like · TouchDesigner", year: 2025, type: "v" },
  { id: "RhaocASV9_Q", title: "TOOL, Forty Six & 2 — Particle Simulation · TouchDesigner", year: 2025, type: "v" },
  { id: "RCA8AeehSas", title: "Exercise 105 — RUN · Max/MSP + Cinema 4D", year: 2025, type: "v" },
  { id: "Uf3_XZqxUmk", title: "Exercise 104 — Game · Max/MSP", year: 2024, type: "v" },
  { id: "vmnsZrnNHco", title: "Exercise 103 — Matrix · Max/MSP", year: 2024, type: "v" },
  { id: "Fq2Cam_t-xk", title: "Exercise 102 — Rose · Max/MSP", year: 2024, type: "v" },
  { id: "GNavMukLMYY", title: "Exercise 101 — Disposition (cymatics) · Max/MSP", year: 2024, type: "v" },
  { id: "bxCqaf62VJ4", title: "Tesseract × Gravity — Particle Simulation · JavaScript", year: 2025, type: "v" },
];
