declare

d_damp number;
d_up_down number;
d_mute number;
u_damp number;
u_up_down number;
u_mute number;


temp number;
script varchar2(32000);
osat_col varchar2(32000);

begin

osat_col:= 'osat';

script:= 'create table a_cat_temp as select 
';

script:= script || '(cat_detractors / cat_promoters) * (cat_detractors / t_detractors) det_final_volume,
';

 
 select num into d_damp from a_cat_meta where calc = 'polarity' and dir='down' and type ='damp';
 select num into d_up_down from a_cat_meta where calc = 'polarity' and dir='down' and type ='up/down';
 select num into d_mute from a_cat_meta where calc = 'polarity' and dir='down' and type ='mute';
 select num into u_damp from a_cat_meta where calc = 'polarity' and dir='up' and type ='damp';
 select num into u_up_down from a_cat_meta where calc = 'polarity' and dir='up' and type ='up/down';
 select num into u_mute from a_cat_meta where calc = 'polarity' and dir='up' and type ='mute';
 
 script:= script || '-exp(-abs(cat_det_sentiment-cat_pro_sentiment)*100/'|| d_up_down ||')+1/'||d_mute||' as det_pol_down,
';
script:= script || 'exp((abs(cat_det_sentiment-cat_pro_sentiment)-'||u_up_down||')/'||u_damp||')/'||u_mute||' as det_pol_up,
';
script:= script|| 'CASE WHEN(-exp(-abs(cat_det_sentiment-cat_pro_sentiment)*100/'|| d_up_down ||')+1/'||d_mute||' < exp((abs(cat_det_sentiment-cat_pro_sentiment)-'||u_up_down||')/'||u_damp||')/'||u_mute||') THEN (-exp(-abs(cat_det_sentiment-cat_pro_sentiment)*100/'|| d_up_down ||')+1/'||d_mute||') ELSE(exp((abs(cat_det_sentiment-cat_pro_sentiment)-'||u_up_down||')/'||u_damp||')/'||u_mute||') END AS det_FINAL_POLARITY,
';

-- detractor sentiment down

 select num into D_damp from a_cat_meta where calc = 'sentiment' and dir='down' and type ='damp';
 select num into D_up_down from a_cat_meta where calc = 'sentiment' and dir='down' and type ='up/down';
 select num into D_mute from a_cat_meta where calc = 'sentiment' and dir='down' and type ='mute';
 select num into U_damp from a_cat_meta where calc = 'sentiment' and dir='up' and type ='damp';
 select num into U_up_down from a_cat_meta where calc = 'sentiment' and dir='up' and type ='up/down';
 select num into U_mute from a_cat_meta where calc = 'sentiment' and dir='up' and type ='mute';
 select num into temp from a_cat_meta where calc = 'sentiment' and dir='max' and type ='value'; 

script:= script || 'CASE WHEN (10*(-(exp(((cat_det_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||' < 0) THEN (.001) ELSE (10*(-(exp(((cat_det_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||') END as det_sent_down,
';
script:= script || 'EXP((ABS(CAT_DET_SENTIMENT)-('||U_up_down||'))/'||U_damp||')/'||U_mute||' as det_sent_up,
';
script:= script || 'CASE WHEN (CASE WHEN (10*(-(exp(((cat_det_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||' < 0) THEN (.001) ELSE (10*(-(exp(((cat_det_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||') END < EXP((ABS(CAT_DET_SENTIMENT)-('||U_up_down||'))/'||U_damp||')/'||U_mute||')
                    THEN (CASE WHEN (10*(-(exp(((cat_det_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||' < 0) THEN (.001) ELSE (10*(-(exp(((cat_det_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||') END)
                    ELSE(EXP((ABS(CAT_DET_SENTIMENT)-('||U_up_down||'))/'||U_damp||')/'||U_mute||')
                    END  / '||temp||' as det_final_detractor_sentiment,
';
-- finsih

script:= script || '(cat_promoters / cat_detractors ) * (cat_promoters / t_promoters) pro_final_volume,
';
 
 select num into d_damp from a_cat_meta where calc = 'polarity' and dir='down' and type ='damp';
 select num into d_up_down from a_cat_meta where calc = 'polarity' and dir='down' and type ='up/down';
 select num into d_mute from a_cat_meta where calc = 'polarity' and dir='down' and type ='mute';
 select num into u_damp from a_cat_meta where calc = 'polarity' and dir='up' and type ='damp';
 select num into u_up_down from a_cat_meta where calc = 'polarity' and dir='up' and type ='up/down';
 select num into u_mute from a_cat_meta where calc = 'polarity' and dir='up' and type ='mute';
 
 script:= script || '-exp(-abs(cat_pro_sentiment-cat_det_sentiment)*100/'|| d_up_down ||')+1/'||d_mute||' as pro_pol_down,
';
script:= script || 'exp((abs(cat_pro_sentiment-cat_det_sentiment)-'||u_up_down||')/'||u_damp||')/'||u_mute||' as pro_pol_up,
';
script:= script|| 'CASE WHEN(-exp(-abs(cat_pro_sentiment-cat_det_sentiment)*100/'|| d_up_down ||')+1/'||d_mute||' < exp((abs(cat_pro_sentiment-cat_det_sentiment)-'||u_up_down||')/'||u_damp||')/'||u_mute||') THEN (-exp(-abs(cat_pro_sentiment-cat_det_sentiment)*100/'|| d_up_down ||')+1/'||d_mute||') ELSE(exp((abs(cat_pro_sentiment-cat_Det_sentiment)-'||u_up_down||')/'||u_damp||')/'||u_mute||') END AS pro_FINAL_POLARITY,
';

-- detractor sentiment down

 select num into D_damp from a_cat_meta where calc = 'sentiment' and dir='down' and type ='damp';
 select num into D_up_down from a_cat_meta where calc = 'sentiment' and dir='down' and type ='up/down';
 select num into D_mute from a_cat_meta where calc = 'sentiment' and dir='down' and type ='mute';
 select num into U_damp from a_cat_meta where calc = 'sentiment' and dir='up' and type ='damp';
 select num into U_up_down from a_cat_meta where calc = 'sentiment' and dir='up' and type ='up/down';
 select num into U_mute from a_cat_meta where calc = 'sentiment' and dir='up' and type ='mute';
 select num into temp from a_cat_meta where calc = 'sentiment' and dir='max' and type ='value'; 

script:= script || 'CASE WHEN (10*(-(exp(((cat_pro_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||' < 0) THEN (.001) ELSE (10*(-(exp(((cat_pro_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||') END as pro_sent_down,
';
script:= script || 'EXP((ABS(CAT_pro_SENTIMENT)-('||U_up_down||'))/'||U_damp||')/'||U_mute||' as pro_sent_up,
';
script:= script || 'CASE WHEN (CASE WHEN (10*(-(exp(((cat_pro_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||' < 0) THEN (.001) ELSE (10*(-(exp(((cat_pro_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||') END < EXP((ABS(CAT_pro_SENTIMENT)-('||U_up_down||'))/'||U_damp||')/'||U_mute||')
                    THEN (CASE WHEN (10*(-(exp(((cat_pro_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||' < 0) THEN (.001) ELSE (10*(-(exp(((cat_pro_sentiment)-('||D_up_down||'))/'||D_damp||'))+1)/'||D_mute||') END)
                    ELSE(EXP((ABS(CAT_pro_SENTIMENT)-('||U_up_down||'))/'||U_damp||')/'||U_mute||')
                    END  / '||temp||' as pro_final_promoter_sentiment
';
-- finsih 

 
 script:= script ||  ', inf.* from a_cat_inf inf order by node_id desc';
 
 --dbms_output.put_line(damp);
 --dbms_output.put_line(up_down);
 --dbms_output.put_line(mute);
 
 --dbms_output.put_line(script);
 dbms_output.put_line('script');
 execute immediate script;
 
dbms_output.put_line('Calc');
 
 execute immediate 'create table a_cat_inf_final as select det_final_Volume * det_FINAL_POLARITY * det_final_detractor_sentiment as det_cat_inf_score,
                                                           pro_final_volume * pro_final_polarity * pro_final_promoter_sentiment as pro_cat_inf_score, t.* from a_cat_temp t';
 execute immediate 'delete from a_cat_inf_final where node_id in (select parent_id from psv_class_tree)';
 execute immediate 'drop table a_cat_temp purge';
 
 script:= 'create table a_cat_temp as
 select totals.sub_cat_id as CAT_ID,
	totals.sub_cat_en as Category,
	totals.cat_en as l2_Category,
	totals.cat_group_en as Category_Group,
	totals.OSAT,
	totals.Total_Documents,
	detractors.Detractor_Documents,
	promoters.Promoter_Documents,
	neutrals.Neutral_Documents
from 
(
	select t.sub_cat_id, 
		t.sub_cat_en,
		t.cat_en, 
		t.cat_group_en, 
		avg(d.'||osat_col||') as OSAT, 
		count(distinct d.document_id) as Total_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.sub_cat_id
	where d.'||osat_col||' is not null
	and t.model_nm_en = ''Walmart GCIA Model - Survey''
	group by t.sub_cat_en, 
		t.cat_en,
		t.sub_cat_id,
		t.cat_group_en
) totals
join 
(
	select t.sub_cat_id, 
		count(distinct d.document_id) as Promoter_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.sub_cat_id
	where d.'||osat_col||' is not null
	and t.model_nm_en = ''Walmart GCIA Model - Survey''
	and d.'||osat_col||' between 9 and 10
	group by t.sub_cat_id
) promoters
	on totals.sub_cat_id = promoters.sub_cat_id
join
(
	select t.sub_cat_id, 
		count(distinct d.document_id) as Detractor_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.sub_cat_id
	where d.'||osat_col||' is not null
	and t.model_nm_en = ''Walmart GCIA Model - Survey''
	and d.'||osat_col||' between 0 and 6
	group by t.sub_cat_id
) detractors
	on totals.sub_cat_id = detractors.sub_cat_id
join
(
	select t.sub_cat_id, 
		count(distinct d.document_id) as Neutral_Documents
	from psv_document d
	join psv_sentence s 
		on d.document_id = s.document_id
	join psv_sentence_class_xref x 
	  	on s.sentence_id = x.sentence_id
	join psv_category_tree t on x.node_id = t.sub_cat_id
	where d.'||osat_col||' is not null
	and t.model_nm_en = ''Walmart GCIA Model - Survey''
	and d.'||osat_col||' between 7 and 8
	group by t.sub_cat_id
) neutrals
	on totals.sub_cat_id = neutrals.sub_cat_id';
 
 dbms_output.put_line('grahams table');
 execute immediate script;
 
 execute immediate 'create table a_cat_extract as select t.*, i.det_cat_inf_score, i.pro_cat_inf_score from a_cat_temp t join a_cat_inf_final i on t.cat_id = i.node_id';
 
 dbms_output.put_line('Done');

end;