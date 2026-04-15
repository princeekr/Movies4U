# 03_model_score.R — XGBoost IMDB Score Predictor
.libPaths(c("C:/Users/HP/R/library", .libPaths()))
setwd("C:/Users/HP/OneDrive/Desktop/R_project")

library(readr)
library(dplyr)
library(tidyr)
library(caret)
library(xgboost)

set.seed(42)

# ── Load ──────────────────────────────────────────────────────────────────────
df <- readRDS("models/cleaned_titles.rds")

# ── Prepare Features ──────────────────────────────────────────────────────────
features <- c(
  "runtime", "release_year", "title_age", "is_movie", "genre_count",
  "desc_length", "seasons", "log_votes", "log_popularity",
  "primary_genre", "age_certification", "country_group"
)
target <- "imdb_score"

model_df <- df |>
  select(all_of(c(features, target))) |>
  mutate(
    primary_genre    = as.character(primary_genre),
    age_certification = as.character(age_certification),
    country_group    = as.character(country_group),
    seasons          = as.numeric(seasons)
  ) |>
  drop_na()

# ── One-Hot Encode ────────────────────────────────────────────────────────────
dummy_obj <- dummyVars(~ primary_genre + age_certification + country_group,
                       data = model_df, fullRank = FALSE)
saveRDS(dummy_obj, "models/score_dummies.rds")

encoded <- predict(dummy_obj, newdata = model_df)

numeric_features <- c(
  "runtime", "release_year", "title_age", "is_movie", "genre_count",
  "desc_length", "seasons", "log_votes", "log_popularity"
)

X <- cbind(
  model_df |> select(all_of(numeric_features)) |> as.matrix(),
  encoded
)
y <- model_df[[target]]

# ── Train / Test Split ────────────────────────────────────────────────────────
idx   <- createDataPartition(y, p = 0.8, list = FALSE)
X_tr  <- X[idx, ];  y_tr <- y[idx]
X_te  <- X[-idx, ]; y_te <- y[-idx]

dtrain <- xgb.DMatrix(X_tr, label = y_tr)
dtest  <- xgb.DMatrix(X_te, label = y_te)

# ── Cross-Validation ──────────────────────────────────────────────────────────
params <- list(
  objective  = "reg:squarederror",
  eta        = 0.05,
  max_depth  = 6,
  subsample  = 0.8,
  eval_metric = "rmse"
)

cv <- xgb.cv(
  params                = params,
  data                  = dtrain,
  nrounds               = 500,
  nfold                 = 5,
  early_stopping_rounds = 30,
  verbose               = 0
)

# best_iteration may be NULL if early stopping didn't trigger
best_nrounds <- if (!is.null(cv$best_iteration) && !is.na(cv$best_iteration) && cv$best_iteration > 0) {
  cv$best_iteration
} else {
  which.min(cv$evaluation_log$test_rmse_mean)
}
if (is.null(best_nrounds) || length(best_nrounds) == 0) best_nrounds <- 100L
best_nrounds <- as.integer(best_nrounds)
message("Best nrounds: ", best_nrounds)

# ── Train Final Model ─────────────────────────────────────────────────────────
model <- xgb.train(
  params  = params,
  data    = dtrain,
  nrounds = best_nrounds,
  evals   = list(train = dtrain, test = dtest),   # xgboost ≥3: 'evals' replaces 'watchlist'
  verbose = 0
)

# ── Evaluate ──────────────────────────────────────────────────────────────────
preds <- predict(model, dtest)
rmse  <- sqrt(mean((preds - y_te)^2))
mae   <- mean(abs(preds - y_te))
message(sprintf("RMSE: %.4f | MAE: %.4f", rmse, mae))

# ── Save ──────────────────────────────────────────────────────────────────────
xgb.save(model, "models/xgb_score.model")
message("✓ 03_model_score.R complete")
