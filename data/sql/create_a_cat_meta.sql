create table a_cat_meta (
	calc varchar2(100 byte),
	dir varchar2(100 byte),
	type varchar2(100 byte),
	num number
);

insert into a_cat_meta values ('polarity','up','up/down',1) ;
insert into a_cat_meta values ('polarity','up','damp',0.22) ;
insert into a_cat_meta values ('polarity','up','mute',1) ;
insert into a_cat_meta values ('polarity','down','up/down',75) ;
insert into a_cat_meta values ('polarity','down','damp',1) ;
insert into a_cat_meta values ('polarity','down','mute',1) ;
insert into a_cat_meta values ('sentiment','up','up/down',0.75) ;
insert into a_cat_meta values ('sentiment','up','damp',0.22) ;
insert into a_cat_meta values ('sentiment','up','mute',2) ;
insert into a_cat_meta values ('sentiment','down','up/down',-0.2) ;
insert into a_cat_meta values ('sentiment','down','damp',2) ;
insert into a_cat_meta values ('sentiment','down','mute',3) ;
insert into a_cat_meta values ('volume',null,'curve',2) ;
insert into a_cat_meta values ('volume',null,'mute',1) ;
insert into a_cat_meta values ('sentiment','max','value',3.0309) ;

commit;