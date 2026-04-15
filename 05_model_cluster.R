# 05_model_cluster.R — K-Means Clustering
.libPaths(c("C:/Users/HP/R/library", .libPaths()))
setwd("C:/Users/HP/OneDrive/Desktop/R_project")

library(readr)
library(dplyr)
library(tidyr)
library(factoextra)

set.seed(42)

# ── Load ──────────────────────────────────────────────────────────────────────
df <- readRDS("models/cleaned_titles.rds")

# ── Prepare Clustering Features ───────────────────────────────────────────────
clust_df <- df |>
  select(id, title, imdb_score, log_votes, log_popularity, runtime, is_movie) |>
  drop_na()

feature_mat <- clust_df |>
  select(imdb_score, log_votes, log_popularity, runtime, is_movie) |>
  as.matrix()

scaled_mat <- scale(feature_mat)

# ── Elbow Method — Optimal k ──────────────────────────────────────────────────
message("Running elbow method…")
elbow_plot <- fviz_nbclust(scaled_mat, kmeans, method = "wss", k.max = 10,
                            nstart = 10, iter.max = 50)
ggsave("plots/cluster_elbow.png", elbow_plot, width = 8, height = 5)

# Choose k = 5 (typical elbow for this type of dataset)
k <- 5

# ── Train K-Means ─────────────────────────────────────────────────────────────
km <- kmeans(scaled_mat, centers = k, nstart = 25, iter.max = 100)

clust_df <- clust_df |>
  mutate(cluster = km$cluster)

# ── Label Clusters ────────────────────────────────────────────────────────────
# Compute cluster summary to label manually
cluster_summary <- clust_df |>
  group_by(cluster) |>
  summarise(
    avg_score      = mean(imdb_score),
    avg_votes      = mean(log_votes),
    avg_popularity = mean(log_popularity),
    avg_runtime    = mean(runtime),
    n              = n()
  ) |>
  arrange(desc(avg_score))

print(cluster_summary)

# Assign labels based on relative score + votes
label_map <- cluster_summary |>
  arrange(desc(avg_score), desc(avg_votes)) |>
  mutate(cluster_label = c(
    "Blockbusters",
    "Critically Acclaimed",
    "Hidden Gems",
    "Average",
    "Flops"
  )[seq_len(nrow(cluster_summary))]) |>
  select(cluster, cluster_label)

clust_df <- clust_df |>
  left_join(label_map, by = "cluster")

# ── PCA for 2-D Visualisation ─────────────────────────────────────────────────
pca <- prcomp(scaled_mat, center = FALSE, scale. = FALSE)
pca_coords <- as.data.frame(pca$x[, 1:2])
colnames(pca_coords) <- c("x", "y")

clust_df <- bind_cols(clust_df, pca_coords)

# ── Save ──────────────────────────────────────────────────────────────────────
saveRDS(list(data = clust_df, km = km, pca = pca, label_map = label_map), "models/clusters.rds")

message("✓ 05_model_cluster.R complete")
