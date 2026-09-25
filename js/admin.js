// 后台全功能控制脚本 (包含规格强校验与已发布商品规格快捷修改)

document.addEventListener("DOMContentLoaded", () => {
  loadAdminProducts();
  loadSiteSettings();
  generateSmartId();

  const categorySelect = document.getElementById("prod-category");
  const nailSection = document.getElementById("nail-options-section");
  const imageInput = document.getElementById("prod-image-file");

  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      if (nailSection) {
        nailSection.style.display = e.target.value === "nails" ? "block" : "none";
      }
      generateSmartId();
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

// 1. 生成递增 ID
async function generateSmartId() {
  const categorySelect = document.getElementById("prod-category");
  const category = categorySelect ? categorySelect.value : "nails";
  const idInput = document.getElementById("prod-id");
  if (!idInput) return;

  try {
    const { data: allProducts } = await supabaseClient
      .from("products")
      .select("id, category_id");

    const totalCount = (allProducts ? allProducts.length : 0) + 1;
    const categoryProducts = allProducts ? allProducts.filter(p => p.category_id === category) : [];
    const categoryCount = categoryProducts.length + 1;

    let prefix = "nail";
    if (category === "merch") prefix = "merch";
    if (category === "furniture") prefix = "ant";

    const catSeq = String(categoryCount).padStart(2, '0');
    const totalSeq = String(totalCount).padStart(2, '0');

    idInput.value = `${prefix}-${catSeq}-${totalSeq}`;

  } catch (err) {
    idInput.value = `${category}-01-01`;
  }
}

// 2. 加载商品列表（含规格修改按钮）
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

      let shapesArr = robustParseSpec(nailOpt.shapes);
      let sizesArr = robustParseSpec(nailOpt.sizes);

      const shapesText = (shapesArr && shapesArr.length > 0) ? shapesArr.join(", ") : "<span class='text-red-400'>未设置</span>";
      const sizesText = (sizesArr && sizesArr.length > 0) ? sizesArr.join(", ") : "<span class='text-red-400'>未设置</span>";

      const specContent = item.category_id === 'nails'
        ? `<div class="space-y-1">
             <div><b>Shapes:</b> ${shapesText}</div>
             <div><b>Sizes:</b> ${sizesText}</div>
             <button onclick="openEditSpecModal('${item.id}', '${encodeURIComponent(JSON.stringify(shapesArr))}', '${encodeURIComponent(JSON.stringify(sizesArr))}')" class="mt-1 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[11px] font-bold border border-amber-300">
               <i class="fa-solid fa-pen-to-square"></i> 修改规格
             </button>
           </div>`
        : '无';

      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3">
            <img src="${item.spin_image || 'https://via.placeholder.com/60'}" class="w-12 h-12 object-cover rounded-lg border" alt="">
          </td>
          <td class="p-3 font-mono text-xs text-amber-900 font-bold">${item.id}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">${item.category_id}</span></td>
          <td class="p-3 font-medium text-gray-900">${item.title_en}</td>
          <td class="p-3 text-xs text-gray-600">${specContent}</td>
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

function robustParseSpec(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch(e){}
    if (input.includes(',')) return input.split(',').map(s=>s.trim());
    return [input];
  }
  return [];
}

// 3. 发布商品逻辑（严格校验）
async function handleAddProduct(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-btn");

  try {
    const id = document.getElementById("prod-id").value;
    const categoryId = document.getElementById("prod-category").value;
    const titleEn = document.getElementById("prod-title-en").value.trim();
    const subtitleEn = document.getElementById("prod-subtitle-en").value.trim();
    const price = parseFloat(document.getElementById("prod-price").value);
    const tagKey = document.getElementById("prod-tag-key").value.trim() || "New";
    const fileInput = document.getElementById("prod-image-file");

    let selectedShapes = [];
    let selectedSizes = [];

    if (categoryId === "nails") {
      selectedShapes = Array.from(document.querySelectorAll(".shape-checkbox:checked")).map(cb => cb.value);
      selectedSizes = Array.from(document.querySelectorAll(".size-checkbox:checked")).map(cb => cb.value);

      if (selectedShapes.length === 0) {
        alert("⚠️ 请至少勾选 1 个甲型 (Shape)！");
        return;
      }
      if (selectedSizes.length === 0) {
        alert("⚠️ 请至少勾选 1 个尺寸 (Size)！");
        return;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "正在发布商品...";
    }

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

    if (categoryId === "nails") {
      await supabaseClient.from("nail_options").insert([{
        product_id: id,
        shapes: selectedShapes,
        sizes: selectedSizes
      }]);
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

// 4. 修改已有商品的规格（快捷更新引擎）
let currentEditingProdId = null;

function openEditSpecModal(prodId, shapesJsonEncoded, sizesJsonEncoded) {
  currentEditingProdId = prodId;
  const shapes = JSON.parse(decodeURIComponent(shapesJsonEncoded));
  const sizes = JSON.parse(decodeURIComponent(sizesJsonEncoded));

  let modal = document.getElementById("modal-edit-spec");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-edit-spec";
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-base font-bold text-gray-900">修改规格 - <span id="edit-spec-prod-id" class="text-amber-800 font-mono"></span></h3>
          <button onclick="closeEditSpecModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Shapes (勾选可用甲型):</label>
            <div class="flex flex-wrap gap-3" id="edit-shapes-container">
              ${["Almond", "Coffin", "Stiletto", "Square"].map(s => `
                <label class="inline-flex items-center gap-1.5 text-xs text-gray-800 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border hover:bg-gray-100">
                  <input type="checkbox" value="${s}" class="edit-shape-cb rounded text-amber-800 focus:ring-amber-800">
                  <span>${s}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Sizes (勾选可用尺寸):</label>
            <div class="flex flex-wrap gap-3" id="edit-sizes-container">
              ${["XS", "S", "M", "L"].map(sz => `
                <label class="inline-flex items-center gap-1.5 text-xs text-gray-800 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border hover:bg-gray-100">
                  <input type="checkbox" value="${sz}" class="edit-size-cb rounded text-amber-800 focus:ring-amber-800">
                  <span>${sz}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t">
          <button onclick="closeEditSpecModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">取消</button>
          <button onclick="saveProductSpec()" class="px-5 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-sm">保存修改</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("edit-spec-prod-id").innerText = prodId;

  document.querySelectorAll(".edit-shape-cb").forEach(cb => {
    cb.checked = shapes.includes(cb.value);
  });
  document.querySelectorAll(".edit-size-cb").forEach(cb => {
    cb.checked = sizes.includes(cb.value);
  });

  modal.classList.remove("hidden");
}

function closeEditSpecModal() {
  document.getElementById("modal-edit-spec")?.classList.add("hidden");
}

async function saveProductSpec() {
  if (!currentEditingProdId) return;

  const newShapes = Array.from(document.querySelectorAll(".edit-shape-cb:checked")).map(cb => cb.value);
  const newSizes = Array.from(document.querySelectorAll(".edit-size-cb:checked")).map(cb => cb.value);

  if (newShapes.length === 0 || newSizes.length === 0) {
    alert("⚠️ 必须勾选至少 1 个甲型和 1 个尺寸！");
    return;
  }

  try {
    // 1. 删除旧规格
    await supabaseClient.from("nail_options").delete().eq("product_id", currentEditingProdId);

    // 2. 插入新规格
    const { error } = await supabaseClient.from("nail_options").insert([{
      product_id: currentEditingProdId,
      shapes: newShapes,
      sizes: newSizes
    }]);

    if (error) throw error;

    alert("✨ 规格修改成功！前台将即刻更新生效。");
    closeEditSpecModal();
    loadAdminProducts();

  } catch(err) {
    alert("更新失败: " + err.message);
  }
}

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
  alert("✨ 站点文案已保存，刷新前台即可生效！");
}