// ShopFlow AI - Frontend Single Page Application Client
// Tuân thủ triết lý Humble Assistant & 3-Color Data Hierarchy

let currentDraftOrder = null;
let currentAuthUser = null;
let currentProducts = [];

// Khởi chạy khi tài liệu tải xong
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupPasteArea();
  setupSampleChips();
  setupCheckoutActions();
  setupFaqTab();

  // Tự động kiểm tra phiên hoặc đăng nhập tài khoản seed mẫu
  await initAuth();
});

// -------------------------------------------------------------
// 1. QUẢN LÝ PHIÊN ĐĂNG NHẬP & TOAST
// -------------------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠️'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  const token = localStorage.getItem('access_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error?.message || `Lỗi hệ thống (${res.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

async function initAuth() {
  const badge = document.getElementById('userBadge');
  try {
    const me = await apiRequest('/auth/me');
    currentAuthUser = me;
    badge.innerText = `👤 ${me.fullName} (${me.role})`;
  } catch {
    // Nếu chưa đăng nhập, tự động login bằng tài khoản seed OWNER để demo liền mạch
    try {
      const loginRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'owner@shopflow.vn',
          password: 'password123'
        })
      });
      localStorage.setItem('access_token', loginRes.access_token);
      currentAuthUser = loginRes.user;
      badge.innerText = `👤 ${loginRes.user.fullName} (${loginRes.user.role})`;
    } catch {
      badge.innerText = '👤 Khách (Chưa đăng nhập)';
    }
  }
}

// -------------------------------------------------------------
// 2. CHUYỂN ĐỔI TAB & ĐIỀU HƯỚNG
// -------------------------------------------------------------
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.dataset.tab;
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');

      if (targetId === 'tab-orders') loadOrdersList();
      if (targetId === 'tab-inventory') loadInventoryList();
      if (targetId === 'tab-reports') loadReportsData();
    });
  });
}

// -------------------------------------------------------------
// 3. VÙNG DÁN TIN NHẮN (PASTE AREA)
// -------------------------------------------------------------
function setupPasteArea() {
  const textarea = document.getElementById('rawMessage');
  const charCount = document.getElementById('charCount');
  const btnPaste = document.getElementById('btnPasteClipboard');
  const btnExtract = document.getElementById('btnExtractAI');

  textarea.addEventListener('input', () => {
    charCount.innerText = `${textarea.value.length}/2000 ký tự`;
  });

  // Dán nhanh từ bộ nhớ tạm Clipboard qua API
  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        textarea.value = text;
        charCount.innerText = `${text.length}/2000 ký tự`;
        showToast('Đã dán văn bản từ Clipboard!');
      }
    } catch {
      showToast('Trình duyệt chưa cấp quyền Clipboard. Vui lòng bấm Ctrl+V để dán.', 'error');
    }
  });

  // Bấm nút Gọi AI Bóc tách
  btnExtract.addEventListener('click', handleExtractDraft);
}

function setupSampleChips() {
  const samples = {
    sample1: 'Cho chị 1 áo sơ mi lụa trắng size M về 124 Trần Hưng Đạo P. Bến Thành Q1 HCM nhé e, sđt 0903123456',
    sample2: 'Lấy cho chị 1 chân váy tennis xếp ly màu đen size S... à thôi đổi sang size M cho chị nhé. Gửi về 55 Lê Lợi Huế sđt 0912345678',
    sample3: 'Shop ơi ship cho mình 1 áo sơ mi lụa trắng M với 1 chân váy đen S về 45 Lý Thường Kiệt HN nhé, alo 0987654321',
    sample4: 'Cho e 5 áo sơ mi lụa trắng size XL nhé e sđt 0909090909'
  };

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.sample;
      const text = samples[key] || '';
      const textarea = document.getElementById('rawMessage');
      textarea.value = text;
      document.getElementById('charCount').innerText = `${text.length}/2000 ký tự`;
      showToast('Đã điền tin nhắn mẫu!');
    });
  });
}

// -------------------------------------------------------------
// 4. GỌI API BÓC TÁCH AI & RENDER REVIEW
// -------------------------------------------------------------
async function handleExtractDraft() {
  const textarea = document.getElementById('rawMessage');
  const rawText = textarea.value.trim();

  if (rawText.length < 5) {
    showToast('Nội dung tin nhắn quá ngắn (tối thiểu 5 ký tự)', 'error');
    return;
  }

  const btn = document.getElementById('btnExtractAI');
  const btnIcon = document.getElementById('btnExtractIcon');
  const btnText = document.getElementById('btnExtractText');

  btn.disabled = true;
  btnIcon.innerText = '⏳';
  btnText.innerText = 'AI đang bóc tách & đối soát kho...';

  try {
    const response = await apiRequest('/ai/draft-order', {
      method: 'POST',
      body: JSON.stringify({ raw_message: rawText })
    });

    currentDraftOrder = response.draft_order;
    renderReviewScreen(currentDraftOrder);
    showToast('Phân tích thành công! Mời bạn đối soát đơn hàng.');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btnIcon.innerText = '⚡';
    btnText.innerText = 'Phân tích đơn hàng (AI Extract)';
  }
}

function renderReviewScreen(draft) {
  // Ẩn bước paste, hiện bước review và sticky bottom bar
  document.getElementById('pasteStep').style.display = 'none';
  document.getElementById('reviewStep').style.display = 'block';
  document.getElementById('stickyBottomBar').style.display = 'block';

  // Hiển thị thông tin khách hàng
  document.getElementById('custName').value = draft.customer.full_name || '';
  document.getElementById('custPhone').value = draft.customer.phone || '';
  document.getElementById('custAddress').value = draft.customer.shipping_address || '';

  // Hiển thị độ tin cậy
  document.getElementById('confidenceBadge').innerText = `Độ tin cậy: ${Math.round(draft.ai_metadata.confidence_score * 100)}%`;

  // Render danh sách sản phẩm
  renderItemsContainer(draft.items);

  // Cập nhật tính toán tiền
  recalculateFinancials();
}

function renderItemsContainer(items) {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';
  document.getElementById('itemCount').innerText = items.length;

  items.forEach((item, index) => {
    const card = document.createElement('div');
    const isOutOfStock = !item.is_stock_available;
    const hasWarning = !!item.warning;

    card.className = `order-item-card ${isOutOfStock ? 'out-of-stock' : hasWarning ? 'has-warning' : ''}`;

    let matchBadge = '<span class="badge-truth">🔒 Khớp chính xác</span>';
    if (item.match_status === 'FUZZY_MATCH') {
      matchBadge = '<span class="badge-warning">⚠️ Gợi ý phân loại</span>';
    } else if (item.match_status === 'NO_MATCH') {
      matchBadge = '<span class="badge-danger">🛑 Không tìm thấy SKU</span>';
    }

    let warningHtml = '';
    if (item.warning) {
      warningHtml = `<div style="font-size: 0.75rem; color: ${isOutOfStock ? '#fca5a5' : '#fbbf24'}; margin-top: 6px;">
        ⚠️ ${item.warning}
      </div>`;
    }

    card.innerHTML = `
      <div class="item-header">
        <div>
          <div class="item-name">${escapeHtml(item.product_name)}</div>
          <div class="item-sku">SKU: ${item.sku || 'N/A'} | Màu: ${item.color || 'N/A'} | Size: ${item.size || 'N/A'}</div>
          <div style="margin-top: 4px;">
            ${matchBadge}
            <span class="badge-ai">⚡ "${escapeHtml(item.raw_text_extracted)}"</span>
          </div>
        </div>
        <button type="button" class="btn-secondary-sm" onclick="removeItem(${index})" style="color: #ef4444;">✕</button>
      </div>

      ${warningHtml}

      <div class="item-meta">
        <div class="stepper">
          <button type="button" class="step-btn" onclick="updateQty(${index}, -1)">−</button>
          <span style="font-weight: 600; min-width: 24px; text-align: center;">${item.quantity}</span>
          <button type="button" class="step-btn" onclick="updateQty(${index}, 1)">+</button>
        </div>
        <div style="text-align: right;">
          <div class="item-price">${formatVND(item.system_unit_price * item.quantity)}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${formatVND(item.system_unit_price)}/sp (Tồn: ${item.current_stock})</div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

window.updateQty = function (index, change) {
  if (!currentDraftOrder || !currentDraftOrder.items[index]) return;
  const item = currentDraftOrder.items[index];
  const newQty = item.quantity + change;
  if (newQty <= 0) {
    removeItem(index);
    return;
  }
  item.quantity = newQty;
  renderItemsContainer(currentDraftOrder.items);
  recalculateFinancials();
};

window.removeItem = function (index) {
  if (!currentDraftOrder) return;
  currentDraftOrder.items.splice(index, 1);
  renderItemsContainer(currentDraftOrder.items);
  recalculateFinancials();
};

function recalculateFinancials() {
  if (!currentDraftOrder) return;

  const subtotal = currentDraftOrder.items.reduce((sum, i) => sum + i.system_unit_price * i.quantity, 0);
  const shippingFee = parseInt(document.getElementById('inputShippingFee').value, 10) || 0;
  const discount = parseInt(document.getElementById('inputDiscount').value, 10) || 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

  document.getElementById('lblSubtotal').innerText = formatVND(subtotal);
  document.getElementById('lblTotal').innerText = formatVND(total);
}

// -------------------------------------------------------------
// 5. CHỐT ĐƠN HÀNG (CHECKOUT & ATOMIC DEDUCTION)
// -------------------------------------------------------------
function setupCheckoutActions() {
  document.getElementById('inputShippingFee').addEventListener('input', recalculateFinancials);
  document.getElementById('inputDiscount').addEventListener('input', recalculateFinancials);

  document.getElementById('btnBackToPaste').addEventListener('click', () => {
    document.getElementById('reviewStep').style.display = 'none';
    document.getElementById('stickyBottomBar').style.display = 'none';
    document.getElementById('pasteStep').style.display = 'block';
  });

  document.getElementById('btnConfirmCheckout').addEventListener('click', handleConfirmOrder);

  document.getElementById('btnCopyBill').addEventListener('click', () => {
    const text = document.getElementById('billPreviewText').innerText;
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép tin nhắn hóa đơn vào Clipboard!');
  });

  document.getElementById('btnCloseModal').addEventListener('click', () => {
    document.getElementById('successModal').classList.remove('active');
    document.getElementById('btnBackToPaste').click();
    document.getElementById('rawMessage').value = '';
    document.getElementById('charCount').innerText = '0/2000 ký tự';
  });
}

async function handleConfirmOrder() {
  if (!currentDraftOrder || currentDraftOrder.items.length === 0) {
    showToast('Đơn hàng không có sản phẩm nào!', 'error');
    return;
  }

  // Kiểm tra nếu có sản phẩm chưa đối soát được
  const hasUnmatched = currentDraftOrder.items.some((i) => !i.variant_id);
  if (hasUnmatched) {
    showToast('Có sản phẩm chưa đối soát được với kho hàng. Vui lòng kiểm tra lại.', 'error');
    return;
  }

  const custName = document.getElementById('custName').value.trim();
  const custPhone = document.getElementById('custPhone').value.trim();
  const custAddress = document.getElementById('custAddress').value.trim();

  if (!custName || !custPhone || !custAddress) {
    showToast('Vui lòng điền đủ Tên, SĐT và Địa chỉ giao hàng', 'error');
    return;
  }

  const btn = document.getElementById('btnConfirmCheckout');
  const btnIcon = document.getElementById('btnCheckoutIcon');
  const btnText = document.getElementById('btnCheckoutText');

  btn.disabled = true;
  btnIcon.innerText = '⏳';
  btnText.innerText = 'Đang trừ kho nguyên tử & cấp số #...';

  try {
    const shippingFee = parseInt(document.getElementById('inputShippingFee').value, 10) || 0;
    const discount = parseInt(document.getElementById('inputDiscount').value, 10) || 0;

    // 1. Tạo đơn hàng nháp trong CSDL
    const createPayload = {
      customer_name: custName,
      customer_phone: custPhone,
      shipping_address: custAddress,
      shipping_fee_vnd: shippingFee,
      discount_vnd: discount,
      items: currentDraftOrder.items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity
      }))
    };

    const createdOrder = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(createPayload)
    });

    // 2. Chốt đơn hàng và trừ kho nguyên tử kèm Idempotency-Key
    const idempotencyKey = `KEY-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const confirmRes = await apiRequest(`/orders/${createdOrder.id}/confirm`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });

    const confirmedOrder = confirmRes.order;

    // 3. Hiển thị Modal Thành công & Sinh tin nhắn gửi khách
    showOrderSuccessModal(confirmedOrder);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btnIcon.innerText = '🚀';
    btnText.innerText = 'Xác nhận chốt đơn';
  }
}

function showOrderSuccessModal(order) {
  document.getElementById('modalOrderNumber').innerText = `#${order.order_number}`;

  // Soạn thảo mẫu tin nhắn chốt đơn gửi khách hàng online
  const itemsText = order.items
    .map((item) => `• ${item.quantity}x ${item.snap_product_name} (${item.snap_variant_name || item.snap_sku}) - ${formatVND(item.snap_price_vnd)}`)
    .join('\n');

  const billMessage = `Dạ ShopFlow xin gửi bạn xác nhận đơn hàng #${order.order_number}:
- Khách hàng: ${order.customer_name} (${order.customer_phone})
- Địa chỉ nhận: ${order.shipping_address}
- Chi tiết sản phẩm:
${itemsText}
- Phí vận chuyển: ${formatVND(order.shipping_fee_vnd)}
=> Tổng thanh toán khi nhận (COD): ${formatVND(order.total_vnd)}

Shop sẽ gửi hàng ngay hôm nay, bạn chú ý điện thoại nhé ạ! ❤️`;

  document.getElementById('billPreviewText').innerText = billMessage;
  document.getElementById('successModal').classList.add('active');
}

// -------------------------------------------------------------
// 6. CÁC TAB PHỤ: DANH SÁCH ĐƠN & KHO HÀNG
// -------------------------------------------------------------
async function loadOrdersList() {
  const container = document.getElementById('ordersListContainer');
  try {
    const res = await apiRequest('/orders?limit=15');
    if (!res.data || res.data.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có đơn hàng nào.</div>';
      return;
    }

    container.innerHTML = res.data
      .map(
        (o) => `
      <div style="background: #162032; border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #c084fc;">#${o.order_number || 'NHÁP'}</span>
          <span class="badge-truth">${o.status}</span>
        </div>
        <div style="font-size: 0.85rem; margin-top: 4px;">Khách: <strong>${escapeHtml(o.customer_name)}</strong> (${o.customer_phone})</div>
        <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.8rem; color: var(--text-muted);">
          <span>${o.items?.length || 0} sản phẩm</span>
          <span style="color: #34d399; font-weight: 600;">${formatVND(o.total_vnd)}</span>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<div style="color: #ef4444; padding: 10px;">Lỗi tải đơn hàng: ${err.message}</div>`;
  }
}

async function loadInventoryList() {
  const container = document.getElementById('inventoryContainer');
  try {
    const res = await apiRequest('/products?limit=30');
    currentProducts = res.data || [];

    if (currentProducts.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có sản phẩm nào trong kho.</div>';
      return;
    }

    container.innerHTML = currentProducts
      .map((p) => {
        const variantsHtml = p.variants
          .map(
            (v) => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #0b1120; padding: 6px 10px; border-radius: 6px; margin-top: 6px; font-size: 0.8rem;">
            <div>
              <span>${escapeHtml(v.variant_name)} (${v.sku})</span>
              <span style="color: #a7f3d0; margin-left: 6px;">${formatVND(v.price_vnd)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: ${v.stock <= 0 ? '#ef4444' : '#34d399'}; font-weight: 700;">Tồn: ${v.stock}</span>
              <button class="step-btn" onclick="quickEditStock('${p.id}', '${v.id}', ${v.stock - 1})">−</button>
              <button class="step-btn" onclick="quickEditStock('${p.id}', '${v.id}', ${v.stock + 1})">+</button>
            </div>
          </div>
        `
          )
          .join('');

        return `
        <div style="background: #162032; border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 10px;">
          <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(p.name)}</div>
          ${variantsHtml}
        </div>
      `;
      })
      .join('');
  } catch (err) {
    container.innerHTML = `<div style="color: #ef4444; padding: 10px;">Lỗi tải kho: ${err.message}</div>`;
  }
}

window.quickEditStock = async function (productId, variantId, newStock) {
  if (newStock < 0) return;
  try {
    await apiRequest(`/products/${productId}/variants/${variantId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: newStock })
    });
    showToast('Đã cập nhật tồn kho');
    loadInventoryList();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// -------------------------------------------------------------
// 7. PHÂN HỆ FAQ BOT & BÁO CÁO (G17)
// -------------------------------------------------------------
function setupFaqTab() {
  const btnAsk = document.getElementById('btnAskFaq');
  const inputQuestion = document.getElementById('faqQuestionInput');
  const resultBox = document.getElementById('faqAnswerResult');
  const answerText = document.getElementById('faqAnswerText');
  const btnCopy = document.getElementById('btnCopyFaqAnswer');

  if (!btnAsk) return;

  btnAsk.addEventListener('click', async () => {
    const question = inputQuestion.value.trim();
    if (question.length < 3) {
      showToast('Câu hỏi quá ngắn (tối thiểu 3 ký tự)', 'error');
      return;
    }

    btnAsk.disabled = true;
    btnAsk.innerHTML = '<span>⏳</span> Đang tra cứu chính sách...';

    try {
      const res = await apiRequest('/ai/faq-answer', {
        method: 'POST',
        body: JSON.stringify({ question })
      });

      resultBox.style.display = 'block';
      answerText.innerText = res.answer;
      showToast('Đã tạo câu trả lời thành công!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnAsk.disabled = false;
      btnAsk.innerHTML = '<span>🤖</span> Hỏi AI Trả lời';
    }
  });

  btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(answerText.innerText);
    showToast('Đã sao chép câu trả lời vào Clipboard!');
  });
}

async function loadReportsData() {
  await Promise.all([loadUsageReport(), loadRevenueReport(), loadLowStockReport()]);
}

async function loadUsageReport() {
  const container = document.getElementById('usageStatsContainer');
  try {
    const data = await apiRequest('/usage');
    container.innerHTML = `
      <div style="font-size: 0.85rem; margin-bottom: 8px;">
        Gói cước: <strong style="color: #c084fc;">${data.plan_name}</strong> (${data.period})
      </div>
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 3px;">
          <span>Lượt bóc tách đơn (AI Draft):</span>
          <span><strong>${data.draft_orders.used}/${data.draft_orders.max}</strong> (${data.draft_orders.percentage}%)</span>
        </div>
        <div style="background: #0b1120; border-radius: 9999px; height: 8px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #7c3aed, #a855f7); width: ${data.draft_orders.percentage}%; height: 100%;"></div>
        </div>
      </div>
      <div style="font-size: 0.75rem; color: var(--text-muted);">
        Tổng token đã tiêu thụ: <strong>${data.total_tokens_consumed.toLocaleString()} tokens</strong> (~${((data.total_tokens_consumed * 4.1) / 1000).toFixed(0)} đ)
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted);">Chỉ chủ shop (OWNER) mới có quyền xem hạn mức gói.</div>`;
  }
}

async function loadRevenueReport() {
  const container = document.getElementById('revenueContainer');
  const revenueCard = document.getElementById('revenueCard');
  try {
    const data = await apiRequest('/reports/revenue?days=30');
    if (!data || data.length === 0) {
      container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); padding: 10px;">Chưa có đơn hàng nào giao thành công trong 30 ngày qua.</div>`;
      return;
    }

    const totalRev = data.reduce((sum, d) => sum + d.revenue_vnd, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.total_orders, 0);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #0b1120; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Tổng doanh số:</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #34d399;">${formatVND(totalRev)}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Đơn hoàn tất:</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #c084fc;">${totalOrders} đơn</div>
        </div>
      </div>
    `;
  } catch (err) {
    revenueCard.style.display = 'none'; // Ẩn thẻ doanh thu nếu là STAFF (RBAC)
  }
}

async function loadLowStockReport() {
  const container = document.getElementById('lowStockContainer');
  try {
    const data = await apiRequest('/reports/low-stock');
    if (!data || data.length === 0) {
      container.innerHTML = `<div style="font-size: 0.85rem; color: #10b981; padding: 10px;">✓ Toàn bộ mặt hàng đều đang đủ tồn kho an toàn!</div>`;
      return;
    }

    container.innerHTML = data
      .map(
        (v) => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 10px; border-radius: 6px; margin-bottom: 6px; font-size: 0.8rem;">
        <div>
          <strong>${escapeHtml(v.product_name)}</strong> (${v.sku})
          <div style="font-size: 0.7rem; color: var(--text-muted);">Phân loại: ${v.color || ''} ${v.size || ''}</div>
        </div>
        <div style="text-align: right;">
          <span style="color: ${v.stock === 0 ? '#ef4444' : '#f59e0b'}; font-weight: 700; font-size: 0.9rem;">Tồn: ${v.stock}</span>
          <div style="font-size: 0.65rem; color: var(--text-muted);">Ngưỡng: ${v.low_stock_threshold}</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<div style="color: #ef4444; font-size: 0.8rem;">Lỗi tải cảnh báo tồn: ${err.message}</div>`;
  }
}

// -------------------------------------------------------------
// TIỆN ÍCH HỖ TRỢ
// -------------------------------------------------------------
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

