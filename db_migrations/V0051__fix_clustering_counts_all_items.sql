UPDATE clustering_projects
SET 
  keywords_count = (
    SELECT COUNT(*)
    FROM jsonb_array_elements(results->'clusters') AS cluster,
         jsonb_array_elements(cluster->'phrases') AS phrase
  ),
  clusters_count = (
    SELECT COUNT(*)
    FROM jsonb_array_elements(results->'clusters') AS cluster
  ),
  minus_words_count = (
    SELECT COALESCE(jsonb_array_length(results->'minusWords'), 0)
  )
WHERE results IS NOT NULL;