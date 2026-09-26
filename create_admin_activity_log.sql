-- 在 Supabase 的 SQL Editor 里运行一次即可。
--
-- 这张表用来记录后台的登录和关键操作（新增/编辑/删除商品、改站点配置等），
-- 永久保存在你自己的数据库里，不受 Supabase 自带 Auth Logs 的保留期限制
-- （免费版通常只保留 1 天左右）。后台新增了一个"操作日志"板块可以查看，
-- 并且能一键导出成 CSV 下载到本地，方便你自己留一份备份。
--
-- 注意：这不是要替代 Supabase 自带的 Auth Logs——那边记录的是更底层的登录
-- 成功/失败尝试（包括密码输错的情况），这张表记录的是"登录成功之后，
-- 这个账号做了什么"，两者互补。

create table if not exists admin_activity_log (
  id bigserial primary key,
  created_at timestamptz default now(),
  actor_email text,
  event_type text not null,
  detail text
);

alter table admin_activity_log enable row level security;

-- 和其它后台管理表一样，只有登录用户能读写；未登录的人（包括拿着公开 anon key 的人）
-- 既看不到日志，也没法伪造/污染日志记录。
create policy "admin_activity_log_authenticated_read" on admin_activity_log
  for select using (auth.role() = 'authenticated');
create policy "admin_activity_log_authenticated_write" on admin_activity_log
  for insert with check (auth.role() = 'authenticated');
