

select totals.cat_id,
	totals.cat_en,
	totals.cat_group_en,
	totals.OSAT,
	totals.Total_Documents,
	detractors.Detractor_Documents,
	promoters.Promoter_Documents,
	neutrals.Neutral_Documents
from 
(
	select t.cat_id, 
		t.cat_en, 
		t.cat_group_en, 
		avg(d.q02_osat) as OSAT, 
		count(distinct d.document_id) as Total_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.cat_id
	where d.q02_osat is not null
	and t.model_nm_en = 'Cisco Model'
	group by t.cat_en, 
		t.cat_id,
		t.cat_group_en
) totals
join 
(
	select t.cat_id, 
		count(distinct d.document_id) as Promoter_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.cat_id
	where d.q02_osat is not null
	and t.model_nm_en = 'Cisco Model'
	and d.q02_osat =5
	group by t.cat_id
) promoters
	on totals.cat_id = promoters.cat_id
join
(
	select t.cat_id, 
		count(distinct d.document_id) as Detractor_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.cat_id
	where d.q02_osat is not null
	and t.model_nm_en = 'Cisco Model'
	and d.q02_osat between 1 and 3
	group by t.cat_id
) detractors
	on totals.cat_id = detractors.cat_id
join
(
	select t.cat_id, 
		count(distinct d.document_id) as Neutral_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.cat_id
	where d.q02_osat is not null
	and t.model_nm_en = 'Cisco Model'
	and d.q02_osat = 4
	group by t.cat_id
) neutrals
	on totals.cat_id = neutrals.cat_id
;

