// 后台管理逻辑 (含本地图片标准尺寸自动压缩与 product-media 存储桶同步)

document.addEventListener("DOMContentLoaded", () => {
  loadAdminProducts();

  const categorySelect = document.getElementById("prod-category");
  const nailSection = document.getElementById("nail-options-section");
  const imageInput = document.getElementById("prod-image-file");

  // 根据分类动态显示/隐藏穿戴甲规格配置
  if (categorySelect && nailSection) {
    categorySelect.addEventListener("change", (e) => {
      nailSection.style.display = e.target.value === "nails" ? "block" : "none";
    });
  }

  // 本地图片选择预览
  if (imageInput) {
    imageInput.addEventListener("change", handleImagePreview);
  }

  const form = document.getElementById("add-product-form");
  if (form) {
    form.addEventListener("submit", handleAddProduct);
  }
});

// 1. 从 Supabase 读取商品
async function loadAdminProducts() {
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;

  try {
    const { data: products, error } = await supabaseClient
      .from("products")
      .select(`
        *,
        nail_options (*)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!products || products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">数据库中暂无商品。</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(item => {
      const nailOpt = item.nail_options?.[0] || {};
      const shapesText = nailOpt.shapes ? JSON.parse(nailOpt.shapes).join(", ") : "-";
      const sizesText = nailOpt.sizes ? JSON.parse(nailOpt.sizes).join(", ") : "-";

      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3">
            <img src="${item.spin_image || 'https://via.placeholder.com/60'}" class="w-12 h-12 object-cover rounded-lg border" alt="">
          </td>
          <td class="p-3 font-mono text-xs text-gray-500">${item.id}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">${item.category_id}</span></td>
          <td class="p-3 font-medium text-gray-900">${item.title_en}</td>
          <td class="p-3 text-xs text-gray-500">
            ${item.category_id === 'nails' ? `<div><b>Shapes:</b> ${shapesText}</div><div><b>Sizes:</b>${sizesText}</div>` : '无'}
          </td>
          <td class="p-3 text-amber-800 font-bold">$${parseFloat(item.price).toFixed(2)}</td>
          <td class="p-3">
            <button onclick="deleteProduct('${item.id}')" class="text-red-600 hover:text-red-800 text-xs font-semibold">
              删除
            </button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("加载商品失败:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">加载失败，请检查数据库配置。</td></tr>`;
  }
}

// 2. 本地图片实时预览
function handleImagePreview(e) {
  const file = e.target.files[0];
  const previewContainer = document.getElementById("image-preview-container");
  const previewImg = document.getElementById("image-preview");

  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      previewImg.src = evt.target.result;
      previewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    previewContainer.classList.add("hidden");
  }
}

// 3. 图片前端自动缩放压缩 (压缩为 800x800 高清标准图，大幅提升手机加载速度)
function compressAndResizeImage(file, maxWidth = 800, maxHeight = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // 等比例缩放
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // 转为 Blob JPEG 格式（质量 0.85）
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("图片压缩失败"));
        }
      }, "image/jpeg", 0.85);
    };
    img.onerror = (err) => reject(err);
  });
}

// 4. 处理表单提交（同步图片至 product-media 并存储规格数据）
async function handleAddProduct(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>处理中...</span>`;

  try {
    const id = document.getElementById("prod-id").value.trim();
    const categoryId = document.getElementById("prod-category").value;
    const titleEn = document.getElementById("prod-title-en").value.trim();
    const subtitleEn = document.getElementById("prod-subtitle-en").value.trim();
    const price = parseFloat(document.getElementById("prod-price").value);
    const tagKey = document.getElementById("prod-tag-key").value.trim() || "New";
    const fileInput = document.getElementById("prod-image-file");

    let imageUrl = "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800"; // 默认图

    // 如果用户上传了本地图片
    if (fileInput.files && fileInput.files[0]) {
      const rawFile = fileInput.files[0];

      // A. 自动压缩本地图片
      const compressedBlob = await compressAndResizeImage(rawFile);
      const fileName = `${Date.now()}_${id}.jpg`;

      // B. 上传压缩后的图片至 product-media 存储桶
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from("product-media")
        .upload(fileName, compressedBlob, {
          contentType: "image/jpeg",
          upsert: true
        });

      if (uploadError) throw new Error("图片上传至 product-media 失败: " + uploadError.message);

      // C. 获取公开可访问 URL
      const { data: publicUrlData } = supabaseClient
        .storage
        .from("product-media")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    // 写入 products 表
    const newProduct = {
      id: id,
      category_id: categoryId,
      title_en: titleEn,
      subtitle_en: subtitleEn,
      price: price,
      tag_key: tagKey,
      tag_class: "bg-amber-800 text-white",
      spin_image: imageUrl
    };

    const { error: prodError } = await supabaseClient.from("products").insert([newProduct]);
    if (prodError) throw prodError;

    // 写入 product_images 关联表
    await supabaseClient.from("product_images").insert([{
      product_id: id,
      image_url: imageUrl,
      display_order: 1
    }]);

    // 如果是穿戴甲，写入 nail_options 表
    if (categoryId === "nails") {
      const selectedShapes = Array.from(document.querySelectorAll(".shape-checkbox:checked")).map(cb => cb.value);
      const selectedSizes = Array.from(document.querySelectorAll(".size-checkbox:checked")).map(cb => cb.value);

      await supabaseClient.from("nail_options").insert([{
        product_id: id,
        shapes: JSON.stringify(selectedShapes),
        sizes: JSON.stringify(selectedSizes)
      }]);
    }

    alert("🎉 商品添加成功！图片已自动优化并保存至 product-media 存储桶！");
    document.getElementById("add-product-form").reset();
    document.getElementById("image-preview-container").classList.add("hidden");
    loadAdminProducts();

  } catch (err) {
    console.error("提交失败:", err);
    alert("操作失败: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>保存并发布商品</span>`;
  }
}

// 5. 删除商品
async function deleteProduct(productId) {
  if (!confirm(`确定要删除商品 "${productId}" 吗？`)) return;

  try {
    const { error } = await supabaseClient.from("products").delete().eq("id", productId);
    if (error) throw error;

    alert("已成功删除");
    loadAdminProducts();
  } catch (err) {
    alert("删除失败: " + err.message);
  }
}