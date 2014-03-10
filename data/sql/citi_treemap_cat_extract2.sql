/* PLEASE NOTE, 
1) To use this script, grant select on pc_class_tree to NAV_AS_*; was run from the CBPS
2) Needed to insert a top row representing the root node.  This data only exists on CBSS.
3) Renamed "Root Node" to "Show ALL" to allow interactivity with bar chart.  
	Need a more elegant solution.
*/

select distinct model_id, model_nm_en from psv_category_tree;

select totals.node_id, 
	totals.node_name, 
	totals.parent_id as parent, 
	totals.Sentiment_Score,
	totals.Total_Documents,
  detractors.Detractor_Documents,
  detractors.Detractor_Sentiment,
  promoters.Promoter_Documents,
  promoters.Promoter_Sentiment,
  neutrals.Neutral_Documents,
  neutrals.Neutral_Sentiment
from 
(
	select t.node_id, 
  t.node_name,
	t.parent_id,
	avg(s.d_sentiment_score) as Sentiment_Score,
	count(distinct d.document_id) as Total_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join nav_ps_citi_poc.pc_class_tree t on x.node_id = t.node_id
	where d.nps1 is not null
	and t.id_model = 80979
	and t.node_id > 0
	group by t.node_id,
  t.node_name,
	t.parent_id
) totals

join 
(
	select t.node_id, 
	avg(s.d_sentiment_score) as Detractor_Sentiment,
	count(distinct d.document_id) as Detractor_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join nav_ps_citi_poc.pc_class_tree t on x.node_id = t.node_id
	where d.nps1 is not null
	and d.nps1 between 0 and 6
	and t.id_model = 80979
	and t.node_id > 0
	group by t.node_id
) detractors 
	on totals.node_id = detractors.node_id

join 
(
	select t.node_id, 
	avg(s.d_sentiment_score) as Promoter_Sentiment,
	count(distinct d.document_id) as Promoter_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join nav_ps_citi_poc.pc_class_tree t on x.node_id = t.node_id
	where d.nps1 is not null
	and d.nps1 between 9 and 10
	and t.id_model = 80979
	and t.node_id > 0
	group by t.node_id
) promoters 
	on totals.node_id = promoters.node_id

join 
(
	select t.node_id, 
	avg(s.d_sentiment_score) as Neutral_Sentiment,
		count(distinct d.document_id) as Neutral_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join nav_ps_citi_poc.pc_class_tree t on x.node_id = t.node_id
	where d.nps1 is not null
	and d.nps1 between 7 and 8
	and t.id_model = 80979
	and t.node_id > 0
	group by t.node_id
) neutrals 
	on totals.node_id = neutrals.node_id
