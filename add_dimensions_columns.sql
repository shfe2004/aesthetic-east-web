-- 在 Supabase 的 SQL Editor 里运行一次即可
-- 给 products 表补上长/宽/高三个字段（毫米，数值类型），
-- 如果这三列已经存在，这条语句不会报错也不会破坏已有数据。

alter table products
  add column if not exists length double precision default 0,
  add column if not exists width  double precision default 0,
  add column if not exists height double precision default 0;
