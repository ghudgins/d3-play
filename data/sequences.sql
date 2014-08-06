/*

Pre-steps: 

Determine categories for analysis, their priority, and generate table
priority is an answer to this quesiton:  if a customer talks about topic A and topic B 
in the same thought, which would be the more dominant discussion topic?  i.e. "i love the products
but i was pissed off about the billing process."  In this example, you'd need to put a priority against
products and billing to determine which assignment this sentence would get in the sequence analysis.
This should be determined with the cusotmer when you are selecting categories to sequence.

This example will use - best buy's categories selected by Graham
*/

drop table z_sequences_cat_priority purge;

create table z_sequences_cat_priority 
	(
		cat_group_id number,
		cat_group_en varchar2(4000 byte),
		cat_priority number
	);

insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (498805,'Billing',3);
insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (499102,'Employees',4);
insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (499186,'Install',6);
insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (499363,'Order',7);
insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (499526,'Policy',9);
insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (499612,'Product',2);
insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (499706,'Product Failure',1);
insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (500120,'Return & Exchange',5);
insert into z_sequences_cat_priority (cat_group_id, cat_group_en, cat_priority) values (500655,'Store',8);

commit;

/*

step 1 - build metadata:  

select DOCUMENT_ID, SENTENCE_ID, CATEGORY_EN, CAT_PRIORITY***
***inner join a table with priorities of each category_en we want, needs to be developed by analyst
where CATEGORY in (small list of categories in the priority table)
and date = some recent time period
order by document ID, sentence_id
*/


create table z_sequences_raw as
	select distinct s.document_id, s.sentence_id, t.cat_group_en, t.cat_group_id, z.cat_priority
	from psv_document d
	join psv_verbatim v on d.document_id = v.document_id
	join psv_sentence s on d.document_id = s.document_id
	join psv_sentence_class_xref x on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.cat_group_id
	join z_sequences_cat_priority z on t.cat_group_id = z.cat_group_id
	where to_char(d.document_date, 'yyyymm') = '201404'
	and v.verbatim_type_id = 1
	order by 1,2,5 asc;

/*
step 2 - build sequences:

for each document...

(

	for each sentence (

		write to variable/table = select document_id, sentence_id, category_en from cat_priority 
		where cat_priority = (select min(cat_priority) from table where sentence_id = i)
	)
)
*/

drop table z_sequences_prioritized purge;

create table z_sequences_prioritized as
	select * from z_sequences_raw r 
	where r.cat_priority = (select min(r2.cat_priority) from z_sequences_raw r2 where r.sentence_id = r2.sentence_id);

select LISTAGG(session_id, ' >> ') within group (ORDER BY verbatim_id)
from psv_verbatim
where document_id = 1126001
group by document_id;

