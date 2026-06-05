# TalentVerse — Frontend-Only React App (JavaScript)

A creative talent platform built with **React + Vite + TailwindCSS v4**.
**No TypeScript. No backend. No database.**

## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 (JSX) | UI components |
| Vite 6 | Dev server & bundler |
| TailwindCSS v4 | Styling via `@tailwindcss/vite` |
| React Router v7 | Client-side routing (HashRouter) |
| Framer Motion (`motion/react`) | Page & element animations |
| Recharts | Analytics chart on Dashboard |
| Lucide React | Icons |

## Project Structure

```
src/
├── main.jsx                    # App entry point
├── App.jsx                     # Root router + auth state
├── index.css                   # TailwindCSS v4 theme
├── data/
│   └── mockData.js             # All mock data (jobs, companies, collabs, etc.)
├── components/
│   ├── Logo.jsx
│   ├── Navbar.jsx
│   └── Sidebar.jsx
└── pages/
    ├── LandingPage.jsx
    ├── AuthPage.jsx
    ├── Dashboard.jsx
    ├── JobsPage.jsx
    ├── CollaborationsPage.jsx
    ├── CompanyProfile.jsx
    └── PortfolioUpload.jsx
```

## Data & State Strategy

| Concern | Solution |
|---|---|
| Database | Mock JSON objects in `src/data/mockData.js` |
| User session | `localStorage` (`talentverse_user` key) |
| Filters / search | `useState` local state in each page |
| Upload flow | `useState` state machine (`idle → uploading → verifying → complete`) |

## Getting Started

```bash
npm install
npm run dev       # → http://localhost:3000
npm run build     # → /dist  (deploy anywhere)
npm run preview   # Preview production build locally
```

## Mock Auth

Click **Sign In** with any email/password — the form creates a mock session stored in `localStorage`.
No real authentication or server calls are made.
