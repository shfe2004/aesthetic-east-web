// 后台控制脚本 (采用标准先更新后插入逻辑，杜绝一切数据库约束报错)

document.addEventListener("DOMContentLoaded", () => {
  loadAdminProducts();
  loadSiteSettings();
  generateSmartId();

  const categorySelect = document.getElementById("prod-category");
  const nailSection = document.getElementById("nail-options-section");
  const dimensionsSection = document.getElementById("dimensions-section");
  const imageInput = document.getElementById("prod-image-file");
  const heroBgInput = document.getElementById("cfg-hero-bg-file");

  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      const isNails = e.target.value === "nails";
      if (nailSection) {
        nailSection.style.display = isNails ? "block" : "none";
      }
      if (dimensionsSection) {
        dimensionsSection.style.display = isNails ? "none" : "block";
      }
      generateSmartId();
    });
  }

  if (imageInput) {
    imageInput.addEventListener("change", handleImagePreview);
  }

  if (heroBgInput) {
    heroBgInput.addEventListener("change", handleHeroBgPreview);
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

// 毫米(mm) -> 英寸(in) 实时换算预览，输入长/宽/高时触发
function syncInches() {
  const l = parseFloat(document.getElementById("prod-length")?.value) || 0;
  const w = parseFloat(document.getElementById("prod-width")?.value) || 0;
  const h = parseFloat(document.getElementById("prod-height")?.value) || 0;
  const lEl = document.getElementById("length-inch");
  const wEl = document.getElementById("width-inch");
  const hEl = document.getElementById("height-inch");
  if (lEl) lEl.innerText = (l / 25.4).toFixed(2);
  if (wEl) wEl.innerText = (w / 25.4).toFixed(2);
  if (hEl) hEl.innerText = (h / 25.4).toFixed(2);
}

// 从一批 .size-chart-input 输入框里收集非空的自定义尺码值，
// 组装成 { XS: { thumb: 12.5, ... }, S: {...} } 这样的结构；留空的格子不会出现在结果里，
// 前台会针对缺失的尺码/手指自动用行业标准值兜底。
function collectSizeChartInputs(scopeSelector) {
  const inputs = document.querySelectorAll(scopeSelector);
  const chart = {};
  inputs.forEach(inp => {
    const val = inp.value.trim();
    if (val === '') return;
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const size = inp.dataset.size;
    const finger = inp.dataset.finger;
    if (!size || !finger) return;
    if (!chart[size]) chart[size] = {};
    chart[size][finger] = num;
  });
  return chart;
}

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
      let sizeChartObj = robustParseSizeChart(nailOpt.size_chart);

      const shapesText = (shapesArr && shapesArr.length > 0) ? shapesArr.join(", ") : "<span class='text-red-500 font-bold'>未设置规格</span>";
      const sizesText = (sizesArr && sizesArr.length > 0) ? sizesArr.join(", ") : "<span class='text-red-500 font-bold'>未设置规格</span>";
      const hasCustomSizeChart = Object.keys(sizeChartObj).length > 0;

      const specContent = item.category_id === 'nails'
        ? `<div class="space-y-1">
             <div><b>Shapes:</b> ${shapesText}</div>
             <div><b>Sizes:</b> ${sizesText}</div>
             <div class="text-[11px] ${hasCustomSizeChart ? 'text-amber-700 font-semibold' : 'text-gray-400'}">${hasCustomSizeChart ? '含自定义尺码对照表' : '尺码对照表：使用行业标准'}</div>
             <button onclick="openEditSpecModal('${item.id}', '${encodeURIComponent(JSON.stringify(shapesArr))}', '${encodeURIComponent(JSON.stringify(sizesArr))}', '${encodeURIComponent(JSON.stringify(sizeChartObj))}')" class="mt-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-bold border border-amber-300 shadow-sm">
               <i class="fa-solid fa-pen-to-square"></i> 修改规格
             </button>
           </div>`
        : (() => {
            const l = parseFloat(item.length || 0);
            const w = parseFloat(item.width || 0);
            const h = parseFloat(item.height || 0);
            const hasDim = l > 0 || w > 0 || h > 0;
            const dimText = hasDim
              ? `${l} × ${w} × ${h} mm`
              : `<span class='text-red-500 font-bold'>未设置尺寸</span>`;
            return `<div class="space-y-1">
                 <div><b>L×W×H:</b> ${dimText}</div>
                 <button onclick="openEditDimensionsModal('${item.id}', ${l}, ${w}, ${h})" class="mt-1 px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs font-bold border border-blue-300 shadow-sm">
                   <i class="fa-solid fa-ruler-combined"></i> 修改尺寸
                 </button>
               </div>`;
          })();

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

function robustParseSizeChart(input) {
  if (!input) return {};
  if (typeof input === 'object') return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  }
  return {};
}

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

    // 立牌 / 古董家具的物理尺寸（穿戴甲不需要，留 0 即可）
    const length = parseFloat(document.getElementById("prod-length")?.value) || 0;
    const width = parseFloat(document.getElementById("prod-width")?.value) || 0;
    const height = parseFloat(document.getElementById("prod-height")?.value) || 0;

    let selectedShapes = [];
    let selectedSizes = [];
    let sizeChart = {};

    if (categoryId === "nails") {
      selectedShapes = Array.from(document.querySelectorAll(".shape-checkbox:checked")).map(cb => cb.value);
      selectedSizes = Array.from(document.querySelectorAll(".size-checkbox:checked")).map(cb => cb.value);
      sizeChart = collectSizeChartInputs("#nail-options-section .size-chart-input");

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
      spin_image: imageUrl,
      length: length,
      width: width,
      height: height
    }]);

    if (prodError) throw prodError;

    if (categoryId === "nails") {
      await supabaseClient.from("nail_options").insert([{
        product_id: id,
        shapes: selectedShapes,
        sizes: selectedSizes,
        size_chart: Object.keys(sizeChart).length > 0 ? sizeChart : null
      }]);
    }

    alert("🎉 商品发布成功！唯一编码: " + id);
    document.getElementById("add-product-form").reset();
    syncInches();
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

// 规格修改弹窗与安全更新逻辑
let currentEditingProdId = null;

function openEditSpecModal(prodId, shapesJsonEncoded, sizesJsonEncoded, sizeChartJsonEncoded) {
  currentEditingProdId = prodId;
  const shapes = JSON.parse(decodeURIComponent(shapesJsonEncoded));
  const sizes = JSON.parse(decodeURIComponent(sizesJsonEncoded));
  const sizeChart = sizeChartJsonEncoded ? JSON.parse(decodeURIComponent(sizeChartJsonEncoded)) : {};

  const SIZE_CHART_FINGERS = [
    { key: 'thumb', label: '拇指' },
    { key: 'index', label: '食指' },
    { key: 'middle', label: '中指' },
    { key: 'ring', label: '无名指' },
    { key: 'pinky', label: '小指' }
  ];

  let modal = document.getElementById("modal-edit-spec");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-edit-spec";
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
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

          <div class="pt-2 border-t">
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">自定义指围尺码对照表（可选，mm；留空用行业标准）:</label>
            <div class="overflow-x-auto">
              <table class="w-full text-xs border-collapse min-w-[420px]">
                <thead>
                  <tr class="text-gray-500">
                    <th class="text-left py-1 pr-2 font-medium">尺码</th>
                    ${SIZE_CHART_FINGERS.map(f => `<th class="text-center py-1 px-1 font-medium">${f.label}</th>`).join('')}
                  </tr>
                </thead>
                <tbody id="edit-size-chart-body">
                  ${["XS", "S", "M", "L"].map(sz => `
                    <tr>
                      <td class="py-1 pr-2 font-bold text-gray-700">${sz}</td>
                      ${SIZE_CHART_FINGERS.map(f => `
                        <td class="py-1 px-1"><input type="number" step="0.1" min="0" class="edit-size-chart-input w-16 border rounded px-1.5 py-1 text-xs" data-size="${sz}" data-finger="${f.key}" placeholder="标准"></td>
                      `).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
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
  document.querySelectorAll(".edit-size-chart-input").forEach(inp => {
    const size = inp.dataset.size;
    const finger = inp.dataset.finger;
    const val = (sizeChart[size] && sizeChart[size][finger] !== undefined && sizeChart[size][finger] !== null)
      ? sizeChart[size][finger]
      : '';
    inp.value = val;
  });

  modal.classList.remove("hidden");
}

function closeEditSpecModal() {
  document.getElementById("modal-edit-spec")?.classList.add("hidden");
}

// --- 立牌 / 古董家具：修改物理尺寸弹窗 ---
let currentEditingDimId = null;

function openEditDimensionsModal(prodId, length, width, height) {
  currentEditingDimId = prodId;

  let modal = document.getElementById("modal-edit-dimensions");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-edit-dimensions";
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-base font-bold text-gray-900">修改尺寸 - <span id="edit-dim-prod-id" class="text-blue-800 font-mono"></span></h3>
          <button onclick="closeEditDimensionsModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">长度 (mm)</label>
            <input type="number" step="0.1" min="0" id="edit-dim-length" class="w-full border rounded-lg px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">宽度 (mm)</label>
            <input type="number" step="0.1" min="0" id="edit-dim-width" class="w-full border rounded-lg px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">高度 (mm)</label>
            <input type="number" step="0.1" min="0" id="edit-dim-height" class="w-full border rounded-lg px-3 py-2 text-sm">
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t">
          <button onclick="closeEditDimensionsModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">取消</button>
          <button onclick="saveProductDimensions()" class="px-5 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm">保存修改</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("edit-dim-prod-id").innerText = prodId;
  document.getElementById("edit-dim-length").value = length || 0;
  document.getElementById("edit-dim-width").value = width || 0;
  document.getElementById("edit-dim-height").value = height || 0;

  modal.classList.remove("hidden");
}

function closeEditDimensionsModal() {
  document.getElementById("modal-edit-dimensions")?.classList.add("hidden");
}

async function saveProductDimensions() {
  if (!currentEditingDimId) return;

  const length = parseFloat(document.getElementById("edit-dim-length").value) || 0;
  const width = parseFloat(document.getElementById("edit-dim-width").value) || 0;
  const height = parseFloat(document.getElementById("edit-dim-height").value) || 0;

  try {
    const { error } = await supabaseClient
      .from("products")
      .update({ length, width, height })
      .eq("id", currentEditingDimId);

    if (error) throw error;

    alert("✨ 尺寸修改成功！");
    closeEditDimensionsModal();
    loadAdminProducts();

  } catch (err) {
    console.error("保存尺寸失败:", err);
    alert("更新失败: " + err.message);
  }
}

async function saveProductSpec() {
  if (!currentEditingProdId) return;

  const newShapes = Array.from(document.querySelectorAll(".edit-shape-cb:checked")).map(cb => cb.value);
  const newSizes = Array.from(document.querySelectorAll(".edit-size-cb:checked")).map(cb => cb.value);
  const newSizeChart = collectSizeChartInputs(".edit-size-chart-input");
  const sizeChartToSave = Object.keys(newSizeChart).length > 0 ? newSizeChart : null;

  if (newShapes.length === 0 || newSizes.length === 0) {
    alert("⚠️ 必须至少勾选 1 个甲型和 1 个尺寸！");
    return;
  }

  try {
    const { data: updateData, error: updateError } = await supabaseClient
      .from("nail_options")
      .update({ shapes: newShapes, sizes: newSizes, size_chart: sizeChartToSave })
      .eq("product_id", currentEditingProdId)
      .select();

    if (updateError) throw updateError;

    if (!updateData || updateData.length === 0) {
      const { error: insertError } = await supabaseClient
        .from("nail_options")
        .insert([{ product_id: currentEditingProdId, shapes: newShapes, sizes: newSizes, size_chart: sizeChartToSave }]);
      if (insertError) throw insertError;
    }

    alert("✨ 规格修改成功！");
    closeEditSpecModal();
    loadAdminProducts();

  } catch(err) {
    console.error("保存失败:", err);
    alert("更新失败: " + err.message);
  }
}

// 压缩图片但保持原始宽高比例，不再强行拉伸/压扁成 800x800 正方形。
// 之前的版本把任何比例的照片都硬塞进正方形画布，非正方形的原图会被拉变形；
// 前台展示时用的是 object-cover 只负责裁剪，并不能把已经被拉伸的图片"拉回来"，
// 所以变形是在这一步产生的。现在改成：按最长边缩放到 maxDim 以内，比例不变。
function compressImage(file, maxDim = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

// 已修复：商品图片实时预览
function handleImagePreview(e) {
  const file = e.target.files[0];
  const previewImg = document.getElementById("image-preview");
  const previewContainer = document.getElementById("image-preview-container");

  if (file && previewImg && previewContainer) {
    previewImg.src = URL.createObjectURL(file);
    previewContainer.classList.remove("hidden"); // 修复：移除 hidden 显示预览
  }
}

// 新增：Hero 背景图实时预览
function handleHeroBgPreview(e) {
  const file = e.target.files[0];
  const previewImg = document.getElementById("cfg-hero-bg-preview");
  const previewContainer = document.getElementById("cfg-hero-bg-preview-container");

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

// 加载站点配置与回显（改为从 Supabase 的 site_settings 表读取，不再用只存在本机的 localStorage）
async function loadSiteSettings() {
  try {
    const { data: cfg, error } = await supabaseClient
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;
    if (!cfg) return;

    if (cfg.logo && document.getElementById("cfg-site-logo")) {
      document.getElementById("cfg-site-logo").value = cfg.logo;
    }
    if (cfg.banner && document.getElementById("cfg-banner-text")) {
      document.getElementById("cfg-banner-text").value = cfg.banner;
    }
    if (cfg.hero_title && document.getElementById("cfg-hero-title")) {
      document.getElementById("cfg-hero-title").value = cfg.hero_title;
    }
    if (cfg.hero_desc && document.getElementById("cfg-hero-desc")) {
      document.getElementById("cfg-hero-desc").value = cfg.hero_desc;
    }
    if (cfg.hero_bg && document.getElementById("cfg-hero-bg-preview")) {
      const prev = document.getElementById("cfg-hero-bg-preview");
      const container = document.getElementById("cfg-hero-bg-preview-container");
      prev.src = cfg.hero_bg;
      container.classList.remove("hidden");
    }
  } catch (err) {
    console.error("加载站点配置失败:", err);
  }
}

// 保存站点配置并上传自定义 Hero 背景图
async function handleSaveSettings(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "正在保存配置...";
    }

    const fileInput = document.getElementById("cfg-hero-bg-file");

    // 先取云端现有的背景图地址，避免没有重新上传图片时把已有背景图清空
    let heroBgUrl = "";
    try {
      const { data: existing } = await supabaseClient.from("site_settings").select("hero_bg").eq("id", 1).single();
      if (existing && existing.hero_bg) heroBgUrl = existing.hero_bg;
    } catch (e) { /* 表可能还没有数据，忽略 */ }

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const compressedBlob = await compressImage(fileInput.files[0]);
      const fileName = `hero_banner_${Date.now()}.jpg`;

      const { error: uploadError } = await supabaseClient.storage
        .from("product-media")
        .upload(fileName, compressedBlob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw new Error("Hero 背景图上传失败: " + uploadError.message);

      const { data: publicUrlData } = supabaseClient.storage.from("product-media").getPublicUrl(fileName);
      heroBgUrl = publicUrlData.publicUrl;
    }

    const cfg = {
      id: 1,
      logo: document.getElementById("cfg-site-logo") ? document.getElementById("cfg-site-logo").value : "",
      banner: document.getElementById("cfg-banner-text") ? document.getElementById("cfg-banner-text").value : "",
      hero_title: document.getElementById("cfg-hero-title") ? document.getElementById("cfg-hero-title").value : "",
      hero_desc: document.getElementById("cfg-hero-desc") ? document.getElementById("cfg-hero-desc").value : "",
      hero_bg: heroBgUrl
    };

    // 写入 Supabase 的 site_settings 表（单行 id=1），所有访客都会看到这份配置
    const { error: saveError } = await supabaseClient.from("site_settings").upsert(cfg);
    if (saveError) throw saveError;

    alert("✨ 站点文案与背景配置已保存到云端，刷新前台即可对所有访客生效！");
    await loadSiteSettings();

  } catch (err) {
    console.error("保存设置出错:", err);
    alert("保存失败: " + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "保存站点配置";
    }
  }
}