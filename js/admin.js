// 后台全功能控制脚本 (精确分类递增 ID + 规格强兼容保存 + 本地图片压缩上传)

document.addEventListener("DOMContentLoaded", () => {
  loadAdminProducts();
  loadSiteSettings();

  // 页面初始化时根据数据库现有数据生成递增 ID
  generateSmartId();

  const categorySelect = document.getElementById("prod-category");
  const nailSection = document.getElementById("nail-options-section");
  const imageInput = document.getElementById("prod-image-file");

  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      if (nailSection) {
        nailSection.style.display = e.target.value === "nails" ? "block" : "none";
      }
      generateSmartId(); // 切换分类时重新实时生成递增 ID
    });
  }

  if (imageInput) {
    imageInput.addEventListener("change", handleImagePreview);
  }

  const addForm = document.getElementById("add-product-form");
  if (addForm) {
    addForm.addEventListener("submit", handleAddProduct);
  }

  const settingsForm = document.getElementById("site-settings-form");
  if (settingsForm) {
    settingsForm.addEventListener("submit", handleSaveSettings);
  }
});

// 1. 生成体现“分类数量”与“商品总数”的递增 ID (如 nail-04-06)
async function generateSmartId() {
  const categorySelect = document.getElementById("prod-category");
  const category = categorySelect ? categorySelect.value : "nails";
  const idInput = document.getElementById("prod-id");
  if (!idInput) return;

  try {
    // 从 Supabase 查询全站商品
    const { data: allProducts } = await supabaseClient
      .from("products")
      .select("id, category_id");

    const totalCount = (allProducts ? allProducts.length : 0) + 1; // 全站总数 + 1
    const categoryProducts = allProducts ? allProducts.filter(p => p.category_id === category) : [];
    const categoryCount = categoryProducts.length + 1; // 该分类总数 + 1

    let prefix = "nail";
    if (category === "merch") {
      prefix = "merch";
    } else if (category === "furniture") {
      prefix = "ant";
    }

    // 格式: 分类前缀-分类序号-全站序号 (如 nail-04-06)
    const catSeq = String(categoryCount).padStart(2, '0');
    const totalSeq = String(totalCount).padStart(2, '0');

    idInput.value = `${prefix}-${catSeq}-${totalSeq}`;

  } catch (err) {
    console.error("生成 ID 失败，使用基础序列:", err);
    idInput.value = `${category}-01-01`;
  }
}

// 2. 加载在线商品列表
async function loadAdminProducts() {
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;

  try {
    const { data: products, error } = await supabaseClient
      .from("products")
      .select("*, nail_options (*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!products || products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">数据库中暂无商品。</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(item => {
      const nailOpt = (item.nail_options && item.nail_options.length > 0) ? item.nail_options[0] : {};

      let shapesArr = [];
      let sizesArr = [];

      if (nailOpt.shapes) {
        shapesArr = typeof nailOpt.shapes === 'string' ? JSON.parse(nailOpt.shapes) : nailOpt.shapes;
      }
      if (nailOpt.sizes) {
        sizesArr = typeof nailOpt.sizes === 'string' ? JSON.parse(nailOpt.sizes) : nailOpt.sizes;
      }

      const shapesText = shapesArr.length > 0 ? shapesArr.join(", ") : "-";
      const sizesText = sizesArr.length > 0 ? sizesArr.join(", ") : "-";

      const specContent = item.category_id === 'nails'
        ? `<div><b>Shapes:</b> ${shapesText}</div><div><b>Sizes:</b> ${sizesText}</div>`
        : '无';

      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3">
            <img src="${item.spin_image || 'https://via.placeholder.com/60'}" class="w-12 h-12 object-cover rounded-lg border" alt="">
          </td>
          <td class="p-3 font-mono text-xs text-amber-900 font-bold">${item.id}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">${item.category_id}</span></td>
          <td class="p-3 font-medium text-gray-900">${item.title_en}</td>
          <td class="p-3 text-xs text-gray-500">${specContent}</td>
          <td class="p-3 text-amber-800 font-bold">$${parseFloat(item.price).toFixed(2)}</td>
          <td class="p-3">
            <button onclick="deleteProduct('${item.id}')" class="text-red-600 hover:text-red-800 text-xs font-semibold">删除</button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("加载商品失败:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">加载列表失败。</td></tr>`;
  }
}

// 3. 发布商品逻辑（高可靠性保存规格）
async function handleAddProduct(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "正在发布商品...";
  }

  try {
    const id = document.getElementById("prod-id").value;
    const categoryId = document.getElementById("prod-category").value;
    const titleEn = document.getElementById("prod-title-en").value.trim();
    const subtitleEn = document.getElementById("prod-subtitle-en").value.trim();
    const price = parseFloat(document.getElementById("prod-price").value);
    const tagKey = document.getElementById("prod-tag-key").value.trim() || "New";
    const fileInput = document.getElementById("prod-image-file");

    let imageUrl = "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800";

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const compressedBlob = await compressImage(fileInput.files[0]);
      const fileName = `${Date.now()}_${id}.jpg`;

      const { error: uploadError } = await supabaseClient.storage
        .from("product-media")
        .upload(fileName, compressedBlob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw new Error("图片上传失败: " + uploadError.message);

      const { data: publicUrlData } = supabaseClient.storage.from("product-media").getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    // 写入 products 主表
    const { error: prodError } = await supabaseClient.from("products").insert([{
      id: id,
      category_id: categoryId,
      title_en: titleEn,
      subtitle_en: subtitleEn,
      price: price,
      tag_key: tagKey,
      tag_class: "bg-amber-800 text-white",
      spin_image: imageUrl
    }]);

    if (prodError) throw prodError;

    // 如果是穿戴甲，写入 nail_options 表（确保格式为完整可转换的 JSONB）
    if (categoryId === "nails") {
      const selectedShapes = Array.from(document.querySelectorAll(".shape-checkbox:checked")).map(cb => cb.value);
      const selectedSizes = Array.from(document.querySelectorAll(".size-checkbox:checked")).map(cb => cb.value);

      const { error: optionError } = await supabaseClient.from("nail_options").insert([{
        product_id: id,
        shapes: selectedShapes.length > 0 ? selectedShapes : ["Almond", "Coffin"],
        sizes: selectedSizes.length > 0 ? selectedSizes : ["XS", "S", "M", "L"]
      }]);

      if (optionError) console.error("规格保存警告:", optionError);
    }

    alert("🎉 商品发布成功！唯一编码: " + id);
    document.getElementById("add-product-form").reset();
    const previewContainer = document.getElementById("image-preview-container");
    if (previewContainer) previewContainer.classList.add("hidden");

    await generateSmartId();
    await loadAdminProducts();

  } catch (err) {
    console.error("发布失败:", err);
    alert("操作失败: " + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "保存并发布商品";
    }
  }
}

// 4. 图片压缩与预览
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 800, 800);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    };
  });
}

function handleImagePreview(e) {
  const file = e.target.files[0];
  const previewImg = document.getElementById("image-preview");
  const previewContainer = document.getElementById("image-preview-container");

  if (file && previewImg && previewContainer) {
    previewImg.src = URL.createObjectURL(file);
    previewContainer.classList.remove("hidden");
  }
}

async function deleteProduct(productId) {
  if (!confirm(`确定要删除商品 "${productId}" 吗？`)) return;
  await supabaseClient.from("products").delete().eq("id", productId);
  loadAdminProducts();
  generateSmartId();
}

// 5. 站点配置保存与加载
function loadSiteSettings() {
  const cfg = JSON.parse(localStorage.getItem("site_settings") || "{}");
  if (cfg.logo && document.getElementById("cfg-site-logo")) {
    document.getElementById("cfg-site-logo").value = cfg.logo;
  }
  if (cfg.banner && document.getElementById("cfg-banner-text")) {
    document.getElementById("cfg-banner-text").value = cfg.banner;
  }
  if (cfg.heroTitle && document.getElementById("cfg-hero-title")) {
    document.getElementById("cfg-hero-title").value = cfg.heroTitle;
  }
  if (cfg.heroDesc && document.getElementById("cfg-hero-desc")) {
    document.getElementById("cfg-hero-desc").value = cfg.heroDesc;
  }
}

function handleSaveSettings(e) {
  e.preventDefault();
  const cfg = {
    logo: document.getElementById("cfg-site-logo") ? document.getElementById("cfg-site-logo").value : "",
    banner: document.getElementById("cfg-banner-text") ? document.getElementById("cfg-banner-text").value : "",
    heroTitle: document.getElementById("cfg-hero-title") ? document.getElementById("cfg-hero-title").value : "",
    heroDesc: document.getElementById("cfg-hero-desc") ? document.getElementById("cfg-hero-desc").value : "",
  };
  localStorage.setItem("site_settings", JSON.stringify(cfg));
  alert("✨ 站点文案与配置已保存，刷新前台网页即可生效！");
}