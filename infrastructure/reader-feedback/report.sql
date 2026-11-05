-- Self-selected responses, not unique people or a representative sample.
-- Run privately through authenticated Cloudflare access. Dates are UTC.
SELECT article, COUNT(*) AS responses,
 SUM(rating = 3) AS useful,
 SUM(rating = 2) AS somewhat_useful,
 SUM(rating = 1) AS not_useful,
 ROUND(100.0 * SUM(rating = 3) / COUNT(*), 1) AS useful_percent,
 SUM(improvement = 'examples') AS requests_for_examples,
 SUM(improvement = 'evidence') AS requests_for_evidence,
 SUM(improvement = 'steps') AS requests_for_clearer_steps,
 SUM(improvement = 'relevance') AS requests_for_relevance,
 MIN(created_at) AS first_response_utc, MAX(created_at) AS latest_response_utc
FROM article_feedback
WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-28 days')
GROUP BY article ORDER BY responses DESC;
