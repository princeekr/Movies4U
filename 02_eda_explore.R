# 02_eda_explore.R — Exploratory Data Analysis
.libPaths(c("C:/Users/HP/R/library", .libPaths()))
setwd("C:/Users/HP/OneDrive/Desktop/R_project")

library(readr)
library(dplyr)
library(ggplot2)
library(tidyr)

# ── Load ──────────────────────────────────────────────────────────────────────
df          <- readRDS("models/cleaned_titles.rds")
genres_long <- read_csv("data/genres_long.csv", show_col_types = FALSE)

# ── Content Over Time ─────────────────────────────────────────────────────────
content_time <- df |>
  count(release_year, show_type) |>
  arrange(release_year)

print(content_time)

p1 <- ggplot(content_time, aes(release_year, n, colour = show_type)) +
  geom_line(linewidth = 1) +
  labs(title = "Content Added Over Time", x = "Year", y = "Count") +
  theme_minimal()
ggsave("plots/eda_content_over_time.png", p1, width = 10, height = 5)

# ── Genre Popularity ──────────────────────────────────────────────────────────
genre_pop <- genres_long |>
  group_by(genre) |>
  summarise(count = n(), avg_imdb = mean(imdb_score, na.rm = TRUE)) |>
  arrange(desc(count)) |>
  slice_head(n = 15)

print(genre_pop)

p2 <- ggplot(genre_pop, aes(reorder(genre, count), count, fill = avg_imdb)) +
  geom_col() +
  coord_flip() +
  scale_fill_viridis_c() +
  labs(title = "Top 15 Genres by Count", x = "Genre", y = "Count", fill = "Avg IMDB") +
  theme_minimal()
ggsave("plots/eda_genre_popularity.png", p2, width = 10, height = 6)

# ── Country Production ────────────────────────────────────────────────────────
country_prod <- df |>
  count(primary_country, sort = TRUE) |>
  filter(!is.na(primary_country)) |>
  slice_head(n = 25)

print(country_prod)

p3 <- ggplot(country_prod, aes(reorder(primary_country, n), n)) +
  geom_col(fill = "steelblue") +
  coord_flip() +
  labs(title = "Top 25 Countries by Production", x = "Country", y = "Count") +
  theme_minimal()
ggsave("plots/eda_country_production.png", p3, width = 10, height = 7)

# ── Score Distribution ────────────────────────────────────────────────────────
score_dist <- df |>
  mutate(score_rounded = round(imdb_score * 2) / 2) |>
  count(score_rounded, show_type)

print(score_dist)

p4 <- ggplot(score_dist, aes(score_rounded, n, fill = show_type)) +
  geom_col(position = "dodge") +
  labs(title = "Score Distribution by Type", x = "IMDB Score", y = "Count") +
  theme_minimal()
ggsave("plots/eda_score_distribution.png", p4, width = 10, height = 5)

# ── Age Certification ─────────────────────────────────────────────────────────
age_cert <- df |>
  group_by(age_certification) |>
  summarise(count = n(), avg_imdb = mean(imdb_score, na.rm = TRUE)) |>
  arrange(desc(count))

print(age_cert)

p5 <- ggplot(age_cert, aes(reorder(age_certification, count), count, fill = avg_imdb)) +
  geom_col() +
  coord_flip() +
  scale_fill_gradient(low = "tomato", high = "darkgreen") +
  labs(title = "Age Certification Distribution", x = "Certification", y = "Count", fill = "Avg IMDB") +
  theme_minimal()
ggsave("plots/eda_age_certification.png", p5, width = 9, height = 5)

message("✓ 02_eda_explore.R complete — plots saved")
