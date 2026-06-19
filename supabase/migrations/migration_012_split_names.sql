alter table artists rename column name to display_name;
alter table artists add column if not exists legal_name text;
update artists set legal_name = display_name where legal_name is null;
alter table artists alter column legal_name set not null;

alter table profiles rename column full_name to display_name;
alter table profiles add column if not exists legal_name text;
update profiles set legal_name = display_name where legal_name is null;
alter table profiles alter column legal_name set not null;
