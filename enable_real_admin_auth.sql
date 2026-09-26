-- ============================================================
-- 后台改用 Supabase Auth 真实登录之后，必须配套把数据库权限收紧，
-- 不然"密码墙"只是前端 UI 好看，anon key 本来就是公开在浏览器里的，
-- 之前所有表的读写策略都是 using (true) —— 也就是说，不管有没有登录框，
-- 任何人打开浏览器控制台，直接用你网站公开的 anon key 调 supabase-js，
-- 都能改商品、改站点文案、甚至看到所有顾客订单。这个文件就是来堵上这个口子的。
--
-- 在 Supabase 的 SQL Editor 里运行一次即可。可以整个文件一次性执行。
-- ============================================================

-- 第 1 步：把 products / nail_options / product_images / site_settings / orders / order_items
-- 这几张表上「所有」已存在的策略先清空，不管它们叫什么名字（有些是你早期手动建表时起的名字，
-- 我这边不知道具体叫什么，所以用下面这段动态 SQL 统一清掉，避免有漏网之鱼继续允许匿名写入）。
do $$
declare
  pol record;
  tbl text;
begin
  foreach tbl in array array['products', 'nail_options', 'product_images', 'site_settings', 'orders', 'order_items']
  loop
    for pol in select policyname from pg_policies where tablename = tbl loop
      execute format('drop policy %I on %I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

-- 第 2 步：确保这几张表都开启了行级安全（RLS），没开的话下面的策略根本不会生效。
alter table products enable row level security;
alter table nail_options enable row level security;
alter table product_images enable row level security;
alter table site_settings enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- ============================================================
-- 第 3 步：重新建立策略。原则：
--   - 前台顾客浏览需要的数据（商品、规格、图片、站点文案）保持公开只读；
--   - 所有"写"操作（新增/修改/删除商品、改站点配置）只允许登录后的管理员账号；
--   - 订单：顾客下单是匿名的，所以允许匿名"插入"订单，但只有登录的管理员能"查看"订单列表
--     （订单里有顾客姓名、地址、电话，不应该谁都能读）。
-- ============================================================

-- --- products：商品主表 ---
create policy "products_public_read" on products
  for select using (true);
create policy "products_admin_write" on products
  for insert with check (auth.role() = 'authenticated');
create policy "products_admin_update" on products
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "products_admin_delete" on products
  for delete using (auth.role() = 'authenticated');

-- --- nail_options：穿戴甲甲型/尺码/尺码对照表 ---
create policy "nail_options_public_read" on nail_options
  for select using (true);
create policy "nail_options_admin_write" on nail_options
  for insert with check (auth.role() = 'authenticated');
create policy "nail_options_admin_update" on nail_options
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "nail_options_admin_delete" on nail_options
  for delete using (auth.role() = 'authenticated');

-- --- product_images：商品画廊图片 ---
create policy "product_images_public_read" on product_images
  for select using (true);
create policy "product_images_admin_write" on product_images
  for insert with check (auth.role() = 'authenticated');
create policy "product_images_admin_update" on product_images
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "product_images_admin_delete" on product_images
  for delete using (auth.role() = 'authenticated');

-- --- site_settings：Logo / 横幅 / Hero 文案配置（单行 id=1） ---
create policy "site_settings_public_read" on site_settings
  for select using (true);
create policy "site_settings_admin_write" on site_settings
  for insert with check (auth.role() = 'authenticated');
create policy "site_settings_admin_update" on site_settings
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- --- orders：顾客下单信息 ---
-- 允许任何人（未登录的顾客）下单时插入订单，但只有登录的管理员能看订单列表
create policy "orders_public_insert" on orders
  for insert with check (true);
create policy "orders_admin_read" on orders
  for select using (auth.role() = 'authenticated');

-- --- order_items：订单里的商品明细 ---
create policy "order_items_public_insert" on order_items
  for insert with check (true);
create policy "order_items_admin_read" on order_items
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- 做完以上这些之后，还有两件事必须去 Supabase 后台的网页界面上手动做（不能用 SQL 做）：
--
-- 1. 创建管理员账号：
--    Authentication -> Users -> Add user -> 手动输入你自己的邮箱和一个强密码 -> 直接创建
--    （注意要用 "Add user" 手动建，不要用注册流程，这样建的账号不需要邮箱验证，建完就能登录）
--
-- 2. 关掉公开注册（非常重要，不做这一步等于白做）：
--    Authentication -> Providers -> Email -> 找到 "Allow new users to sign up" 关掉
--    原因：这个网站的 anon key 是写在前端代码里公开的，如果不关掉公开注册，
--    任何人都可以在浏览器控制台自己调 supabaseClient.auth.signUp() 注册一个新账号，
--    然后直接登录你的后台——因为这里的策略只看"是不是登录用户"，不看是哪个账号。
-- ============================================================
