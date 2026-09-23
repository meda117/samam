(() => {
  'use strict';

  const { getState, money, CART_KEY } = window.SamamData;
  let state;
  let activeCategory = 'all';
  let cart = readCart();
  let appliedCoupon = null;
  let checkoutStage = 'methods';
  const selections = new Map();

  const $ = (selector) => document.querySelector(selector);
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const visible = (items) => (items || []).filter((item) => item.active !== false);
  const whatsappUrl = (number) => {
    const digits = String(number || '').replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '#';
  };
  const productById = (id) => state.products.find((product) => product.id === id);
  const couponProductIds = (coupon) => coupon?.scope === 'products' ? (coupon.productIds || []) : null;
  const couponItems = (coupon) => {
    const allowed = couponProductIds(coupon);
    return allowed ? cart.filter((item) => allowed.includes(item.productId)) : [...cart];
  };
  const couponProductNames = (coupon) => [...new Set(couponItems(coupon).map((item) => item.name))];
  const couponScopeNames = (coupon) => {
    if (coupon?.scope !== 'products') return [];
    return (coupon.productIds || []).map((id) => productById(id)?.name).filter(Boolean);
  };
  const couponMethodNames = (coupon) => (coupon?.methodIds || []).map((id) => state.fulfillment.methods?.find((method) => method.id === id)?.name).filter(Boolean);
  const couponAnnouncementDefaults = {
    eyebrow: 'عرض خاص لك',
    title: 'وفّر في طلبك اليوم',
    discountLabel: 'خصم',
    codeLabel: 'كود العرض',
    copyButton: 'نسخ الكود',
    scopeLabel: 'يسري على',
    allScopeText: 'كل أصناف القائمة',
    methodsLabel: 'متاح مع',
    allMethodsText: 'كل طرق الاستلام',
    termsTitle: 'الشروط والأحكام',
    terms: []
  };
  function couponAnnouncementText(coupon) {
    const raw = coupon?.announcementText && typeof coupon.announcementText === 'object' ? coupon.announcementText : {};
    const terms = Array.isArray(raw.terms) ? raw.terms : String(raw.terms || '').split(/\r?\n/);
    return { ...couponAnnouncementDefaults, ...raw, terms: terms.map((term) => String(term || '').trim()).filter(Boolean) };
  }
  function configuredServingOptions(product) {
    const options = product?.servingOptions;
    if (!options || typeof options !== 'object') return [];
    return [
      { id: 'plain', label: 'سادة', ...options.plain },
      { id: 'rice', label: 'مع الرز', ...options.rice }
    ].filter((option) => option.enabled);
  }
  function servingOption(product, selection) {
    return configuredServingOptions(product).find((option) => option.id === selection?.servingId) || null;
  }
  function productSizes(product, selection) {
    const option = servingOption(product, selection);
    return option ? (option.sizes || []) : (product.sizes || []);
  }
  function riceForProduct(product, selection) {
    const option = servingOption(product, selection);
    const allowedIds = option?.id === 'rice' ? option.riceAllowedIds : product.riceAllowedIds;
    return visible(state.riceTypes).filter((rice) => allowedIds === null || allowedIds?.includes(rice.id));
  }
  function riceById(id, product, selection) { return riceForProduct(product || { riceAllowedIds: null }, selection).find((rice) => rice.id === id); }

  function readCart() {
    try { return JSON.parse(sessionStorage.getItem(CART_KEY)) || []; } catch (_) { return []; }
  }
  function saveCart() { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3000);
  }
  function currentSelection(product) {
    if (!selections.has(product.id)) {
      selections.set(product.id, { servingId: '', sizeId: '', riceId: '', quantity: 1 });
    }
    return selections.get(product.id);
  }
  function unitPrice(product, selection) {
    const option = servingOption(product, selection);
    const size = productSizes(product, selection).find((item) => item.id === selection.sizeId);
    const rice = riceById(selection.riceId, product, selection);
    const basePrice = option ? option.basePrice : product.basePrice;
    return Number(size ? size.price : basePrice) + Number(rice?.price || 0);
  }
  function categoryName(id) { return state.categories.find((category) => category.id === id)?.name || id; }
  function syncStickyBars() {
    const announcement = $('#announcement');
    document.documentElement.style.setProperty('--sticky-announcement-height', announcement && !announcement.hidden ? `${announcement.offsetHeight}px` : '0px');
  }

  function renderSite() {
    state = getState();
    document.documentElement.lang = 'ar';
    document.title = `${state.business.name} | طلبات أونلاين`;
    const { business, announcement } = state;
    const announcementEl = $('#announcement');
    announcementEl.hidden = !announcement.enabled || !announcement.text.trim();
    announcementEl.classList.toggle('is-static', announcement.moving === false);
    announcementEl.style.setProperty('--announcement-bg', announcement.backgroundColor || '#8f1832');
    announcementEl.style.setProperty('--announcement-text', announcement.textColor || '#fdf2d4');
    announcementEl.style.setProperty('--announcement-speed', `${Math.max(6, Number(announcement.speed || 18))}s`);
    announcementEl.innerHTML = announcement.linkUrl && announcement.linkText
      ? `<span>${esc(announcement.text)}</span><a href="${esc(announcement.linkUrl)}" target="_blank" rel="noopener">${esc(announcement.linkText)}</a>`
      : `<span>${esc(announcement.text)}</span>`;
    syncStickyBars();
    $('#headerLogo').src = business.headerLogo || business.logo;
    $('#headerLogo').alt = business.name;
    const compactScreen = window.matchMedia('(max-width: 540px)').matches;
    const configuredHeaderSize = Number(business.headerLogoSize || 315);
    const headerLogoCanvasSize = compactScreen
      ? Math.min(180, Math.max(165, configuredHeaderSize * .60))
      : Math.max(190, configuredHeaderSize * .60);
    $('#headerLogo').style.setProperty('width', `${headerLogoCanvasSize}px`, 'important');
    $('#headerLogo').style.setProperty('height', `${headerLogoCanvasSize}px`, 'important');
    $('#heroLogo').src = business.heroLogo || business.logo;
    const configuredHeroSize = Number(business.heroLogoSize || 580);
    const heroLogoCanvasSize = compactScreen
      ? Math.min(300, Math.max(260, configuredHeroSize * .48))
      : Math.min(390, Math.max(330, configuredHeroSize * .62));
    $('#heroLogo').style.setProperty('width', `${heroLogoCanvasSize}px`, 'important');
    $('#heroLogo').style.setProperty('height', `${heroLogoCanvasSize}px`, 'important');
    $('#heroLogo').style.setProperty('max-height', 'none', 'important');
    $('#heroLogo').style.setProperty('object-fit', 'contain', 'important');
    $('#heroTitle').textContent = business.heroTitle;
    const heroText = $('#heroText');
    if (heroText) heroText.remove();
    $('#menuKicker').textContent = business.menuKicker || 'اختر ما يناسبك';
    const service = $('#heroService');
    service.hidden = business.serviceEnabled === false || !String(business.serviceText || '').trim();
    const serviceCopy = esc(business.serviceText || '').replace(/\r?\n/g, '<br>');
    service.innerHTML = `<span class="service-attention" aria-hidden="true">!</span><div class="hero-service-content"><span class="hero-service-copy">${serviceCopy}</span><a href="${esc(whatsappUrl(business.serviceWhatsapp))}" target="_blank" rel="noopener">اضغط هنا</a></div>`;
    service.style.setProperty('--service-text-color', business.serviceTextColor || '#fdf2d4');
    // Inline important values make the catering callout immune to old cached
    // stylesheets. It sits in the upper-left area of the hero; its CTA is
    // centered underneath the multi-line text.
    service.style.setProperty('position', 'absolute', 'important');
    service.style.setProperty('left', '-50px', 'important');
    service.style.setProperty('right', 'auto', 'important');
    // Leave just enough room for the glowing exclamation mark above the copy.
    service.style.setProperty('top', compactScreen ? '38px' : '42px', 'important');
    service.style.setProperty('bottom', 'auto', 'important');
    service.style.setProperty('transform', 'none', 'important');
    service.style.setProperty('width', '210px', 'important');
    service.style.setProperty('display', 'flex', 'important');
    service.style.setProperty('flex-direction', 'column', 'important');
    service.style.setProperty('align-items', 'stretch', 'important');
    service.style.setProperty('gap', '7px', 'important');
    service.style.setProperty('text-align', 'center', 'important');
    $('#hero').style.backgroundImage = `url("${String(business.heroImage).replace(/"/g, '%22')}")`;
    $('#aboutTitle').textContent = business.aboutTitle;
    $('#aboutText').textContent = business.aboutText;
    $('#aboutCards').innerHTML = (business.aboutCards || []).map((card) => `<article class="about-box"><h3>${esc(card.title)}</h3><p>${esc(card.text)}</p></article>`).join('');
    renderFooter();
    renderCategories();
    renderMenu();
    renderCheckoutControls();
    renderCart();
    renderCouponAnnouncement();
  }

  function renderCouponAnnouncement() {
    const panel = $('#couponAnnouncement');
    if (!panel) return;
    const coupons = visible(state.coupons).filter((coupon) => coupon.announce);
    // الإغلاق يخص العرض الحالي فقط؛ مع إعادة تحميل الصفحة يظهر الإعلان مجددًا.
    panel.hidden = !coupons.length;
    if (panel.hidden) return;
    panel.innerHTML = `<div class="coupon-announcement-backdrop" data-action="close-coupon-announcement"></div><section class="coupon-announcement-card" role="dialog" aria-modal="true" aria-label="عروض وأكواد خصم"><button class="coupon-announcement-close" data-action="close-coupon-announcement" aria-label="إغلاق الإعلان">×</button><div class="coupon-announcement-list">${coupons.map((coupon) => {
      const text = couponAnnouncementText(coupon);
      const value = coupon.type === 'percent' ? `${Number(coupon.amount)}%` : money(coupon.amount, state.business.currency);
      const terms = text.terms.length ? `<section class="coupon-terms"><h3>${esc(text.termsTitle)}</h3><ul>${text.terms.map((term) => `<li>${esc(term)}</li>`).join('')}</ul></section>` : '';
      return `<article class="coupon-announcement-item"><header class="coupon-promo-head"><p class="coupon-announcement-kicker">${esc(text.eyebrow)}</p><h2>${esc(text.title)}</h2></header><div class="coupon-discount"><span>${esc(text.discountLabel)}</span><strong dir="ltr">${esc(value)}</strong></div><div class="coupon-code-box"><small>${esc(text.codeLabel)}</small><code>${esc(coupon.code)}</code><button data-action="copy-coupon" data-code="${esc(coupon.code)}">${esc(text.copyButton)}</button></div>${terms}</article>`;
    }).join('')}</div></section>`;
  }

  function renderFooter() {
    const footer = state.footer || {};
    const footerLogo = $('#footerLogo');
    footerLogo.src = footer.logo || state.business.logo;
    footerLogo.style.width = `${Math.max(240, Number(footer.logoSize || 260))}px`;
    footerLogo.style.height = 'auto';
    footerLogo.style.maxHeight = 'none';
    $('#footerName').textContent = state.business.name;
    $('#footerAddress').textContent = footer.address || state.business.address;
    $('#footerCopyright').textContent = `© ${new Date().getFullYear()} ${state.business.name}`;
    $('#footerContact').innerHTML = `<a class="footer-whatsapp footer-whatsapp-icon" href="${esc(whatsappUrl(state.business.contactWhatsapp))}" target="_blank" rel="noopener" aria-label="راسلنا عبر واتساب" title="راسلنا عبر واتساب"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.56 7.48L3 20.5l1.53-4.45A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.4 7.6c.2-.45.4-.46.7-.45h.55c.18 0 .42.07.5.36l.67 1.58c.07.19.04.39-.1.57l-.45.58c-.12.13-.1.3 0 .42.28.48.75 1.14 1.6 1.57.16.09.29.07.4-.05l.59-.69c.14-.16.3-.18.5-.1l1.5.7c.24.11.35.23.36.4.02.55-.23 1.14-.66 1.38-.34.2-.8.32-1.34.16-1.04-.32-2.28-1.1-3.36-2.08-1.01-.93-1.9-2.12-2.14-3.22-.12-.56-.04-1.03.18-1.48Z"/></svg></a>`;
    $('#footerSocial').innerHTML = visible(footer.social || []).map((item) => `<a href="${esc(item.url || '#')}" target="_blank" rel="noopener" aria-label="${esc(item.label)}"><img src="${esc(item.image)}" alt="${esc(item.label)}"></a>`).join('') || '<span class="footer-empty">لا توجد روابط اجتماعية مضافة.</span>';
    $('#footerDelivery').innerHTML = visible(footer.deliveryApps || []).map((item) => `<a href="${esc(item.url || '#')}" target="_blank" rel="noopener" aria-label="${esc(item.label)}"><img src="${esc(item.image)}" alt="${esc(item.label)}"></a>`).join('') || '<span class="footer-empty">لا توجد تطبيقات توصيل مضافة.</span>';
  }

  function renderCategories() {
    const categories = visible(state.categories).filter((category) => state.products.some((product) => product.active !== false && product.category === category.id));
    if (activeCategory !== 'all' && !categories.some((category) => category.id === activeCategory)) activeCategory = 'all';
    $('#categoryTabs').innerHTML = [
      `<button class="category-tab ${activeCategory === 'all' ? 'active' : ''}" data-action="category" data-category="all">الكل</button>`,
      ...categories.map((category) => `<button class="category-tab ${activeCategory === category.id ? 'active' : ''}" data-action="category" data-category="${esc(category.id)}">${esc(category.name)}</button>`)
    ].join('');
  }

  function renderMenu() {
    const products = visible(state.products).filter((product) => activeCategory === 'all' || product.category === activeCategory);
    if (activeCategory === 'all') {
      const categoryOrder = new Map(state.categories.map((category, index) => [category.id, index]));
      products.sort((first, second) => (categoryOrder.get(first.category) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(second.category) ?? Number.MAX_SAFE_INTEGER));
    }
    $('#emptyMenu').hidden = products.length > 0;
    $('#menuGrid').innerHTML = products.map(renderProduct).join('');
  }

  // يطلب ImageKit نسخة مناسبة لمقاس الكارت بدلاً من تنزيل الصورة الأصلية الكبيرة.
  // لا نعدل الرابط إذا كان يحتوي بالفعل على تحويل ImageKit مخصص.
  function optimizedImageUrl(source, width = 720) {
    const value = String(source || '');
    if (!/^https:\/\/ik\.imagekit\.io\//i.test(value) || /\/tr:[^/]+\//.test(value)) return value;
    try {
      const url = new URL(value);
      const parts = url.pathname.split('/');
      if (!parts[1]) return value;
      parts.splice(2, 0, `tr:w-${Math.max(120, Math.round(width))},q-75,f-auto`);
      url.pathname = parts.join('/');
      return url.toString();
    } catch (_) { return value; }
  }

  function renderProduct(product) {
    const selection = currentSelection(product);
    const servingOptions = configuredServingOptions(product);
    const needsServing = servingOptions.length > 1 && !selection.servingId;
    if (servingOptions.length === 1 && selection.servingId !== servingOptions[0].id) {
      selection.servingId = servingOptions[0].id;
      selection.sizeId = '';
      selection.riceId = '';
    }
    if (selection.servingId && !servingOptions.some((option) => option.id === selection.servingId)) {
      selection.servingId = '';
      selection.sizeId = '';
      selection.riceId = '';
    }
    const activeServing = servingOption(product, selection);
    const sizes = productSizes(product, selection);
    if (selection.sizeId && !sizes.some((size) => size.id === selection.sizeId)) selection.sizeId = '';
    const productRiceTypes = riceForProduct(product, selection);
    const needsRice = activeServing ? activeServing.id === 'rice' : Boolean(product.requiresRice);
    if (selection.riceId && !productRiceTypes.some((rice) => rice.id === selection.riceId)) selection.riceId = '';
    const hasSizes = sizes.length > 0;
    const needsSize = hasSizes && !selection.sizeId;
    const missingServingSize = Boolean(activeServing) && !hasSizes;
    const missingRiceType = needsRice && !productRiceTypes.length;
    const cardDisabled = needsServing || missingServingSize || needsSize || (needsRice && !selection.riceId) || missingRiceType;
    const servingPicker = servingOptions.length > 1 ? `<div class="serving-picker" aria-label="اختر طريقة تقديم الصنف"><p class="size-picker-title">اختر طلبك أولًا</p><div class="option-row serving-options">${servingOptions.map((option) => `<button type="button" class="choice serving-choice ${selection.servingId === option.id ? 'selected' : ''}" data-action="select-serving" data-product-id="${esc(product.id)}" data-serving-id="${esc(option.id)}"><strong>${esc(option.label)}</strong></button>`).join('')}</div></div>` : '';
    const sizeOptions = !needsServing && hasSizes ? `<div class="size-picker" aria-label="اختر الحجم"><p class="size-picker-title">اختر الحجم أو الكمية${activeServing ? ` (${esc(activeServing.label)})` : ''}</p><div class="option-row size-options">${sizes.map((size) => `<button type="button" class="choice ${selection.sizeId === size.id ? 'selected' : ''}" data-action="select-size" data-product-id="${esc(product.id)}" data-size-id="${esc(size.id)}"><strong>${esc(size.label)}</strong><small>${money(size.price, state.business.currency)}</small></button>`).join('')}</div></div>` : '';
    const riceOptions = !needsServing && needsRice && productRiceTypes.length ? `<label class="select-label">نوع الرز<select data-action="select-rice" data-product-id="${esc(product.id)}"><option value="">اختر نوع الرز</option>${productRiceTypes.map((rice) => `<option value="${esc(rice.id)}" ${selection.riceId === rice.id ? 'selected' : ''}>${esc(rice.name)}${Number(rice.price) ? ` (+${money(rice.price, state.business.currency)})` : ''}</option>`).join('')}</select></label>` : '';
    const price = unitPrice(product, selection);
    const discountPercent = Number(product.oldPrice) > price ? Math.round((1 - price / Number(product.oldPrice)) * 100) : 0;
    return `<article class="product-card" data-product-id="${esc(product.id)}">
      <div class="product-image"><img src="${esc(optimizedImageUrl(product.image))}" alt="${esc(product.name)}" loading="lazy" decoding="async" onerror="this.closest('.product-image').classList.add('missing-image')">${product.badge ? `<span class="badge">${esc(product.badge)}</span>` : ''}${discountPercent ? `<span class="discount-badge">خصم ${discountPercent}%</span>` : ''}${product.calories ? `<span class="calories">${esc(product.calories)} سعرة</span>` : ''}</div>
      <div class="product-body"><div><p class="product-category">${esc(categoryName(product.category))}</p><h3>${esc(product.name)}</h3><p class="product-description">${esc(product.description || '')}</p></div>
       ${servingPicker}${sizeOptions}${riceOptions}
       <div class="product-bottom"><div><span class="product-price">${needsServing ? 'اختر سادة أو مع الرز' : (missingServingSize ? 'أضف حجمًا أو كمية لهذا الاختيار' : (needsSize ? 'اختر الحجم أولًا' : (missingRiceType ? 'لا يوجد نوع رز متاح' : money(price, state.business.currency))))}</span>${!needsServing && !missingServingSize && !needsSize && Number(product.oldPrice) > price ? `<del>${money(product.oldPrice, state.business.currency)}</del>` : ''}</div>
         <div class="quantity-control" aria-label="الكمية"><button data-action="change-quantity" data-product-id="${esc(product.id)}" data-change="-1" aria-label="إنقاص الكمية">−</button><span>${selection.quantity}</span><button data-action="change-quantity" data-product-id="${esc(product.id)}" data-change="1" aria-label="زيادة الكمية">+</button></div></div>
       <button class="add-button" data-action="add-cart" data-product-id="${esc(product.id)}" ${cardDisabled ? 'disabled' : ''}>${cardDisabled ? (needsServing ? 'اختر سادة أو مع الرز أولًا' : (missingServingSize ? 'لا توجد أحجام أو كميات لهذا الاختيار' : (needsSize ? 'اختر الحجم أو الكمية أولًا' : (missingRiceType ? 'لا يوجد نوع رز متاح' : 'اختر نوع الرز أولًا')))) : 'أضف إلى السلة'}</button></div>
    </article>`;
  }

  function renderContact() {
    const { business } = state;
    $('#contactCards').innerHTML = `<a class="contact-card" href="tel:${esc(business.phone)}"><span>📞</span><div><small>اتصل بنا</small><strong>${esc(business.phone)}</strong></div></a>
      <a class="contact-card" href="https://wa.me/${esc(business.whatsapp)}" target="_blank" rel="noopener"><span>💬</span><div><small>واتساب</small><strong>راسلنا مباشرة</strong></div></a>
      <div class="contact-card"><span>📍</span><div><small>العنوان</small><strong>${esc(business.address)}</strong></div></div>`;
  }

  function renderCheckoutControls() {
    const methods = (state.fulfillment.methods || []).filter((method) => method.enabled !== false && method.active !== false && (method.kind !== 'delivery' || state.fulfillment.delivery.enabled));
    const payments = (state.fulfillment.payments || []).filter((payment) => payment.enabled !== false && payment.active !== false);
    const methodEl = $('#fulfillmentMethod');
    const paymentEl = $('#paymentMethod');
    const priorMethod = methodEl.value;
    const priorPayment = paymentEl.value;
    methodEl.innerHTML = `<option value="">اختر طريقة الاستلام</option>${methods.map((method) => `<option value="${esc(method.id)}">${esc(method.name)}</option>`).join('')}`;
    paymentEl.innerHTML = `<option value="">اختر طريقة الدفع</option>${payments.map((payment) => `<option value="${esc(payment.id)}">${esc(payment.name)}</option>`).join('')}`;
    if (methods.some((method) => method.id === priorMethod)) methodEl.value = priorMethod;
    if (payments.some((payment) => payment.id === priorPayment)) paymentEl.value = priorPayment;
    updateCheckoutStage({ refreshMethodFields: true });
  }

  function selectedMethod() {
    return (state.fulfillment.methods || []).find((method) => method.id === $('#fulfillmentMethod').value && method.enabled !== false && method.active !== false && (method.kind !== 'delivery' || state.fulfillment.delivery.enabled));
  }

  function selectedPayment() {
    return (state.fulfillment.payments || []).find((payment) => payment.id === $('#paymentMethod').value && payment.enabled !== false && payment.active !== false);
  }

  function renderMethodExtraFields(method) {
    $('#methodExtraFields').innerHTML = method ? (method.fields || []).map((field) => `<label>${esc(field.label)}<input name="method-field-${esc(field.id)}" type="${esc(field.type || 'text')}" ${field.required ? 'required' : ''} autocomplete="off" placeholder="${esc(field.placeholder || '')}"></label>`).join('') : '';
  }

  function updateCheckoutStage({ forceMethods = false, refreshMethodFields = false } = {}) {
    const method = selectedMethod();
    const payment = selectedPayment();
    const readyForDetails = Boolean(method && payment);
    if (forceMethods || !readyForDetails) checkoutStage = 'methods';
    else checkoutStage = 'details';

    if (refreshMethodFields) renderMethodExtraFields(method);

    const showDetails = checkoutStage === 'details' && readyForDetails;
    const methods = $('#checkoutMethods');
    const details = $('#customerDetails');
    const submit = $('[data-action="send-order"]');
    methods.hidden = showDetails;
    details.hidden = !showDetails;
    details.disabled = !showDetails;
    $('#methodHint').hidden = showDetails;
    submit.hidden = !showDetails;
    submit.disabled = !showDetails || !cart.length;
    renderCart();
  }

  function couponEligibility(coupon) {
    if (!coupon || coupon.active === false) return { valid: false, reason: 'كود الخصم غير صالح أو متوقف.' };
    const method = selectedMethod();
    const allowedMethods = coupon.methodIds || [];
    if (allowedMethods.length && !method) return { valid: false, reason: 'اختر طريقة الاستلام أولًا لمعرفة صلاحية الكود.' };
    if (allowedMethods.length && !allowedMethods.includes(method.id)) return { valid: false, reason: `هذا الكود غير متاح مع «${method.name}».` };
    const items = couponItems(coupon);
    const eligibleSubtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    if (!items.length) return { valid: false, reason: 'لا يوجد في السلة صنف مشمول بهذا الكود.', items, eligibleSubtotal };
    if (eligibleSubtotal < Number(coupon.minimum || 0)) return { valid: false, reason: `الحد الأدنى للأصناف المشمولة هو ${money(coupon.minimum, state.business.currency)}.`, items, eligibleSubtotal };
    return { valid: true, items, eligibleSubtotal, productNames: [...new Set(items.map((item) => item.name))] };
  }

  function couponDiscount(coupon, eligibility) {
    if (!coupon || !eligibility?.valid) return 0;
    const calculated = coupon.type === 'fixed'
      ? Number(coupon.amount || 0)
      : eligibility.eligibleSubtotal * (Number(coupon.amount || 0) / 100);
    return Math.min(calculated, eligibility.eligibleSubtotal);
  }

  function totals() {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const method = selectedMethod();
    const deliverySettings = state.fulfillment.delivery;
    const eligibility = appliedCoupon ? couponEligibility(appliedCoupon) : null;
    const discount = couponDiscount(appliedCoupon, eligibility);
    // أهلية التوصيل المجاني تُحسب بعد الخصم، لا قبل تطبيق كود الخصم.
    const payableProducts = Math.max(0, subtotal - discount);
    const qualifiesForFree = deliverySettings.freeEnabled && (!Number(deliverySettings.freeOver) || payableProducts >= Number(deliverySettings.freeOver));
    const delivery = method?.kind === 'delivery' && deliverySettings.enabled && !qualifiesForFree ? Number(deliverySettings.fee || 0) : 0;
    return { subtotal, delivery, discount, total: Math.max(0, subtotal + delivery - discount), eligibility };
  }

  function renderCart() {
    const itemsEl = $('#cartItems');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    $('#cartCount').textContent = cartCount;
    const couponResult = appliedCoupon ? couponEligibility(appliedCoupon) : null;
    const discountedKeys = new Set(couponResult?.valid ? couponResult.items.map((item) => item.key) : []);
    itemsEl.innerHTML = cart.length ? cart.map((item, index) => {
      const productImage = productById(item.productId)?.image || '';
      const image = productImage
        ? `<img class="cart-item-image" src="${esc(optimizedImageUrl(productImage, 180))}" alt="صورة ${esc(item.name)}" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('missing-image');this.remove()">`
        : '<span class="cart-item-image-placeholder" aria-hidden="true">🍽</span>';
      return `<div class="cart-item"><div class="cart-item-image-wrap">${image}</div><div class="cart-item-info"><strong>${esc(item.name)}</strong><small>${[item.servingLabel, item.sizeLabel, item.riceName].filter(Boolean).map(esc).join(' • ')}</small>${discountedKeys.has(item.key) ? `<em class="coupon-item-note">يشمله خصم ${esc(appliedCoupon.code)}</em>` : ''}<span>${money(item.price, state.business.currency)} × ${item.quantity}</span></div><div class="cart-item-actions"><button data-action="cart-quantity" data-index="${index}" data-change="1" aria-label="زيادة">+</button><button data-action="cart-quantity" data-index="${index}" data-change="-1" aria-label="إنقاص">−</button><button class="remove" data-action="remove-cart" data-index="${index}" aria-label="حذف">×</button></div></div>`;
    }).join('') : '<p class="empty-cart">السلة فارغة. أضف أصنافك المفضلة للبدء.</p>';
    const { subtotal, delivery, discount, total, eligibility } = totals();
    const appliedNames = eligibility?.valid ? eligibility.productNames.join(' • ') : '';
    const couponDetail = appliedCoupon && eligibility?.valid ? `<p class="coupon-summary-note">تم تطبيق ${esc(appliedCoupon.code)} على: ${esc(appliedNames)}.</p>` : (appliedCoupon && eligibility ? `<p class="coupon-summary-note coupon-summary-error">${esc(eligibility.reason)}</p>` : '');
    $('#cartSummary').innerHTML = `<div><span>المجموع الفرعي</span><strong>${money(subtotal, state.business.currency)}</strong></div>${delivery ? `<div><span>رسوم التوصيل</span><strong>${money(delivery, state.business.currency)}</strong></div>` : ''}${discount ? `<div class="discount-line"><span>خصم ${esc(appliedCoupon.code)}</span><strong>− ${money(discount, state.business.currency)}</strong></div>` : ''}${couponDetail}<div class="grand-total"><span>الإجمالي</span><strong>${money(total, state.business.currency)}</strong></div>`;
    const checkoutSubmit = $('[data-action="send-order"]');
    if (checkoutSubmit) checkoutSubmit.disabled = !cart.length || $('#customerDetails').hidden;
  }

  function addToCart(productId) {
    const product = productById(productId);
    if (!product || product.active === false) return;
    const selection = currentSelection(product);
    const servingOptions = configuredServingOptions(product);
    if (servingOptions.length > 1 && !selection.servingId) { showToast('اختر سادة أو مع الرز قبل إضافة الصنف.'); return; }
    if (servingOptions.length === 1) selection.servingId = servingOptions[0].id;
    const activeServing = servingOption(product, selection);
    const sizes = productSizes(product, selection);
    const needsRice = activeServing ? activeServing.id === 'rice' : Boolean(product.requiresRice);
    if (sizes.length && !selection.sizeId) { showToast('اختر الحجم أو الكمية قبل إضافة الصنف.'); return; }
    if (needsRice && !selection.riceId) { showToast('اختر نوع الرز قبل إضافة الصنف.'); return; }
    const size = sizes.find((entry) => entry.id === selection.sizeId);
    const rice = riceById(selection.riceId, product, selection);
    const key = [product.id, selection.servingId, selection.sizeId, selection.riceId].join('|');
    const existing = cart.find((item) => item.key === key);
    if (existing) existing.quantity += selection.quantity;
    else cart.push({ key, productId: product.id, servingId: selection.servingId, sizeId: selection.sizeId, riceId: selection.riceId, name: product.name, servingLabel: activeServing?.label || '', sizeLabel: size?.label || '', riceName: rice?.name || '', price: unitPrice(product, selection), quantity: selection.quantity });
    selection.quantity = 1;
    saveCart();
    renderMenu();
    renderCart();
    showToast('تمت إضافة الصنف إلى السلة.');
  }

  function applyCoupon() {
    const code = $('#couponInput').value.trim().toUpperCase();
    const message = $('#couponMessage');
    if (!code) { appliedCoupon = null; message.textContent = ''; renderCart(); return; }
    const coupon = visible(state.coupons).find((item) => item.code.toUpperCase() === code);
    if (!coupon) { appliedCoupon = null; message.textContent = 'كود الخصم غير صالح.'; message.className = 'form-message error'; renderCart(); return; }
    const eligibility = couponEligibility(coupon);
    if (!eligibility.valid) { appliedCoupon = null; message.textContent = eligibility.reason; message.className = 'form-message error'; renderCart(); return; }
    appliedCoupon = coupon;
    message.textContent = `تم تطبيق الكود على: ${eligibility.productNames.join(' • ')}. سيُثبت استخدامه عند إرسال الطلب.`;
    message.className = 'form-message success';
    renderCart();
  }

  async function sendOrder() {
    if (!cart.length) { showToast('السلة فارغة حاليًا.'); return; }
    const form = $('#checkoutForm');
    if (!form.reportValidity()) return;
    const method = selectedMethod();
    const payment = visible(state.fulfillment.payments).find((entry) => entry.id === $('#paymentMethod').value);
    if (!method || !payment) { showToast('اختر طريقة الاستلام والدفع أولًا.'); return; }
    const number = String(state.business.whatsapp || '').replace(/\D/g, '');
    if (!number) { showToast('أضف رقم واتساب المطعم من لوحة التحكم أولًا.'); return; }
    const couponEligibilityResult = appliedCoupon ? couponEligibility(appliedCoupon) : null;
    if (appliedCoupon && !couponEligibilityResult.valid) {
      $('#couponMessage').textContent = couponEligibilityResult.reason;
      $('#couponMessage').className = 'form-message error';
      renderCart();
      return;
    }
    let sum = totals();
    const submit = $('[data-action="send-order"]');
    // نحجز نافذة واتساب داخل نقرة العميل نفسها حتى لا يحجبها المتصفح بعد
    // انتظار تأكيد الخادم لكود الخصم.
    const orderWindow = appliedCoupon ? window.open('', '_blank') : null;
    if (appliedCoupon) {
      submit.disabled = true;
      submit.textContent = 'جارٍ تأكيد الخصم…';
      try {
        const confirmation = await window.SamamData.redeemCoupon({
          code: appliedCoupon.code,
          customer: { name: $('#customerName').value.trim(), phone: $('#customerPhone').value.trim() },
          methodId: method.id,
          items: cart.map((item) => ({ productId: item.productId, servingId: item.servingId || '', sizeId: item.sizeId || '', riceId: item.riceId || '', quantity: Number(item.quantity || 1) })),
          deviceId: getCouponDeviceId()
        });
        const confirmedDiscount = Number(confirmation.discount || 0);
        sum = { ...sum, discount: confirmedDiscount, total: Math.max(0, sum.subtotal + sum.delivery - confirmedDiscount) };
        appliedCoupon = { ...appliedCoupon, redemptionId: confirmation.redemptionId, confirmedDiscount };
      } catch (error) {
        orderWindow?.close();
        const message = error?.message || 'تعذر تأكيد كود الخصم.';
        $('#couponMessage').textContent = message;
        $('#couponMessage').className = 'form-message error';
        showToast(message);
        return;
      } finally {
        submit.disabled = false;
        submit.textContent = 'إرسال الطلب عبر واتساب';
      }
    }
    const lines = cart.map((item, index) => `${index + 1}. ${item.name}${item.servingLabel ? ` (${item.servingLabel})` : ''}${item.sizeLabel ? ` (${item.sizeLabel})` : ''}${item.riceName ? ` - ${item.riceName}` : ''}\n   الكمية: ${item.quantity} | الإجمالي: ${money(item.price * item.quantity, state.business.currency)}`);
    const separator = '--------------------';
    const discountedProducts = couponEligibilityResult?.productNames?.join(' • ') || '';
    const couponDescription = appliedCoupon?.type === 'percent'
      ? `نسبة الخصم: ${Number(appliedCoupon.amount || 0)}%`
      : (appliedCoupon ? `قيمة الخصم المحددة: ${money(appliedCoupon.amount || 0, state.business.currency)}` : '');
    const deliveryLine = method?.kind === 'delivery'
      ? (sum.delivery ? `رسوم التوصيل: ${money(sum.delivery, state.business.currency)}` : 'التوصيل: مجاني')
      : '';
    const details = [
      '🛍️ *طلب جديد*', `*${state.business.name}*`, separator,
      '📦 *تفاصيل الأصناف*', ...lines, separator,
      '💳 *ملخص الحساب*',
      `المجموع الفرعي: ${money(sum.subtotal, state.business.currency)}`,
      deliveryLine,
      appliedCoupon ? `كود الخصم: ${appliedCoupon.code}` : '',
      couponDescription,
      appliedCoupon && discountedProducts ? `الأصناف المشمولة: ${discountedProducts}` : '',
      appliedCoupon ? `قيمة الخصم المطبقة: ${money(sum.discount, state.business.currency)} (لا يشمل التوصيل)` : '',
      `*الإجمالي النهائي: ${money(sum.total, state.business.currency)}*`, separator,
      '🚚 *الاستلام والدفع*', `طريقة الاستلام: ${method?.name || ''}`, `طريقة الدفع: ${payment?.name || ''}`, separator,
      '👤 *بيانات العميل*', `الاسم: ${$('#customerName').value.trim()}`, `رقم الجوال: ${$('#customerPhone').value.trim()}`,
      ...(method?.fields || []).map((field) => `${field.label}: ${form.elements[`method-field-${field.id}`]?.value.trim() || ''}`),
      separator, 'شكرًا لطلبك 🌟'
    ].filter(Boolean).join('\n');
    const whatsappOrderUrl = `https://wa.me/${number}?text=${encodeURIComponent(details)}`;
    if (orderWindow) orderWindow.location.href = whatsappOrderUrl;
    else window.open(whatsappOrderUrl, '_blank', 'noopener');
    cart = [];
    appliedCoupon = null;
    saveCart();
    renderCart();
  }

  function getCouponDeviceId() {
    const key = 'samam-coupon-device-id';
    let value = localStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, value);
    }
    return value;
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('a[href="#top"], a[href="#menu"], a[href="#contact"]')) {
      const about = $('#about');
      about.hidden = true;
      about.classList.add('hidden');
      $('#mobileMenu').classList.remove('open');
      $('.mobile-menu-backdrop').classList.remove('show');
    }
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const { action, productId, sizeId, servingId, category, change, index } = actionEl.dataset;
    if (action === 'category') { activeCategory = category; renderCategories(); renderMenu(); }
    if (action === 'show-all') { activeCategory = 'all'; renderCategories(); renderMenu(); }
    if (action === 'close-coupon-announcement') {
      $('#couponAnnouncement').hidden = true;
    }
    if (action === 'copy-coupon') {
      const code = actionEl.dataset.code || '';
      const copied = navigator.clipboard?.writeText ? navigator.clipboard.writeText(code) : Promise.reject(new Error());
      copied.then(() => showToast(`تم نسخ كود ${code}.`)).catch(() => {
        const input = document.createElement('textarea'); input.value = code; document.body.append(input); input.select(); document.execCommand('copy'); input.remove(); showToast(`تم نسخ كود ${code}.`);
      });
    }
    if (action === 'toggle-mobile-menu') { $('#mobileMenu').classList.add('open'); $('.mobile-menu-backdrop').classList.add('show'); }
    if (action === 'close-mobile-menu') { $('#mobileMenu').classList.remove('open'); $('.mobile-menu-backdrop').classList.remove('show'); }
    if (action === 'toggle-about') { event.preventDefault(); $('#mobileMenu').classList.remove('open'); $('.mobile-menu-backdrop').classList.remove('show'); const about = $('#about'); const next = about.hidden; about.hidden = !next; about.classList.toggle('hidden', !next); if (next) setTimeout(() => about.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }
    if (action === 'select-serving') { const selection = currentSelection(productById(productId)); selection.servingId = servingId; selection.sizeId = ''; selection.riceId = ''; renderMenu(); }
    if (action === 'select-size') { const selection = currentSelection(productById(productId)); selection.sizeId = sizeId; renderMenu(); }
    if (action === 'change-quantity') { const selection = currentSelection(productById(productId)); selection.quantity = Math.max(1, selection.quantity + Number(change)); renderMenu(); }
    if (action === 'add-cart') addToCart(productId);
    if (action === 'open-cart') { $('#cartDrawer').classList.add('open'); $('#drawerBackdrop').classList.add('show'); $('#cartDrawer').setAttribute('aria-hidden', 'false'); }
    if (action === 'close-cart') { $('#cartDrawer').classList.remove('open'); $('#drawerBackdrop').classList.remove('show'); $('#cartDrawer').setAttribute('aria-hidden', 'true'); }
    if (action === 'cart-quantity') { const item = cart[Number(index)]; if (item) { item.quantity += Number(change); if (item.quantity < 1) cart.splice(Number(index), 1); saveCart(); renderCart(); } }
    if (action === 'remove-cart') { cart.splice(Number(index), 1); saveCart(); renderCart(); }
    if (action === 'apply-coupon') applyCoupon();
    if (action === 'edit-checkout-methods') updateCheckoutStage({ forceMethods: true });
    if (action === 'send-order') sendOrder();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('a[href="#top"], a[href="#menu"], a[href="#contact"]')) return;
    const about = $('#about');
    about.hidden = true;
    about.classList.add('hidden');
    $('#mobileMenu').classList.remove('open');
    $('.mobile-menu-backdrop').classList.remove('show');
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-action="select-rice"]')) { const selection = currentSelection(productById(event.target.dataset.productId)); selection.riceId = event.target.value; renderMenu(); }
    if (event.target.id === 'fulfillmentMethod') updateCheckoutStage({ refreshMethodFields: true });
    if (event.target.id === 'paymentMethod') updateCheckoutStage();
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#about') return;
    const about = $('#about');
    about.hidden = true;
    about.classList.add('hidden');
  });
  window.addEventListener('resize', syncStickyBars);
  window.addEventListener('storage', (event) => { if (event.key === window.SamamData.STORAGE_KEY) { appliedCoupon = null; renderSite(); } });
  window.addEventListener('samam:data:changed', renderSite);
  document.addEventListener('DOMContentLoaded', () => {
    // الواجهة تظهر فورًا بالبيانات المخزنة، ثم تتحدّث وحدها عند وصول Firebase.
    renderSite();
    window.SamamData.load();
  });
})();
