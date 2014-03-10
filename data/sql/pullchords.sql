
drop table graham_temp1 purge;
drop table graham_temp2 purge;
drop table graham_temp3 purge;

create table graham_temp1 as 
select ops_cats.sub_cat_en as primary_cat, 
  ops_cats.sub_cat_id as primary_id,
  cat_cats.cat_group_en as rel_cat,
  cat_cats.cat_group_id as rel_id,
  ops_cats.document_id as document_id,
  ops_cats.degree_sentiment
  
from
(
  select t.sub_cat_en, t.sub_cat_id, d.document_id, avg(s.d_sentiment_score) as degree_sentiment from psv_document d
  join psv_sentence s on d.document_id = s.document_id 
  join psv_sentence_class_xref x on s.sentence_id = x.sentence_id
  join psv_category_tree t on x.node_id = t.sub_cat_id
  where t.cat_group_id in (81358,81608,81870,81873,81876) -- operations categories
  and t.sub_cat_id > 0
  group by t.sub_cat_en, t.sub_cat_id, d.document_id
) ops_cats
join
(
  select t.cat_group_en, t.cat_group_id, d.document_id from psv_document d
  join psv_sentence s on d.document_id = s.document_id 
  join psv_sentence_class_xref x on s.sentence_id = x.sentence_id
  join psv_category_tree t on x.node_id = t.sub_cat_id
  where t.cat_group_id in (76087,76157,76177,117537,117792,117975,118166,118352,118560,118765,118839,118978,120116) -- categories of walmart
  and t.sub_cat_id > 0
) cat_cats
  on ops_cats.document_id = cat_cats.document_id
  and ops_cats.sub_cat_id <> cat_cats.cat_group_id
;

create table graham_temp2 as 
select ops_cats.cat_group_en as primary_cat, 
  ops_cats.cat_group_id as primary_id,
  cat_cats.sub_cat_en as rel_cat,
  cat_cats.sub_cat_id as rel_id,
  ops_cats.document_id as document_id,
  ops_cats.degree_sentiment
  
from
(
  select t.cat_group_en, t.cat_group_id, d.document_id, avg(s.d_sentiment_score) as degree_sentiment from psv_document d
  join psv_sentence s on d.document_id = s.document_id 
  join psv_sentence_class_xref x on s.sentence_id = x.sentence_id
  join psv_category_tree t on x.node_id = t.sub_cat_id
  where t.cat_group_id in (76087,76157,76177,117537,117792,117975,118166,118352,118560,118765,118839,118978,120116) -- operations categories
  and t.sub_cat_id > 0
  group by t.cat_group_en, t.cat_group_id, d.document_id
) ops_cats
join
(
  select t.sub_cat_en, t.sub_cat_id, d.document_id from psv_document d
  join psv_sentence s on d.document_id = s.document_id 
  join psv_sentence_class_xref x on s.sentence_id = x.sentence_id
  join psv_category_tree t on x.node_id = t.sub_cat_id
  where t.cat_group_id in (81358,81608,81870,81873,81876) -- categories of walmart
  and t.sub_cat_id > 0
) cat_cats
  on ops_cats.document_id = cat_cats.document_id
  and ops_cats.cat_group_id <> cat_cats.sub_cat_id
;

create table graham_temp3 as select g.*, '1' as Order_by_me from graham_temp1 g;

insert into graham_temp3 select g.*, '2' as Order_by_me from graham_temp2 g;

select * from graham_temp3;

select order_by_me, primary_cat, rel_cat, count(distinct document_id) as cooc, avg(degree_sentiment) as sentiment
from graham_temp3 
group by order_by_me, primary_cat, rel_cat
order by order_by_me;

/*


create table graham_temp as 
select ops_cats.sub_cat_en as primary_cat, 
  ops_cats.sub_cat_id as primary_id,
  cat_cats.sub_cat_en as rel_cat,
  cat_cats.sub_cat_id as rel_id,
  ops_cats.document_id as document_id,
  ops_cats.degree_sentiment
  
from
(
  select t.sub_cat_en, t.sub_cat_id, d.document_id, avg(s.d_sentiment_score) as degree_sentiment from psv_document d
  join psv_sentence s on d.document_id = s.document_id 
  join psv_sentence_class_xref x on s.sentence_id = x.sentence_id
  join psv_category_tree t on x.node_id = t.sub_cat_id
  where t.cat_group_id in (81358,81608,81870,81873,81876,76087,76157,76177,117537,117792,117975,118166,118352,118560,118765,118839,118978,120116) -- operations categories
  and t.sub_cat_id > 0
  group by t.sub_cat_en, t.sub_cat_id, d.document_id
) ops_cats
join
(
  select t.sub_cat_en, t.sub_cat_id, d.document_id from psv_document d
  join psv_sentence s on d.document_id = s.document_id 
  join psv_sentence_class_xref x on s.sentence_id = x.sentence_id
  join psv_category_tree t on x.node_id = t.sub_cat_id
  where t.cat_group_id in (81358,81608,81870,81873,81876,76087,76157,76177,117537,117792,117975,118166,118352,118560,118765,118839,118978,120116) -- categories of walmart
  and t.sub_cat_id > 0
) cat_cats
  on ops_cats.document_id = cat_cats.document_id
  and ops_cats.sub_cat_id <> cat_cats.sub_cat_id
  and 
  (
      (
        ( ops_cats.sub_cat_id in 
            (select sub_cat_id from psv_category_tree where cat_group_id in (81358,81608,81870,81873,81876))
          and 
          cat_cats.sub_cat_id in 
            (select sub_cat_id from psv_category_tree where cat_group_id in (76087,76157,76177,117537,117792,117975,118166,118352,118560,118765,118839,118978,120116) ))    
      )
      or
      ( 
        ops_cats.sub_cat_id in 
            (select sub_cat_id from psv_category_tree where cat_group_id in (76087,76157,76177,117537,117792,117975,118166,118352,118560,118765,118839,118978,120116)) 
        and 
        cat_cats.sub_cat_id in 
            (select sub_cat_id from psv_category_tree where cat_group_id in (81358,81608,81870,81873,81876)) 
      )
  )  
;

select distinct cat_group_id, cat_group_en from psv_category_tree order by 1 ;

select * from psv_category_tree;

select * from psv_category_tree t
 where t.cat_group_id in 
 (76087,76157,76177,81358,81608,81870,81873,81876,117537,
  117792,117975,118166,118352,118560,118765,118839,118978,120116) -- categories of walmart
 -- (81358,81608,81870,81873,81876)
  and t.sub_cat_id > 0
  and sub_cat_en = 'Product Availability';
--136242
select * from graham_temp where rel_cat = 'Product Availability';

*/
