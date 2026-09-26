-- 在 Supabase 的 SQL Editor 里运行一次即可。
-- 如果某一步报错说"already exists"（已存在），说明这部分之前跑过了，跳过继续往下执行就行。

-- ============================================================
-- 1. 订单表：模拟结算成功后，把订单和收货信息落库，方便后台管理查看。
--    当前网站还没接入真实支付，status 统一记为 pending_test_payment，
--    等接入 Stripe/PayPal 之后，再由真实支付回调更新这个字段。
-- ============================================================
create table if not exists orders (
  id text primary key,
  created_at timestamptz default now(),
  status text default 'pending_test_payment',
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  subtotal numeric default 0,
  tax numeric default 0,
  total numeric default 0
);

alter table orders enable row level security;

create policy "orders_public_insert" on orders for insert with check (true);
create policy "orders_public_read" on orders for select using (true);
-- 注意：这里的读写权限和网站其他表一样是完全开放的（临时方案，配合后台密码墙）。
-- 等接上 Supabase Auth 真实登录后，应该把 orders_public_read 收紧成只允许登录用户读取，
-- 只保留 orders_public_insert 给顾客下单用。

-- ============================================================
-- 2. 订单明细表：每个订单里买了哪些商品、数量、单价、选的甲型/尺码。
--    价格和标题在下单时做一份快照，即使以后商品改名或调价，历史订单也不会跟着变。
-- ============================================================
create table if not exists order_items (
  id bigserial primary key,
  order_id text references orders(id) on delete cascade,
  product_id text,
  title text,
  unit_price numeric default 0,
  qty integer default 1,
  variant_shape text,
  variant_size text
);

alter table order_items enable row level security;

create policy "order_items_public_insert" on order_items for insert with check (true);
create policy "order_items_public_read" on order_items for select using (true);

-- ============================================================
-- 3. 商品图片表：之前前台代码已经会去读这张表做多图画廊，但后台从来没往里写过数据。
--    如果这张表在你的项目里已经存在（大概率存在），下面这句会被跳过，不会破坏已有数据。
-- ============================================================
create table if not exists product_images (
  id bigserial primary key,
  product_id text references products(id) on delete cascade,
  image_url text not null,
  display_order integer default 0
);

alter table product_images enable row level security;

create policy "product_images_public_read" on product_images for select using (true);
create policy "product_images_public_write" on product_images for all using (true) with check (true);
