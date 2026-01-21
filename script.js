
document.addEventListener("DOMContentLoaded", () => {

  /* ======================== الهيدر ======================== */
  (function() {
    const headerBg = document.getElementById('headerBg');
    let lastScroll = window.scrollY;
    const delta = 10;

    if (!headerBg) return;

    window.addEventListener('scroll', () => {
      const current = window.scrollY;
      if (Math.abs(current - lastScroll) <= delta) return;
      if (current > lastScroll && current > 100) {
        headerBg.classList.add('hidden');
      } else {
        headerBg.classList.remove('hidden');
      }
      lastScroll = current;
    });
  })();

  /* ======================== أنيميشن من نحن ======================== */
  const boxes = document.querySelectorAll('.about-box');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  boxes.forEach(box => observer.observe(box));

  /* ======================== اختيار قسم القائمة ======================== */
  const categoryButtons = document.querySelectorAll(".category-btn");
  const menuGroups = document.querySelectorAll(".menu-group");

  // عرض القسم الافتراضي عند التحميل (نفّذ فوراً داخل DOMContentLoaded)
  (function setDefaultCategory() {
    try {
      const activeBtn = document.querySelector(".category-btn.active");
      const defaultCategory = (activeBtn && activeBtn.dataset && activeBtn.dataset.category) ? activeBtn.dataset.category : "chicken";
      if (defaultCategory === "all") {
        menuGroups.forEach(group => group.style.display = "flex");
      } else {
        menuGroups.forEach(group => {
          group.style.display = group.id === defaultCategory ? "flex" : "none";
        });
      }
    } catch (e) {
      // silence errors if DOM differs
    }
  })();

  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // إزالة الكلاس "active" من كل الأزرار
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;

      if (category === "all") {
        // عرض كل الأقسام
        menuGroups.forEach(group => {
          group.style.display = "flex";
          group.style.opacity = 0;
          group.style.marginBottom = "30px"; // مسافة بين كل قسم
          setTimeout(() => {
            group.style.transition = "all 0.5s ease";
            group.style.opacity = 1;
          }, 50);
        });
      } else {
        // عرض القسم المختار فقط
        menuGroups.forEach(group => {
          if (group.id === category) {
            group.style.display = "flex";
            group.style.opacity = 0;
            setTimeout(() => {
              group.style.transition = "all 0.5s ease";
              group.style.opacity = 1;
            }, 50);
          } else {
            group.style.display = "none";
          }
        });
      }
    });
  });

  /* ======================== تحديث السعر حسب الحجم والرز والكمية ======================== */
document.querySelectorAll('.menu-item-card').forEach(card => {
  const priceEl = card.querySelector('.price');
  const quantityEl = card.querySelector('.quantity-input'); // span
  const plusBtn = card.querySelector('.plus');
  const minusBtn = card.querySelector('.minus');
  const riceSelect = card.querySelector('.rice-select');
  const sizeBtns = card.querySelectorAll('.size-btn');
  const titleEl = card.querySelector('.menu-item-title');
  const title = titleEl ? titleEl.textContent.trim() : '';

  if (!priceEl || !quantityEl) return;

  // حفظ السعر الأساسي
  let basePrice = parseFloat(priceEl.dataset.base || priceEl.textContent) || 0;
  priceEl.dataset.base = basePrice;

  /* ================= صنف بدون مقاسات ================= */
  if (!card.querySelector('.size-btn')) {
    const updateSimplePrice = () => {
      let qty = parseInt(quantityEl.textContent) || 1;
      let base = parseFloat(priceEl.dataset.base) || 0;
      priceEl.textContent = (base * qty).toFixed(2);
    };

    updateSimplePrice();

    if (plusBtn && minusBtn) {
      plusBtn.addEventListener('click', () => {
        quantityEl.textContent = (parseInt(quantityEl.textContent) || 1) + 1;
        updateSimplePrice();
      });

      minusBtn.addEventListener('click', () => {
        let q = parseInt(quantityEl.textContent) || 1;
        if (q > 1) {
          quantityEl.textContent = q - 1;
          updateSimplePrice();
        }
      });
    }

    return;
  }

  /* ================= صنف بمقاسات ================= */
const updatePrice = () => {
  let selectedPrice = basePrice;
  const activeSize = card.querySelector('.size-btn.active');
  let riceExtra = 0;
  let qty = parseInt(quantityEl.textContent) || 1;

  /* ===== كبسة المكرونة بالدجاج (خصم فعلي 10%) ===== */
if (title === "كبسة المكرونة بالدجاج") {
  const oldPriceEl = card.querySelector('.old-price-value');
  const newPriceEl = card.querySelector('.price');

  let base = parseFloat(oldPriceEl?.textContent) || 0;
  let qty = parseInt(quantityEl.textContent) || 1;

  let discountedUnit = base * 0.8; // خصم 10%
  let finalPrice = discountedUnit * qty;

  if (oldPriceEl && newPriceEl) {
    oldPriceEl.textContent = (base * qty).toFixed(2);
    newPriceEl.textContent = finalPrice.toFixed(2);
  }

  return; // يمنع دخوله في أي حسابات تانية
}

  /* ===== أصناف بمقاسات ===== */
  if (
    ["مظبي دجاج", "دجاج مكشن", "مضغوط دجاج", "مضغوط دجاج ابيض"].includes(title) &&
    activeSize
  ) {
    if (riceSelect) {
      if (riceSelect.value === "plain") {
        if (title === "مظبي دجاج") selectedPrice = activeSize.textContent.includes("نصف") ? 15 : 30;
        if (title === "دجاج مكشن") selectedPrice = activeSize.textContent.includes("نصف") ? 16 : 32;
        if (title === "مضغوط دجاج") selectedPrice = activeSize.textContent.includes("نصف") ? 21 : 42;
        if (title === "مضغوط دجاج ابيض") selectedPrice = activeSize.textContent.includes("نصف") ? 21 : 42;
      } else if (riceSelect.value === "abu-bint") {
        riceExtra = activeSize.textContent.includes("نصف") ? 1 : 2;
        selectedPrice = activeSize.textContent.includes("نصف") ? 21 : 42;
      } else {
        selectedPrice = parseFloat(activeSize.dataset.price) || basePrice;
      }
    }
  } else if (activeSize && activeSize.dataset.price) {
    selectedPrice = parseFloat(activeSize.dataset.price);
  }

  let unitPrice = selectedPrice + riceExtra;
  let discountedUnit = unitPrice * 0.8;
  let finalPrice = discountedUnit * qty;

  const oldPriceEl = card.querySelector('.old-price-value');
  const newPriceEl = card.querySelector('.price');

  if (oldPriceEl && newPriceEl) {
    oldPriceEl.textContent = (unitPrice * qty).toFixed(2);
    newPriceEl.textContent = finalPrice.toFixed(2);
  }
};

  /* ================= Events ================= */
  updatePrice();

  if (plusBtn && minusBtn) {
    plusBtn.addEventListener('click', () => {
      quantityEl.textContent = (parseInt(quantityEl.textContent) || 1) + 1;
      updatePrice();
    });

    minusBtn.addEventListener('click', () => {
      let q = parseInt(quantityEl.textContent) || 1;
      if (q > 1) {
        quantityEl.textContent = q - 1;
        updatePrice();
      }
    });
  }

  if (riceSelect) {
    riceSelect.addEventListener('change', updatePrice);
  }

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePrice();
    });
  });
});

/* ======================== عناصر السلة ======================== */
const cartSlider = document.querySelector('.cartSlider');
const cartSliderClose = document.querySelector('.cartSlider-close');
const cartIcon = document.querySelector('.cart-container');
const cartCountEl = document.querySelector('.cart-count');
const cartSliderItemsContainer = document.querySelector('.cartSlider-items');
const cartTotalEl = document.getElementById('cartTotal_v2');
const sendOrderBtn = document.getElementById('sendOrder_v2');
const paymentMethod = document.getElementById('paymentMethod_v2');
const deliveryMethod = document.getElementById('deliveryMethod_v2');

let cartSliderItems = [];
const deliveryFee = 5;

/* ======================== تحديث الكمية خارج السلة ======================== */
function updateOutsideQty(title, size, rice, qty) {
  document.querySelectorAll('.menu-item-card').forEach(card => {
    const cardTitle = card.querySelector('.menu-item-title')?.textContent.trim();
    const cardSizeEl = card.querySelector('.size-btn.active');
    const cardSize = cardSizeEl?.textContent;
    const cardRice = card.querySelector('.rice-select')?.value || '';

    if (cardTitle === title && cardSize === size && cardRice === rice) {
      const qtyEl = card.querySelector('.quantity-input');
      if (qtyEl) {
        qtyEl.textContent = qty;

        // إعادة حساب السعر
        card.querySelector('.rice-select')?.dispatchEvent(new Event('change'));
      }
    }
  });
}

  /* ======================== خانة خصم ======================== */
  const discountCodeInput = document.getElementById("discountCode_v2");
  const applyDiscountBtn = document.getElementById("applyDiscountBtn_v2");
  const discountMessage = document.getElementById("discountMessage_v2");

  const discountCodes = {
    "SAVE10": 0.10,
    "SAVE20": 0.20
  };
  let usedCodes = [];
  let currentDiscount = 0;
  let appliedDiscountCode = "";

  /* ======================== دالة تحديث السلة ======================== */
  function updateCartUI() {
    if (!cartSliderItemsContainer || !cartCountEl || !cartTotalEl) return;

    // تنظيف المحتوى
    cartSliderItemsContainer.innerHTML = '';
    let totalQty = 0;
    let subtotal = 0;

    if (cartSliderItems.length === 0) {
      cartSliderItemsContainer.innerHTML = '<p class="empty-cart">السلة فارغة حاليا</p>';
    } else {
      cartSliderItems.forEach((item, index) => {
        totalQty += item.qty;
        subtotal += item.price * item.qty;

        const itemEl = document.createElement('div');
        itemEl.classList.add('cart-item');
        itemEl.innerHTML = `
                <div class="cart-item-header">
                    <strong>${item.title}</strong>
                    <button class="remove-item" data-index="${index}">🗑</button>
                </div>
                <div class="cart-item-details">
                    ${item.size ? `<span>الحجم: ${item.size}</span>` : ""}
                    ${item.rice ? `<span> | الرز: ${item.rice}</span>` : ""}
                </div>
                <div class="cart-controls">
                    <button class="qty-btn" data-index="${index}" data-action="minus">-</button>
                    <span class="qty-number">${item.qty}</span>
                    <button class="qty-btn" data-index="${index}" data-action="plus">+</button>
                    <span class="item-total">${(item.price * item.qty).toFixed(2)} ر.س</span>
                </div>
            `;
        cartSliderItemsContainer.appendChild(itemEl);
      });
    }

    // حساب رسوم التوصيل
let deliveryCharge = 0;
const deliveryMethodVal = deliveryMethod && deliveryMethod.value ? deliveryMethod.value : '';

if (deliveryMethodVal === "توصيل") {
  deliveryCharge = deliveryFee; // تتطبق على أي سعر
}

    // حساب الخصم
    const discountAmount = subtotal * currentDiscount;

    // المجموع النهائي
    const total = subtotal - discountAmount + deliveryCharge;

    // تحديث واجهة السلة
    cartCountEl.textContent = totalQty;
    cartTotalEl.innerHTML = `
        <div>المجموع الفرعي: ${subtotal.toFixed(2)} ر.س</div>
        ${deliveryCharge > 0 ? `<div>رسوم التوصيل: ${deliveryCharge.toFixed(2)} ر.س</div>` : ''}
        ${discountAmount > 0 ? `<div>تم تطبيق الخصم (${appliedDiscountCode}): ${discountAmount.toFixed(2)} ر.س</div>` : ''}
        <div>الإجمالي الكلي: ${total.toFixed(2)} ر.س</div>
    `;
  }

  /* ======================== فتح وإغلاق السلة ======================== */
  if (cartIcon) cartIcon.addEventListener('click', () => { if (cartSlider) cartSlider.classList.toggle('open'); });
  if (cartSliderClose) cartSliderClose.addEventListener('click', () => { if (cartSlider) cartSlider.classList.remove('open'); });

  

  /* ======================== تفعيل زر إضافة للسلة حسب الاختيارات ======================== */
document.querySelectorAll('.menu-item-card').forEach(card => {
  const addBtn = card.querySelector('.add-to-cart');
  const sizeBtns = card.querySelectorAll('.size-btn');
  const riceSelect = card.querySelector('.rice-select');

  function checkSelections() {
    let allSelected = true;

    if (sizeBtns.length) {
      const selectedSize = card.querySelector('.size-btn.active');
      if (!selectedSize) allSelected = false;
    }

    if (riceSelect) {
      if (!riceSelect.value) allSelected = false;
    }

    addBtn.disabled = !allSelected;
    addBtn.style.opacity = allSelected ? '1' : '0.5';
    addBtn.style.cursor = allSelected ? 'pointer' : 'not-allowed';
  }

  checkSelections();

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      checkSelections();
    });
  });

  if (riceSelect) {
    riceSelect.addEventListener('change', checkSelections);
  }

  /* ================= إضافة للسلة ================= */
  addBtn.addEventListener('click', () => {
    if (addBtn.disabled) return;

    const titleEl = card.querySelector('.menu-item-title');
    const qtyInput = card.querySelector('.quantity-input'); // span
    const priceEl = card.querySelector('.price');

    const title = titleEl ? titleEl.textContent.trim() : '';

    // ⭐⭐ التعديل المهم هنا ⭐⭐
    const qty = qtyInput ? (parseInt(qtyInput.textContent) || 1) : 1;

    const totalPriceNow = priceEl ? parseFloat(priceEl.textContent) : 0;
    const unitPrice = qty ? totalPriceNow / qty : totalPriceNow;

    const sizeEl = card.querySelector('.size-btn.active');
    const size = sizeEl ? sizeEl.textContent : '';

    const rice = riceSelect
      ? (riceSelect.options[riceSelect.selectedIndex]?.text || '')
      : '';

    const existing = cartSliderItems.find(
      i => i.title === title && i.size === size && i.rice === rice
    );

    if (existing) {
      existing.qty += qty;
      updateOutsideQty(title, size, rice, existing.qty);
    } else {
      cartSliderItems.push({
        title,
        price: unitPrice,
        qty,
        size,
        rice
      });
    }

    updateCartUI();

    // إعادة تعيين الاختيارات
    if (riceSelect) riceSelect.value = '';
    if (sizeBtns.length) sizeBtns.forEach(b => b.classList.remove('active'));
    checkSelections();
  });
});

  /* ======================== تغيير طريقة التوصيل ======================== */
  if (deliveryMethod) deliveryMethod.addEventListener('change', updateCartUI);

  /* ======================== أزرار + / - / حذف ======================== */
  if (cartSliderItemsContainer) {
    cartSliderItemsContainer.addEventListener('click', e => {
      const index = e.target.dataset.index;
      if (index === undefined) return;

      if (e.target.classList.contains('remove-item')) {
        cartSliderItems.splice(index, 1);
      } else if (e.target.dataset.action === 'plus') {
        if (cartSliderItems[index]) {
          cartSliderItems[index].qty++;
          updateOutsideQty(cartSliderItems[index].title, cartSliderItems[index].size, cartSliderItems[index].rice, cartSliderItems[index].qty);
        }
      } else if (e.target.dataset.action === 'minus') {
        if (cartSliderItems[index]) {
          cartSliderItems[index].qty = Math.max(1, cartSliderItems[index].qty - 1);
          updateOutsideQty(cartSliderItems[index].title, cartSliderItems[index].size, cartSliderItems[index].rice, cartSliderItems[index].qty);
        }
      }

      updateCartUI();
    });
  }

  /* ======================== تطبيق كود الخصم ======================== */
  if (applyDiscountBtn) {
    applyDiscountBtn.addEventListener('click', () => {
      const code = discountCodeInput ? discountCodeInput.value.trim().toUpperCase() : '';

      if (!code) {
        if (discountMessage) {
          discountMessage.textContent = "الكود غير صالح";
          discountMessage.style.color = "red";
        }
        currentDiscount = 0;
        appliedDiscountCode = "";
      } else if (usedCodes.includes(code)) {
        if (discountMessage) {
          discountMessage.textContent = "الكود غير صالح";
          discountMessage.style.color = "red";
        }
        currentDiscount = 0;
        appliedDiscountCode = "";
      } else if (discountCodes[code]) {
        currentDiscount = discountCodes[code];
        appliedDiscountCode = code;
        usedCodes.push(code);
        if (discountMessage) {
          discountMessage.textContent = `تم تطبيق الخصم ${currentDiscount * 100}%`;
          discountMessage.style.color = "green";
        }
      } else {
        currentDiscount = 0;
        appliedDiscountCode = "";
        if (discountMessage) {
          discountMessage.textContent = "الكود غير صالح";
          discountMessage.style.color = "red";
        }
      }

      updateCartUI();
    });
  }

  
  /* ======================== إرسال الطلب على واتساب ======================== */
if (sendOrderBtn) {
  sendOrderBtn.addEventListener('click', () => {

    if (!cartSliderItems.length) {
      alert("السلة فارغة يا بطل 🛒");
      return;
    }

    // بداية الرسالة
    let message = 'طلب جديد:\n';
    message += '-----------------------------\n\n';

    let subtotal = 0;

    // جمع بيانات المنتجات
    cartSliderItems.forEach(item => {
      const riceText = item.rice ? item.rice : "-";
      const sizeText = item.size ? item.size : "-";
      const itemTotal = item.price * item.qty;

      message += `(${sizeText} ${item.title})\n`;
      message += `نوع الرز: ${riceText}\n`;
      message += `الكمية: ${item.qty}\n`;
      message += `السعر: ${itemTotal.toFixed(2)} ر.س\n`;
      message += '-----------------------------\n';

      subtotal += itemTotal;
    });

    // حساب رسوم التوصيل
let deliveryCharge = 0;
const deliveryMethodVal = deliveryMethod && deliveryMethod.value ? deliveryMethod.value : '';

if (deliveryMethodVal === "توصيل") {
  deliveryCharge = deliveryFee; // تتطبق على أي سعر
}

    const discountAmount = subtotal * (currentDiscount || 0);
    const total = subtotal - discountAmount + deliveryCharge;

    // المجموعات
    message += `المجموع الفرعي: ${subtotal.toFixed(2)} ر.س\n`;
    if (discountAmount > 0) {
      message += `كود الخصم (${appliedDiscountCode || "-"}) : -${discountAmount.toFixed(2)} ر.س\n`;
    }
    if (deliveryCharge > 0) {
      message += `رسوم التوصيل: ${deliveryCharge.toFixed(2)} ر.س\n`;
    }
    message += `المجموع الكلي: ${total.toFixed(2)} ر.س\n\n`;

    // طريقة الدفع والاستلام
    const paymentText = paymentMethod && paymentMethod.value ? paymentMethod.value : "-";
    const deliveryText = deliveryMethod && deliveryMethod.value ? deliveryMethod.value : "-";

    message += `طريقة الدفع: ${paymentText}\n`;
    message += `طريقة الاستلام: ${deliveryText}\n`;

    // بيانات السيارة (إلزامية إذا اختر "تسليم إلى السيارة")
    if (deliveryText === "تسليم إلى السيارة") {
      const carType = document.getElementById("carType").value.trim();
      const carPlate = document.getElementById("carPlate").value.trim();

      if (!carType || !carPlate) {
        alert("برجاء إدخال بيانات السيارة كاملة");
        return;
      }

      message += `نوع السيارة: ${carType}\n`;
      message += `لوحة السيارة: ${carPlate}\n`;
    }

    message += '\n-----------------------------\n';

    // إرسال الواتساب
    const phone = "966539490701";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  });
}
   const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
    });
  }

  const aboutLink = document.querySelector('.mobile-menu a[href="#about"]');
  const aboutSection = document.getElementById('about');

  if (aboutLink && aboutSection) {
    aboutLink.addEventListener('click', (e) => {
      e.preventDefault(); // منع الانتقال الفوري
      aboutSection.classList.toggle('hidden'); // يظهر أو يختفي
      // اختياري: نزول سلس
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    });

    // إخفاء قسم من نحن عند الضغط على أي رابط غير من نحن
    document.querySelectorAll('.mobile-menu a').forEach(link => {
      if (link.getAttribute('href') !== '#about') {
        link.addEventListener('click', () => {
          aboutSection.classList.add('hidden');
        });
      }
    });
  }
});