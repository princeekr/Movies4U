// api.ts — Centralized API service for R Plumber backend
const API_BASE = "/api";

// ── Helper ───────────────────────────────────────────────────────────────────
async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ── Stats endpoint ───────────────────────────────────────────────────────────

export interface StatsData {
  total_titles: number[];
  movies: number[];
  shows: number[];
  countries: number[];
  genres: number[];
}

export async function fetchStats() {
  const data = await fetchJSON<StatsData>(`/stats`);
  // Plumber wraps scalars in arrays
  const unwrap = (v: number | number[]) => (Array.isArray(v) ? v[0] : v);
  return {
    totalTitles: unwrap(data.total_titles),
    movies: unwrap(data.movies),
    shows: unwrap(data.shows),
    countries: unwrap(data.countries),
    genres: unwrap(data.genres),
  };
}

// ── EDA endpoints ────────────────────────────────────────────────────────────

export async function fetchContentOverTime(type: string = "ALL") {
  const data = await fetchJSON<{ release_year: number[]; n: number[] }>(
    `/content_over_time?type=${type}`
  );
  // The API returns { release_year: [...], n: [...] } for a single type,
  // but Dashboard expects { year, movies, shows }[].
  // We'll fetch ALL and split client‑side, OR fetch MOVIE + SHOW separately.
  return data;
}

export async function fetchContentOverTimeCombined() {
  const [moviesRaw, showsRaw] = await Promise.all([
    fetchJSON<{ release_year: number[]; n: number[] }>(`/content_over_time?type=MOVIE`),
    fetchJSON<{ release_year: number[]; n: number[] }>(`/content_over_time?type=SHOW`),
  ]);

  // Build a year → { movies, shows } map
  const yearMap: Record<number, { movies: number; shows: number }> = {};

  moviesRaw.release_year.forEach((yr, i) => {
    if (!yearMap[yr]) yearMap[yr] = { movies: 0, shows: 0 };
    yearMap[yr].movies = moviesRaw.n[i];
  });
  showsRaw.release_year.forEach((yr, i) => {
    if (!yearMap[yr]) yearMap[yr] = { movies: 0, shows: 0 };
    yearMap[yr].shows = showsRaw.n[i];
  });

  return Object.entries(yearMap)
    .map(([year, counts]) => ({ year: Number(year), ...counts }))
    .sort((a, b) => a.year - b.year);
}

export async function fetchGenrePopularity(n: number = 15) {
  const rows = await fetchJSON<Array<{ genre: string; count: number; avg_imdb_score: number }>>(
    `/genre_popularity?n=${n}`
  );
  return rows.map((r) => ({
    genre: r.genre,
    count: r.count,
    avgScore: Math.round(r.avg_imdb_score * 10) / 10,
  }));
}

export async function fetchCountryProduction() {
  const rows = await fetchJSON<Array<{ primary_country: string; n: number }>>(
    `/country_production`
  );
  return rows.map((r) => ({ country: r.primary_country, count: r.n }));
}

export async function fetchScoreDistribution() {
  const rows = await fetchJSON<Array<{ score_rounded: number; show_type: string; n: number }>>(
    `/score_distribution`
  );
  // Pivot: group by score_rounded, split n into movies / shows
  const map: Record<string, { range: string; movies: number; shows: number }> = {};
  rows.forEach((r) => {
    const key = String(r.score_rounded);
    if (!map[key]) map[key] = { range: key, movies: 0, shows: 0 };
    if (r.show_type === "MOVIE") map[key].movies = r.n;
    else map[key].shows = r.n;
  });
  return Object.values(map).sort(
    (a, b) => parseFloat(a.range) - parseFloat(b.range)
  );
}

export async function fetchAgeCertification() {
  const rows = await fetchJSON<
    Array<{ age_certification: string; count: number; avg_imdb_score: number }>
  >(`/age_certification`);
  return rows.map((r) => ({
    cert: r.age_certification || "N/A",
    count: r.count,
    avgScore: Math.round(r.avg_imdb_score * 10) / 10,
  }));
}

// ── Prediction endpoint ──────────────────────────────────────────────────────

export interface PredictParams {
  genre: string;
  runtime: number;
  year: number;
  show_type: string;
  age_cert: string;
  country: string;
  seasons?: number;
  votes?: number;
  popularity?: number;
}

export async function predictScore(p: PredictParams): Promise<number> {
  const qs = new URLSearchParams({
    genre: p.genre,
    runtime: String(p.runtime),
    year: String(p.year),
    show_type: p.show_type,
    age_cert: p.age_cert,
    country: p.country,
    seasons: String(p.seasons ?? 0),
    votes: String(p.votes ?? 1000),
    popularity: String(p.popularity ?? 10),
  });
  const data = await fetchJSON<{ predicted_score: number[] }>(`/predict_score?${qs}`);
  // Plumber wraps scalars in arrays
  const score = Array.isArray(data.predicted_score)
    ? data.predicted_score[0]
    : data.predicted_score;
  return score;
}

// ── Titles endpoint ──────────────────────────────────────────────────────────

export interface TitleRecord {
  id: string;
  title: string;
  show_type: string;
  primary_genre: string;
  imdb_score: number;
  release_year: number;
  age_certification: string | null;
}

export async function fetchTitles(): Promise<TitleRecord[]> {
  return fetchJSON<TitleRecord[]>(`/titles`);
}

// ── Recommendation endpoint ──────────────────────────────────────────────────

export interface RecommendationRecord {
  id: string;
  title: string;
  show_type: string;
  primary_genre: string;
  imdb_score: number;
  release_year: number;
  sim_score: number;
}

export async function fetchRecommendations(
  title: string,
  n: number = 10
): Promise<RecommendationRecord[]> {
  const qs = new URLSearchParams({ title, n: String(n) });
  const data = await fetchJSON<RecommendationRecord[] | { error: string }>(`/recommend?${qs}`);
  if (!Array.isArray(data) && (data as any).error) {
    throw new Error((data as any).error);
  }
  return data as RecommendationRecord[];
}

// ── Clusters endpoint ────────────────────────────────────────────────────────

export interface ClusterRecord {
  title: string;
  imdb_score: number;
  log_votes: number;
  cluster_label: string;
  x: number;
  y: number;
}

export async function fetchClusters(label: string = ""): Promise<ClusterRecord[]> {
  const qs = label ? `?label=${encodeURIComponent(label)}` : "";
  return fetchJSON<ClusterRecord[]>(`/clusters${qs}`);
}
