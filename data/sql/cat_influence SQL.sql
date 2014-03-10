drop table a_cat_inf_final purge;
drop table a_cat_temp purge;
drop table a_cat_inf purge;

create table a_cat_inf
as
SELECT NODE_ID,
  CAT_DOCS,
  CAT_PROMOTERS,
  CAT_DETRACTORS,
  T_PROMOTERS,
  T_DETRACTORS,
  CAT_DET_SENTIMENT,
  CAT_PRO_SENTIMENT
FROM
  (SELECT COUNT(DISTINCT xref.document_id) CAT_docs,
    node_id
  FROM psv_sentence_class_xref xref
  WHERE xref.node_id > 0
  --AND xref.model_id  = 418763
  GROUP BY node_id
  ) CAT_docs
JOIN
  (SELECT COUNT(DISTINCT xref.document_id) CAT_PROMOTERS,
    AVG(sent.d_sentiment_score) CAT_PRO_SENTIMENT,
    node_id
  FROM psv_document doc
  JOIN psv_sentence sent
  ON doc.document_id = sent.document_id
  JOIN pSV_sentence_class_xref xref
  ON SENT.SENTENCE_ID  = XREF.SENTENCE_ID
  WHERE xref.node_id   > 0
  --AND xref.model_id    = 418763
  AND doc.OSAT between 9 and 10
  GROUP BY node_id
  ) CAT_promoters USING (node_id)
  -- 13.558 seconds
JOIN
  (SELECT COUNT(DISTINCT xref.document_id) CAT_DETRACTORS,
    AVG(sent.d_sentiment_score) CAT_DET_SENTIMENT,
    node_id
  FROM psv_document doc
  JOIN psv_sentence sent
  ON doc.document_id = sent.document_id
  JOIN pSV_sentence_class_xref xref
  ON SENT.SENTENCE_ID  = XREF.SENTENCE_ID
  WHERE xref.node_id   > 0
  --AND xref.model_id    = 418763
  AND doc.OSAT between 0 and 6
  GROUP BY node_id
  ) CAT_DETRACTORS USING (NODE_ID)
  -- 23.121 SECONDS
JOIN
  (SELECT COUNT(DISTINCT DOC.DOCUMENT_ID) T_PROMOTERS
  FROM PSV_DOCUMENT DOC
  WHERE doc.OSAT between 9 and 10
  ) T_PROMOTERS
ON 1=1
JOIN
  (SELECT COUNT(DISTINCT DOC.DOCUMENT_ID) T_DETRACTORS
  FROM PSV_DOCUMENT DOC
  WHERE doc.OSAT between 0 and 6
  ) T_PROMOTERS
ON 1=1
  -- 31.785 SECONDS 