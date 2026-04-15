# 04_model_recommend.R — Cosine Similarity Content Recommender
.libPaths(c("C:/Users/HP/R/library", .libPaths()))
setwd("C:/Users/HP/OneDrive/Desktop/R_project")

library(readr)
library(dplyr)
library(tidyr)
library(lsa)

# ── Load ──────────────────────────────────────────────────────────────────────
df <- readRDS("models/cleaned_titles.rds")

# ── Prepare Feature Matrix ────────────────────────────────────────────────────
rec_df <- df |>
  select(id, title, primary_genre, is_movie, imdb_score, tmdb_popularity, runtime) |>
  drop_na() |>
  mutate(
    primary_genre = as.character(primary_genre),
    primary_genre = if_else(is.na(primary_genre), "Unknown", primary_genre)
  )

# One-hot encode primary_genre
genre_dummies <- model.matrix(~ primary_genre - 1, data = rec_df)

# Min-max normalise numeric features
min_max <- function(x) {
  r <- max(x, na.rm = TRUE) - min(x, na.rm = TRUE)
  if (r == 0) return(rep(0, length(x)))
  (x - min(x, na.rm = TRUE)) / r
}

numeric_mat <- rec_df |>
  transmute(
    is_movie       = as.double(is_movie),
    imdb_score     = min_max(imdb_score),
    tmdb_popularity = min_max(tmdb_popularity),
    runtime        = min_max(runtime)
  ) |>
  as.matrix()

feature_mat <- cbind(numeric_mat, genre_dummies)
rownames(feature_mat) <- rec_df$id

# Save feature matrix meta
rec_meta <- rec_df |> select(id, title)
saveRDS(list(features = feature_mat, meta = rec_meta), "models/rec_features.rds")

# ── Compute Cosine Similarity & Store Top-20 per Title ────────────────────────
message("Computing cosine similarity (may take a moment)…")

# cosine() from lsa works on columns; transpose so titles are columns
sim_full <- cosine(t(feature_mat))

top_k <- 20

top_sim <- lapply(seq_len(nrow(sim_full)), function(i) {
  scores <- sim_full[i, ]
  scores[i] <- -Inf                      # exclude self
  top_idx <- order(scores, decreasing = TRUE)[seq_len(top_k)]
  data.frame(
    id        = rownames(sim_full)[i],
    sim_id    = rownames(sim_full)[top_idx],
    sim_score = scores[top_idx],
    stringsAsFactors = FALSE
  )
})

top_sim_df <- do.call(rbind, top_sim)
saveRDS(top_sim_df, "models/sim_matrix.rds")

message("✓ 04_model_recommend.R complete")
