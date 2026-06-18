-- Run this in the Supabase SQL editor (once).
-- Creates the RPC function used by the feature-usage edge function for trend data.

CREATE OR REPLACE FUNCTION feature_usage_buckets(
  p_feature    text,
  p_trunc_unit text DEFAULT 'week'   -- 'week' or 'month'
)
RETURNS TABLE (bucket timestamptz, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    DATE_TRUNC(p_trunc_unit, ts) AS bucket,
    COUNT(*)                      AS count
  FROM analytics_events
  WHERE event            = 'feature_use'
    AND meta->>'feature' = p_feature
  GROUP BY bucket
  ORDER BY bucket;
$$;

-- Allow anon + authenticated roles to call this function via REST
GRANT EXECUTE ON FUNCTION feature_usage_buckets(text, text) TO anon, authenticated;
