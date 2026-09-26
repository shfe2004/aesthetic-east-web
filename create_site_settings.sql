-- 在 Supabase 的 SQL Editor 里运行一次即可
-- 1. 建表：站点全局配置，只有一行数据 (id 固定为 1)
create table if not exists site_settings (
  id smallint primary key default 1 check (id = 1),
  logo text,
  banner text,
  hero_title text,
  hero_desc text,
  hero_bg text,
  updated_at timestamptz default now()
);

-- 2. 预先插入这一行，后台第一次保存时用 upsert 更新它
insert into site_settings (id) values (1)
on conflict (id) do nothing;

-- 3. 开启行级安全策略 (RLS)
alter table site_settings enable row level security;

-- 4. 允许所有人（包括未登录的顾客浏览器）读取，前台展示需要
create policy "site_settings_public_read"
  on site_settings for select
  using (true);

-- 5. 允许写入（新增/更新）——注意：这一步和你现在 products 表的策略一样宽松，
--    只要拿到 anon key 就能改。等接入 Supabase Auth 登录后，
--    应该把这里改成 "using (auth.role() = 'authenticated')"，
--    并只让登录用户能读写后台数据。
create policy "site_settings_anon_write"
  on site_settings for all
  using (true)
  with check (true);
