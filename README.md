# 🎬 Movies4U — Netflix Analytics & Recommendation Engine

A data-driven analytics platform for Netflix titles. Built with **R** (data pipeline + Plumber API) and a **React/Vite** frontend. Includes ML-powered scoring, content-based recommendations, and K-Means clustering.

---

## 📦 Project Structure

```
R_project/
├── 01_clean.R              # Data cleaning
├── 02_eda_explore.R        # Exploratory analysis + plots
├── 03_model_score.R        # XGBoost scoring model
├── 04_model_recommend.R    # Content-based recommender
├── 05_model_cluster.R      # K-Means clustering
├── run_all.R               # Master pipeline runner
├── api.R                   # Plumber REST API (port 8000)
├── titles.csv              # ⚠️ Raw dataset (NOT in git — download separately)
├── data/                   # Cleaned/processed CSVs (auto-generated)
├── models/                 # Trained model files (auto-generated)
├── plots/                  # EDA plots (auto-generated)
└── UI/                     # React + Vite frontend (port 3000)
```

---

## ✅ Prerequisites

Make sure the following are installed before you begin:

| Tool | Version | Download |
|------|---------|----------|
| **R** | ≥ 4.3 | https://cran.r-project.org/ |
| **RStudio** *(recommended)* | Latest | https://posit.co/download/rstudio-desktop/ |
| **Node.js** | ≥ 18 | https://nodejs.org/ |
| **npm** | ≥ 9 (comes with Node) | — |

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Download the Project

Either **clone** or **download ZIP** from GitHub:

```bash
# Option A: Clone
git clone https://github.com/princeekr/Movies4U.git
cd Movies4U

# Option B: Download ZIP → Extract → open the folder
```

---

### Step 2 — Add the Dataset

> ⚠️ `titles.csv` is **not included** in the repo (it's too large). You must add it manually.

1. Download `titles.csv` from [Kaggle — Netflix Movies and TV Shows](https://www.kaggle.com/datasets/shivamb/netflix-shows) *(or get it from the project author)*
2. Place it in the **root** of the project folder:
   ```
   Movies4U/
   └── titles.csv   ← here
   ```

---

### Step 3 — Install R Packages

Open **RStudio** (or an R terminal), set your working directory to the project root, then run:

```r
# Install all required packages
install.packages(c(
  "dplyr", "tidyr", "readr", "stringr", "ggplot2",
  "xgboost", "Matrix", "cluster", "factoextra",
  "plumber", "jsonlite", "caret"
))
```

> ☕ This may take a few minutes the first time.

---

### Step 4 — Run the R Data Pipeline

This generates all model files, processed data, and plots inside `models/`, `data/`, and `plots/`.

**Option A — In RStudio:**
```r
setwd("path/to/Movies4U")   # set to your project root
source("run_all.R")
```

**Option B — From terminal/command prompt:**
```bash
Rscript run_all.R
```

> ✅ When it finishes you'll see: `All pipeline steps complete!`  
> This creates: `models/*.rds`, `models/xgb_score.model`, `data/genres_long.csv`, `plots/*.png`

---

### Step 5 — Start the R Plumber API

The API must be running **before** you open the frontend.

**In RStudio console** (or a separate R terminal):
```r
plumber::pr("api.R") |> plumber::pr_run(port = 8000)
```

> 🟢 API is now live at **http://localhost:8000**  
> You can test it at: http://localhost:8000/__docs__/ (Swagger UI)

---

### Step 6 — Set Up the Frontend

Open a **new terminal** (keep the API terminal running), navigate to the `UI` folder:

```bash
cd UI
```

**6a. Copy the environment file:**
```bash
# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

**6b. Install dependencies:**
```bash
npm install
```

**6c. Start the dev server:**
```bash
npm run dev
```

> 🟢 Frontend is now live at **http://localhost:3000**

---

## 🖥️ Running the Full App

You need **two terminals** open simultaneously:

| Terminal | Command | URL |
|----------|---------|-----|
| Terminal 1 (R API) | `plumber::pr("api.R") \|> plumber::pr_run(port = 8000)` | http://localhost:8000 |
| Terminal 2 (Frontend) | `cd UI && npm run dev` | http://localhost:3000 |

Then open **http://localhost:3000** in your browser. 🎉

---

## 🔑 Environment Variables (Optional)

Edit `UI/.env` if you need AI features:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
APP_URL=http://localhost:3000
```

> Get a free Gemini API key at: https://aistudio.google.com/app/apikey

---

## ⚠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| `titles.csv not found` | Add the dataset file to the project root (Step 2) |
| R package install fails | Run RStudio **as Administrator**, then retry |
| Port 8000 already in use | Change port: `pr_run(port = 8001)` and update `UI/.env` `APP_URL` |
| Port 3000 already in use | Vite will auto-pick the next port — check terminal output |
| `node_modules` missing | Run `npm install` inside the `UI/` folder |
| API not responding | Make sure the R Plumber API terminal is still running |

---

## 📊 What Each Script Does

| Script | Purpose |
|--------|---------|
| `01_clean.R` | Cleans raw `titles.csv`, handles missing values |
| `02_eda_explore.R` | Generates EDA plots saved to `plots/` |
| `03_model_score.R` | Trains XGBoost model to predict IMDb scores |
| `04_model_recommend.R` | Builds content-based similarity matrix |
| `05_model_cluster.R` | Groups titles into clusters using K-Means |
| `api.R` | Serves all results via REST API on port 8000 |
