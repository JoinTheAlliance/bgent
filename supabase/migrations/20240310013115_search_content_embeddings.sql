create extension if not exists "fuzzystrmatch" with schema "extensions";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_embedding_list(
    query_table_name text,
    query_threshold integer,
    query_input text,
    query_field_name text,
    query_field_sub_name text,
    query_match_count integer
)
RETURNS TABLE(embedding vector, levenshtein_score integer)
LANGUAGE plpgsql
AS $function$
DECLARE
    QUERY TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = query_table_name) THEN
        RAISE EXCEPTION 'Table % does not exist', query_table_name;
    END IF;

    RAISE NOTICE 'Length of query_input: %', LENGTH(query_input);

    QUERY := format($$
        WITH filtered_content AS (
            SELECT
                embedding,
                (content->>%L)::TEXT AS content_text
            FROM
                %I
            WHERE
                LENGTH((content->>%L)::TEXT) <= 255
        )
        SELECT
            embedding,
            CASE 
                WHEN LENGTH($1) <= 255 THEN levenshtein($1, content_text)
                ELSE 0
            END AS levenshtein_score
        FROM
            filtered_content
        WHERE
            LENGTH($1) <= 255 AND levenshtein($1, content_text) <= $2
        OR
            LENGTH($1) > 255 AND content_text = $1
        ORDER BY
            levenshtein_score
        LIMIT
            $3
    $$, query_field_name, query_table_name, query_field_name);

    RAISE NOTICE 'Generated query: %', QUERY;

    RETURN QUERY EXECUTE QUERY USING query_input, query_threshold, query_match_count;
END;
$function$;
