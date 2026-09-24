// 后台管理面板逻辑

// 1. 挂载页面加载事件
document.addEventListener("DOMContentLoaded", () => {
  loadAdminProducts();

  const form = document.getElementById("add-product-form");
  if (form) {
    form.addEventListener("submit", handleAddProduct);
  }
});

// 2. 从 Supabase 加载所有商品列表
async function loadAdminProducts() {
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;

  try {
    const { data: products, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!products || products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">数据库中暂无商品。</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(item => `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-3 border-r">
          <img src="${item.spin_image || 'https://via.placeholder.com/50'}" class="w-12 h-12 object-cover rounded" alt="">
        </td>
        <td class="p-3 border-r font-mono text-xs">${item.id}</td>
        <td class="p-3 border-r">${item.category_id}</td>
        <td class="p-3 border-r font-medium">${item.title_en}</td>
        <td class="p-3 border-r text-amber-800 font-semibold">$${item.price.toFixed(2)}</td>
        <td class="p-3">
          <button onclick="deleteProduct('${item.id}')" class="text-red-600 hover:text-red-800 text-xs font-semibold">
            删除
          </button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("加载后台商品失败:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">加载失败，请检查网络或配置。</td></tr>`;
  }
}

// 3. 处理提交表单（添加新商品）
async function handleAddProduct(e) {
  e.preventDefault();

  const newProduct = {
    id: document.getElementById("prod-id").value.trim(),
    category_id: document.getElementById("prod-category").value,
    title_en: document.getElementById("prod-title-en").value.trim(),
    subtitle_en: document.getElementById("prod-subtitle-en").value.trim(),
    price: parseFloat(document.getElementById("prod-price").value),
    tag_key: document.getElementById("prod-tag-key").value.trim() || "New",
    tag_class: "bg-amber-800 text-white",
    spin_image: document.getElementById("prod-spin-image").value.trim()
  };

  try {
    // 写入 Supabase products 表
    const { error } = await supabaseClient
      .from("products")
      .insert([newProduct]);

    if (error) throw error;

    // 同时添加一张关联的产品图
    await supabaseClient
      .from("product_images")
      .insert([{
        product_id: newProduct.id,
        image_url: newProduct.spin_image,
        display_order: 1
      }]);

    alert("🎉 商品添加成功！");
    document.getElementById("add-product-form").reset();
    loadAdminProducts(); // 刷新后台列表

  } catch (err) {
    console.error("添加商品失败:", err);
    alert("添加失败: " + err.message);
  }
}

// 4. 删除商品
async function deleteProduct(productId) {
  if (!confirm(`确定要删除商品 "${productId}" 吗？此操作不可撤销。`)) return;

  try {
    const { error } = await supabaseClient
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) throw error;

    alert("已成功删除商品");
    loadAdminProducts(); // 刷新列表
  } catch (err) {
    console.error("删除商品失败:", err);
    alert("删除失败: " + err.message);
  }
}