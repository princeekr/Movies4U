# api.R — Plumber REST API
.libPaths(c("C:/Users/HP/R/library", .libPaths()))
setwd("C:/Users/HP/OneDrive/Desktop/R_project")

#* @apiTitle Netflix Titles Analytics API
#* @apiVersion 1.0.0

library(plumber)
library(dplyr)
library(readr)
library(xgboost)
library(caret)

# ── CORS filter ───────────────────────────────────────────────────────────────
#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  }
  plumber::forward()
}

# ── Load data once at startup ─────────────────────────────────────────────────
df           <- readRDS("models/cleaned_titles.rds")
genres_long  <- read_csv("data/genres_long.csv", show_col_types = FALSE)
clusters_obj <- readRDS("models/clusters.rds")
top_sim      <- readRDS("models/sim_matrix.rds")
rec_obj      <- readRDS("models/rec_features.rds")
xgb_model    <- xgb.load("models/xgb_score.model")
dummy_obj    <- readRDS("models/score_dummies.rds")

# ============================================================
# EDA ENDPOINTS
# ============================================================

#* Summary statistics for homepage
#* @get /stats
#* @serializer json
function() {
  total <- nrow(df)
  n_movies <- sum(df$show_type == "MOVIE", na.rm = TRUE)
  n_shows  <- sum(df$show_type == "SHOW", na.rm = TRUE)
  n_countries <- length(unique(na.omit(df$primary_country)))
  n_genres <- length(unique(na.omit(genres_long$genre)))
  list(
    total_titles = total,
    movies = n_movies,
    shows = n_shows,
    countries = n_countries,
    genres = n_genres
  )
}

#* Content added over time
#* @param type MOVIE, SHOW, or ALL (default ALL)
#* @get /content_over_time
#* @serializer json
function(type = "ALL") {
  d <- df
  if (type != "ALL") {
    d <- d |> filter(show_type == toupper(type))
  }
  d |>
    count(release_year) |>
    arrange(release_year) |>
    as.list() |>
    lapply(as.vector)
}

#* Genre popularity
#* @param n Number of genres (default 15)
#* @get /genre_popularity
#* @serializer json
function(n = 15) {
  n <- as.integer(n)
  genres_long |>
    group_by(genre) |>
    summarise(count = n(), avg_imdb_score = mean(imdb_score, na.rm = TRUE)) |>
    arrange(desc(count)) |>
    slice_head(n = n)
}

#* Top countries by production count
#* @get /country_production
#* @serializer json
function() {
  df |>
    filter(!is.na(primary_country)) |>
    count(primary_country, sort = TRUE) |>
    slice_head(n = 25)
}

#* IMDB score distribution split by show type
#* @get /score_distribution
#* @serializer json
function() {
  df |>
    mutate(score_rounded = round(imdb_score * 2) / 2) |>
    count(score_rounded, show_type) |>
    arrange(score_rounded)
}

#* Age certification stats
#* @get /age_certification
#* @serializer json
function() {
  df |>
    group_by(age_certification) |>
    summarise(count = n(), avg_imdb_score = mean(imdb_score, na.rm = TRUE)) |>
    arrange(desc(count))
}

# ============================================================
# SCORE PREDICTION ENDPOINT
# ============================================================

#* Predict IMDB score for a title
#* @param genre Primary genre (e.g. drama)
#* @param runtime Runtime in minutes
#* @param year Release year
#* @param show_type MOVIE or SHOW
#* @param age_cert Age certification (e.g. PG-13)
#* @param country Country code (e.g. US)
#* @param seasons Number of seasons (default 0)
#* @param votes Estimated IMDB votes (default 1000)
#* @param popularity TMDB popularity score (default 10)
#* @get /predict_score
#* @serializer json
function(genre = "drama", runtime = 90, year = 2022, show_type = "MOVIE",
         age_cert = "PG-13", country = "US",
         seasons = 0, votes = 1000, popularity = 10) {

  runtime    <- as.numeric(runtime)
  year       <- as.numeric(year)
  seasons    <- as.numeric(seasons)
  votes      <- as.numeric(votes)
  popularity <- as.numeric(popularity)
  is_movie   <- if_else(toupper(show_type) == "MOVIE", 1L, 0L)

  new_row <- data.frame(
    primary_genre     = as.character(genre),
    age_certification = as.character(age_cert),
    country_group     = as.character(country),
    stringsAsFactors  = FALSE
  )

  encoded  <- tryCatch(predict(dummy_obj, newdata = new_row), error = function(e) matrix(0, 1, 1))

  num_part <- matrix(
    c(runtime, year, 2024 - year, is_movie,
      1, nchar(genre), seasons, log1p(votes), log1p(popularity)),
    nrow = 1
  )

  X_new   <- cbind(num_part, encoded)
  d_new   <- xgb.DMatrix(X_new)
  pred    <- predict(xgb_model, d_new)

  list(predicted_score = round(pred, 3))
}

# ============================================================
# RECOMMENDATION ENDPOINTS
# ============================================================

#* All available titles
#* @get /titles
#* @serializer json
function() {
  df |>
    select(id, title, show_type, primary_genre, imdb_score, release_year) |>
    filter(!is.na(title))
}

#* Recommend similar titles
#* @param title Exact title name
#* @param n Number of recommendations (default 10)
#* @get /recommend
#* @serializer json
function(title = "", n = 10) {
  n <- as.integer(n)
  query_title <- title

  source_row <- df |> filter(tolower(.data$title) == tolower(query_title)) |> slice(1)

  if (nrow(source_row) == 0) {
    return(list(error = paste("Title not found:", query_title)))
  }

  source_id <- source_row$id

  sims <- top_sim |>
    filter(id == source_id) |>
    arrange(desc(sim_score)) |>
    slice_head(n = n)

  if (nrow(sims) == 0) {
    return(list(error = "No recommendations found for this title"))
  }

  df |>
    filter(id %in% sims$sim_id) |>
    left_join(sims |> select(sim_id, sim_score), by = c("id" = "sim_id")) |>
    arrange(desc(sim_score)) |>
    select(id, title, show_type, primary_genre, imdb_score, release_year, sim_score)
}

# ============================================================
# CLUSTER ENDPOINT
# ============================================================

#* Cluster data for visualisation
#* @param label Optional cluster label filter
#* @get /clusters
#* @serializer json
function(label = "") {
  clust_data <- clusters_obj$data

  if (nzchar(label)) {
    clust_data <- clust_data |> filter(cluster_label == label)
  }

  sample_size <- min(500, nrow(clust_data))

  clust_data |>
    slice_sample(n = sample_size) |>
    select(title, imdb_score, log_votes, cluster_label, x, y)
}

# ============================================================
# PLUMBER MODIFIER — mount static plot files
# ============================================================

#* @plumber
function(pr) {
  pr |> plumber::pr_static("/plots", "./plots")
}
