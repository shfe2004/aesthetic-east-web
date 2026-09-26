-- 在 Supabase 的 SQL Editor 里运行一次即可
-- 给 nail_options 表加一列，存每个穿戴甲商品自定义的尺码对照表（JSON，可为空）
-- 结构示例：{"XS": {"thumb": 12, "index": 10, ...}, "S": {...}, "M": {...}, "L": {...}}
-- 某个尺码/某根手指没填时，前台会自动用行业标准值兜底显示。

alter table nail_options
  add column if not exists size_chart jsonb;
