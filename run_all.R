# run_all.R — Master Pipeline Runner
# Runs all 5 pipeline scripts in order, then starts the API

# Ensure user library is on the path
.libPaths(c("C:/Users/HP/R/library", .libPaths()))

setwd(dirname(sys.frame(1)$ofile))   # set wd to script location (when sourced)

message("============================================================")
message(" Netflix Titles Analytics — Full Pipeline")
message("============================================================")

steps <- c(
  "01_clean.R",
  "02_eda_explore.R",
  "03_model_score.R",
  "04_model_recommend.R",
  "05_model_cluster.R"
)

for (step in steps) {
  message("\n▶ Running ", step, " ...")
  tryCatch(
    source(step, local = new.env()),
    error = function(e) {
      message("✗ ERROR in ", step, ": ", conditionMessage(e))
      stop(e)
    }
  )
}

message("\n============================================================")
message(" All pipeline steps complete!")
message(" Start the API with:")
message('   plumber::pr("api.R") |> plumber::pr_run(port = 8000)')
message("============================================================")
