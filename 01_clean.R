# 01_clean.R — Data Cleaning & Feature Engineering
.libPaths(c("C:/Users/HP/R/library", .libPaths()))
setwd("C:/Users/HP/OneDrive/Desktop/R_project")

library(readr)
library(dplyr)
library(tidyr)
library(stringr)
library(purrr)

# ── 1. Load ──────────────────────────────────────────────────────────────────
df <- read_csv("titles.csv", show_col_types = FALSE)

# Rename 'type' → 'show_type' to match downstream scripts
if ("type" %in% names(df) && !"show_type" %in% names(df)) {
  df <- df |> rename(show_type = type)
}

# ── 2. Inspect ───────────────────────────────────────────────────────────────
glimpse(df)
summary(df)
print(colSums(is.na(df)))

# ── 3. Handle Missing Values ─────────────────────────────────────────────────
df <- df |>
  filter(!is.na(imdb_score)) |>
  mutate(
    age_certification = if_else(is.na(age_certification), "Unrated", age_certification),
    seasons = case_when(
      !is.na(seasons) ~ seasons,
      show_type == "MOVIE" ~ 0,
      TRUE ~ seasons
    )
  )

# Fill runtime NA with median grouped by show_type
df <- df |>
  group_by(show_type) |>
  mutate(runtime = if_else(is.na(runtime), median(runtime, na.rm = TRUE), as.double(runtime))) |>
  ungroup()

# ── 4. Parse Columns ─────────────────────────────────────────────────────────
parse_list_col <- function(x) {
  x |>
    str_remove_all("\\[|\\]|'|\"|\\s") |>
    str_split(",")
}

df <- df |>
  mutate(
    genres_list            = parse_list_col(genres),
    production_list        = parse_list_col(production_countries),
    primary_genre          = map_chr(genres_list, ~ if (length(.x) > 0 && .x[1] != "") .x[1] else NA_character_),
    primary_country        = map_chr(production_list, ~ if (length(.x) > 0 && .x[1] != "") .x[1] else NA_character_),
    genre_count            = map_int(genres_list, ~ sum(.x != "", na.rm = TRUE))
  )

# genres_long — expand one row per genre per title
genres_long <- df |>
  select(id, title, show_type, imdb_score, genres_list) |>
  unnest(genres_list) |>
  rename(genre = genres_list) |>
  filter(!is.na(genre), genre != "")

# ── 5. Feature Engineering ───────────────────────────────────────────────────
top_countries <- df |>
  count(primary_country, sort = TRUE) |>
  slice_head(n = 7) |>
  pull(primary_country)

df <- df |>
  mutate(
    decade         = floor(release_year / 10) * 10,
    title_age      = 2024 - release_year,
    is_movie       = if_else(show_type == "MOVIE", 1L, 0L),
    desc_length    = nchar(as.character(description)),
    log_votes      = log1p(imdb_votes),
    log_popularity = log1p(tmdb_popularity),
    score_bucket   = case_when(
      imdb_score >= 8   ~ "Excellent",
      imdb_score >= 6.5 ~ "Good",
      imdb_score >= 5   ~ "Average",
      TRUE              ~ "Poor"
    ),
    country_group  = if_else(primary_country %in% top_countries, primary_country, "Other")
  )

# ── 6. Save Outputs ──────────────────────────────────────────────────────────
saveRDS(df, "models/cleaned_titles.rds")
write_csv(genres_long, "data/genres_long.csv")

message("✓ 01_clean.R complete")
