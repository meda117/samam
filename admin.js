(() => {
  'use strict';
  const { getState, setState, resetState, copy, money, uid } = window.SamamData;
  let state = getState();
  let page = 'overview';
  let productFilter = 'all';
  let editorProduct = null;
  let editorCoupon = null;
  const $ = (selector) => document.querySelector(selector);
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const activeItems = (items) => (items || []).filter((item) => item.active !== false);
  const pageInfo = { overview: ['نظرة عامة', 'ملخص المطعم'], products: ['الأصناف والأسعار', 'إدارة المنيو'], rice: ['أنواع الرز', 'الخيارات والإضافات'], fulfillment: ['التوصيل والاستلام', 'رسوم وخيارات الطلب'], coupons: ['أكواد الخصم', 'العروض الترويجية'], content: ['محتوى الموقع', 'الهوية والمعلومات'], backup: ['النسخ الاحتياطي', 'البيانات والإعدادات'] };

  function toast(message) { const el = $('#adminToast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600); }
  function persist(message = 'تم الحفظ وتحديث الموقع.') {
    const announcementMoving = document.querySelector('#contentForm input[name="announcementMoving"]');
    if (announcementMoving) state.announcement.moving = announcementMoving.checked;
    window.SamamData.setState(state);
    $('#saveStatus').textContent = 'جارٍ الحفظ...';
    window.SamamData.save(state).then((result) => {
      $('#saveStatus').textContent = result.remote ? 'تم الحفظ لكل الأجهزة' : 'تم الحفظ';
      toast(message);
    }).catch((error) => {
      $('#saveStatus').textContent = 'تعذر الحفظ في Firebase';
      toast(error.code === 'auth/required' ? 'سجّل الدخول بحساب الأدمن قبل الحفظ.' : 'تعذر الحفظ. تحقق من إعدادات Firebase وقواعد قاعدة البيانات.');
    });
  }
  function categoryName(id) { return state.categories.find((category) => category.id === id)?.name || id; }
  function productCount(categoryId) { return state.products.filter((product) => product.category === categoryId && product.active !== false).length; }
  function number(value) { return Number(value || 0); }

  function render() {
    state = getState();
    const [title, kicker] = pageInfo[page];
    $('#pageTitle').textContent = title;
    $('#pageKicker').textContent = kicker;
    document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
    $('#adminMain').innerHTML = ({ overview: overviewPage, products: productsPage, rice: ricePage, fulfillment: fulfillmentPage, coupons: couponsPage, content: contentPage, backup: backupPage })[page]();
    if (page === 'products') addProductOrderControls();
  }

  function overviewPage() {
    const liveProducts = activeItems(state.products).length;
    const liveCoupons = activeItems(state.coupons).length;
    const delivery = state.fulfillment.delivery;
    return `<div class="page-intro"><div><h2>أهلًا بك في إدارة ${esc(state.business.name)}</h2><p>عدّل بيانات المطعم وستظهر في صفحة الطلبات فورًا على نفس المتصفح.</p></div><a class="primary" href="index.html" target="_blank" rel="noopener">↗ افتح الموقع</a></div>
      <section class="stats-grid"><article class="stat-card"><small>الأصناف المتاحة</small><strong>${liveProducts}</strong><span>من أصل ${state.products.length} صنف</span></article><article class="stat-card"><small>أنواع الرز الفعالة</small><strong>${activeItems(state.riceTypes).length}</strong><span>خيارات مضافة للوجبات</span></article><article class="stat-card"><small>أكواد الخصم</small><strong>${liveCoupons}</strong><span>أكواد مفعلة الآن</span></article><article class="stat-card"><small>رسوم التوصيل</small><strong>${money(delivery.fee, state.business.currency)}</strong><span>${delivery.enabled ? 'خدمة التوصيل مفعلة' : 'خدمة التوصيل متوقفة'}</span></article></section>
      <section class="dashboard-grid"><article class="panel"><h3>اختصارات سريعة</h3><div class="quick-actions"><button class="quick-action" data-action="add-product">＋ إضافة صنف جديد</button><button class="quick-action" data-go="coupons">٪ إنشاء كود خصم</button><button class="quick-action" data-go="fulfillment">⌁ تعديل رسوم التوصيل</button><button class="quick-action" data-go="content">✦ تعديل الإعلان والمحتوى</button></div></article><article class="panel"><h3>حالة المتجر</h3><ul class="activity-list"><li><strong>${state.announcement.enabled ? 'شريط الإعلان ظاهر' : 'شريط الإعلان مخفي'}</strong><span>${esc(state.announcement.text || 'لا توجد رسالة إعلان')}</span></li><li><strong>${state.fulfillment.methods.filter((method) => method.enabled).length} طرق استلام مفعلة</strong><span>${state.fulfillment.delivery.enabled ? 'التوصيل متاح للعملاء' : 'التوصيل متوقف حاليًا'}</span></li><li><strong>${activeItems(state.products).length} أصناف منشورة</strong><span>يمكن إخفاء أي صنف مؤقتًا بدل حذفه.</span></li></ul></article></section>`;
  }

  function productsPage() {
    const products = state.products.filter((product) => productFilter === 'all' || product.category === productFilter);
    if (productFilter === 'all') {
      const categoryOrder = new Map(state.categories.map((category, index) => [category.id, index]));
      products.sort((first, second) => (categoryOrder.get(first.category) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(second.category) ?? Number.MAX_SAFE_INTEGER));
    }
    return `<div class="page-intro"><div><h2>الأصناف والأسعار</h2><p>أضف أو عدّل أو أخفِ الأصناف، خيارات الحجم، الصور والأسعار.</p></div><div class="toolbar"><select class="filter-select" id="productFilter"><option value="all">كل الأقسام</option>${state.categories.map((category) => `<option value="${esc(category.id)}" ${productFilter === category.id ? 'selected' : ''}>${esc(category.name)}</option>`).join('')}</select><button class="primary" data-action="add-product">＋ إضافة صنف</button></div></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>الصنف</th><th>القسم</th><th>السعر</th><th>الرز / الأحجام</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${products.map((product) => `<tr><td><div class="product-cell"><img src="${esc(product.image)}" alt=""><div><strong>${esc(product.name)}</strong><span class="muted">${esc(product.description || 'بدون وصف')}</span></div></div></td><td>${esc(categoryName(product.category))}</td><td><strong>${money(product.basePrice, state.business.currency)}</strong>${product.oldPrice ? `<br><span class="muted">قبل: ${money(product.oldPrice, state.business.currency)}</span>` : ''}</td><td>${product.requiresRice ? '<span class="status active">يتطلب رز</span>' : '<span class="muted">لا يتطلب رز</span>'}${product.sizes?.length ? `<br><span class="muted">${product.sizes.length} أحجام</span>` : ''}</td><td><span class="status ${product.active ? 'active' : 'inactive'}">${product.active ? 'ظاهر' : 'مخفي'}</span></td><td><div class="actions"><button class="table-action" data-action="edit-product" data-id="${esc(product.id)}">تعديل</button><button class="table-action" data-action="toggle-product" data-id="${esc(product.id)}">${product.active ? 'إخفاء' : 'إظهار'}</button><button class="table-action delete" data-action="delete-product" data-id="${esc(product.id)}">حذف</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="muted">لا توجد أصناف في هذا القسم.</td></tr>'}</tbody></table></div>`;
  }

  function addProductOrderControls() {
    document.querySelectorAll('[data-action="edit-product"][data-id]').forEach((editButton) => {
      const actions = editButton.closest('.actions');
      const id = editButton.dataset.id;
      if (!actions || !id || actions.querySelector('[data-action="move-product"]')) return;
      actions.insertAdjacentHTML('beforeend', `<button class="table-action" data-action="move-product" data-id="${esc(id)}" data-direction="-1" title="نقل لأعلى" aria-label="نقل الصنف لأعلى">↑</button><button class="table-action" data-action="move-product" data-id="${esc(id)}" data-direction="1" title="نقل لأسفل" aria-label="نقل الصنف لأسفل">↓</button>`);
    });
  }

  function moveProductWithinCategory(id, direction) {
    const currentIndex = state.products.findIndex((product) => product.id === id);
    const product = state.products[currentIndex];
    if (!product || !direction) return;
    const categoryIndexes = state.products.reduce((indexes, item, index) => item.category === product.category ? indexes.concat(index) : indexes, []);
    const position = categoryIndexes.indexOf(currentIndex);
    const nextIndex = categoryIndexes[position + direction];
    if (nextIndex === undefined) { toast(direction < 0 ? 'هذا الصنف في أول ترتيب القسم.' : 'هذا الصنف في آخر ترتيب القسم.'); return; }
    [state.products[currentIndex], state.products[nextIndex]] = [state.products[nextIndex], state.products[currentIndex]];
    persist('تم تحديث ترتيب الأصناف في هذا القسم.');
    render();
  }

  function ricePage() {
    return `<div class="page-intro"><div><h2>أنواع الرز</h2><p>تظهر هذه الخيارات تلقائيًا في كل صنف تم تحديد أنه يحتاج إلى رز.</p></div></div><section class="settings-grid"><article class="panel"><h3>إضافة نوع رز</h3><form id="riceForm" class="field-grid"><label class="field full">اسم النوع<input name="name" required placeholder="مثال: رز بسمتي"></label><label class="field">تكلفة إضافية (اختياري)<input name="price" type="number" min="0" step="0.5" value="0"></label><label class="field">الحالة<select name="active"><option value="true">مفعل</option><option value="false">مخفي</option></select></label><div class="form-footer field full"><button class="primary" type="submit">إضافة النوع</button></div></form></article><article class="panel"><h3>الأنواع الحالية</h3><div class="mini-list">${state.riceTypes.map((rice) => `<div class="mini-row"><div style="flex:1"><strong>${esc(rice.name)}</strong><span class="muted">${number(rice.price) ? `إضافة ${money(rice.price, state.business.currency)}` : 'بدون تكلفة إضافية'}</span></div><span class="status ${rice.active ? 'active' : 'inactive'}">${rice.active ? 'مفعل' : 'مخفي'}</span><button title="تعديل" data-action="edit-rice" data-id="${esc(rice.id)}">✎</button><button title="حذف" data-action="delete-rice" data-id="${esc(rice.id)}">×</button></div>`).join('') || '<p class="muted">لم تتم إضافة أنواع رز بعد.</p>'}</div></article></section>`;
  }

  function fulfillmentPage() {
    const delivery = state.fulfillment.delivery;
    return `<div class="page-intro"><div><h2>التوصيل والاستلام</h2><p>تحكم في الرسوم، التوصيل المجاني، طرق الاستلام والبيانات المطلوبة مع كل طريقة.</p></div></div><form id="fulfillmentForm" class="settings-grid"><article class="panel"><h3>رسوم التوصيل</h3><div class="switch-row"><div><strong>تشغيل التوصيل</strong><small>يعرض خيار التوصيل داخل السلة.</small></div><input class="switch" name="deliveryEnabled" type="checkbox" ${delivery.enabled ? 'checked' : ''}></div><div class="switch-row"><div><strong>توصيل مجاني</strong><small>يمكن جعله لجميع الطلبات أو فوق حد معين.</small></div><input class="switch" name="freeEnabled" type="checkbox" ${delivery.freeEnabled ? 'checked' : ''}></div><div class="field-grid" style="margin-top:14px"><label class="field">رسوم التوصيل<input name="deliveryFee" type="number" min="0" step="0.5" value="${number(delivery.fee)}"></label><label class="field">التوصيل المجاني فوق<input name="freeOver" type="number" min="0" step="1" value="${number(delivery.freeOver)}"><small class="muted">ضع 0 ليكون مجانيًا لكل الطلبات عند تفعيل الخيار.</small></label></div></article><article class="panel"><h3>طرق الاستلام</h3><div class="mini-list">${state.fulfillment.methods.map((method, index) => `<div class="method-fields-editor"><input type="hidden" name="methodId-${index}" value="${esc(method.id)}"><div class="mini-row"><input name="methodName-${index}" value="${esc(method.name)}" required><select class="short" name="methodKind-${index}"><option value="delivery" ${method.kind === 'delivery' ? 'selected' : ''}>توصيل</option><option value="pickup" ${method.kind === 'pickup' ? 'selected' : ''}>استلام</option><option value="car" ${method.kind === 'car' ? 'selected' : ''}>سيارة</option><option value="custom" ${method.kind === 'custom' ? 'selected' : ''}>مخصص</option></select><input class="switch" name="methodEnabled-${index}" type="checkbox" ${method.enabled ? 'checked' : ''} aria-label="تفعيل ${esc(method.name)}"></div><details><summary>البيانات المطلوبة من العميل (${(method.fields || []).length})</summary><div class="mini-list">${(method.fields || []).map((field, fieldIndex) => `<div class="mini-row"><input name="methodFieldLabel-${index}-${fieldIndex}" value="${esc(field.label)}" placeholder="اسم الحقل"><select class="short" name="methodFieldType-${index}-${fieldIndex}"><option value="text" ${field.type === 'text' ? 'selected' : ''}>نص</option><option value="tel" ${field.type === 'tel' ? 'selected' : ''}>جوال</option><option value="number" ${field.type === 'number' ? 'selected' : ''}>رقم</option></select><input class="switch" name="methodFieldRequired-${index}-${fieldIndex}" type="checkbox" ${field.required ? 'checked' : ''} aria-label="حقل مطلوب"><button type="button" data-action="remove-method-field" data-method-index="${index}" data-field-index="${fieldIndex}">×</button></div><input name="methodFieldPlaceholder-${index}-${fieldIndex}" value="${esc(field.placeholder || '')}" placeholder="نص مساعد للحقل">`).join('') || '<p class="muted">لا توجد بيانات إضافية مطلوبة.</p>'}</div><button class="secondary" type="button" data-action="add-method-field" data-method-index="${index}">＋ إضافة حقل</button></details></div>`).join('')}</div><div class="form-footer"><button class="secondary" type="button" data-action="add-method">＋ إضافة طريقة استلام</button></div></article><article class="panel full"><h3>طرق الدفع</h3><div class="field-grid">${state.fulfillment.payments.map((payment, index) => `<label class="field"><input type="hidden" name="paymentId-${index}" value="${esc(payment.id)}"><span>اسم الطريقة<input name="paymentName-${index}" value="${esc(payment.name)}"></span><div class="switch-row"><small>إتاحة هذه الطريقة للعميل</small><input class="switch" name="paymentEnabled-${index}" type="checkbox" ${payment.enabled ? 'checked' : ''}></div></label>`).join('')}</div><div class="form-footer"><button class="secondary" type="button" data-action="add-payment">＋ إضافة طريقة دفع</button><button class="primary" type="submit">حفظ إعدادات الطلب</button></div></article></form>`;
  }

  function couponsPage() {
    return `<div class="page-intro"><div><h2>أكواد الخصم</h2><p>أنشئ خصومات بنسبة مئوية أو مبلغ ثابت وحدد الحد الأدنى للطلب.</p></div><button class="primary" data-action="add-coupon">＋ كود خصم</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>الكود</th><th>نوع الخصم</th><th>القيمة</th><th>الحد الأدنى</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${state.coupons.map((coupon) => `<tr><td><strong>${esc(coupon.code)}</strong></td><td>${coupon.type === 'percent' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td><td>${coupon.type === 'percent' ? `${number(coupon.amount)}%` : money(coupon.amount, state.business.currency)}</td><td>${coupon.minimum ? money(coupon.minimum, state.business.currency) : 'بدون حد'}</td><td><span class="status ${coupon.active ? 'active' : 'inactive'}">${coupon.active ? 'مفعل' : 'مخفي'}</span></td><td><div class="actions"><button class="table-action" data-action="edit-coupon" data-id="${esc(coupon.id)}">تعديل</button><button class="table-action" data-action="toggle-coupon" data-id="${esc(coupon.id)}">${coupon.active ? 'إيقاف' : 'تشغيل'}</button><button class="table-action delete" data-action="delete-coupon" data-id="${esc(coupon.id)}">حذف</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="muted">لا توجد أكواد خصم حاليًا.</td></tr>'}</tbody></table></div>`;
  }

  function contentPage() {
    const b = state.business, a = state.announcement;
    return `<div class="page-intro"><div><h2>محتوى وهوية الموقع</h2><p>غيّر البيانات التي يراها العميل في الصفحة الرئيسية وشريط الإعلان.</p></div></div><form id="contentForm" class="settings-grid"><article class="panel"><h3>بيانات المطعم</h3><div class="field-grid"><label class="field">اسم المطعم<input name="name" required value="${esc(b.name)}"></label><label class="field">العملة<input name="currency" required value="${esc(b.currency)}"></label><label class="field">رقم واتساب للطلبات<input name="whatsapp" required inputmode="tel" value="${esc(b.whatsapp)}"></label><label class="field">رقم الهاتف<input name="phone" value="${esc(b.phone)}"></label><label class="field full">العنوان<input name="address" value="${esc(b.address)}"></label><label class="field full">ساعات العمل<input name="openingHours" value="${esc(b.openingHours)}"></label></div></article><article class="panel"><h3>شريط الإعلان أعلى الهيدر</h3><div class="switch-row"><div><strong>إظهار الشريط</strong><small>يظهر للزائر أعلى رأس الموقع.</small></div><input class="switch" name="announcementEnabled" type="checkbox" ${a.enabled ? 'checked' : ''}></div><div class="field-grid" style="margin-top:14px"><label class="field full">نص الإعلان<input name="announcementText" value="${esc(a.text)}"></label><label class="field">نص الرابط (اختياري)<input name="announcementLinkText" value="${esc(a.linkText)}"></label><label class="field">رابط الإعلان (اختياري)<input name="announcementLinkUrl" type="url" value="${esc(a.linkUrl)}" placeholder="https://..."></label></div></article><article class="panel full"><h3>قسم البداية</h3><div class="field-grid"><label class="field">عنوان رئيسي<input name="heroTitle" value="${esc(b.heroTitle)}"></label><label class="field">نص خدمات الإعاشة<input name="serviceText" value="${esc(b.serviceText)}"></label><label class="field full">وصف تحت العنوان<textarea name="heroText">${esc(b.heroText)}</textarea></label><label class="field">مسار/رابط صورة الغلاف<input name="heroImage" value="${esc(b.heroImage)}"></label><label class="field">مسار/رابط شعار الموقع<input name="logo" value="${esc(b.logo)}"></label><label class="field full">مسار/رابط شعار الهيدر<input name="headerLogo" value="${esc(b.headerLogo)}"></label></div></article><article class="panel full"><h3>من نحن</h3><div class="field-grid"><label class="field">العنوان<input name="aboutTitle" value="${esc(b.aboutTitle)}"></label><label class="field full">النص<textarea name="aboutText">${esc(b.aboutText)}</textarea></label></div></article><article class="panel full"><h3>أقسام القائمة</h3><div class="mini-list">${state.categories.map((category, index) => `<div class="mini-row"><input name="categoryName-${index}" value="${esc(category.name)}"><input class="switch" name="categoryActive-${index}" type="checkbox" ${category.active ? 'checked' : ''} aria-label="تفعيل ${esc(category.name)}"></div>`).join('')}</div><div class="form-footer"><button class="primary" type="submit">حفظ محتوى الموقع</button></div></article></form>`;
  }

  function baseContentPage() {
    const b = state.business, a = state.announcement, f = state.footer || {};
    const aboutRows = (b.aboutCards || []).map((card, i) => `<div class="field-grid"><label class="field">عنوان الكارت<input name="aboutCardTitle-${i}" value="${esc(card.title)}"></label><label class="field">نص الكارت<input name="aboutCardText-${i}" value="${esc(card.text)}"></label></div>`).join('');
    const socialRows = (f.social || []).map((item, i) => `<div class="field-grid"><label class="field">اسم الشبكة<input name="socialLabel-${i}" value="${esc(item.label)}"></label><label class="field">الرابط<input name="socialUrl-${i}" value="${esc(item.url)}"></label><label class="field">مسار الأيقونة<input name="socialImage-${i}" value="${esc(item.image)}"></label><label class="field">رفع أيقونة<input data-footer-upload="social" data-footer-index="${i}" type="file" accept="image/*"></label><label class="field"><span>الحالة</span><div class="switch-row"><small>عرضها في الفوتر</small><input class="switch" name="socialActive-${i}" type="checkbox" ${item.active ? 'checked' : ''}></div></label></div>`).join('');
    const deliveryRows = (f.deliveryApps || []).map((item, i) => `<div class="field-grid"><label class="field">اسم التطبيق<input name="deliveryAppLabel-${i}" value="${esc(item.label)}"></label><label class="field">الرابط<input name="deliveryAppUrl-${i}" value="${esc(item.url)}"></label><label class="field">مسار الشعار<input name="deliveryAppImage-${i}" value="${esc(item.image)}"></label><label class="field">رفع شعار<input data-footer-upload="delivery" data-footer-index="${i}" type="file" accept="image/*"></label><label class="field"><span>الحالة</span><div class="switch-row"><small>عرضه في الفوتر</small><input class="switch" name="deliveryAppActive-${i}" type="checkbox" ${item.active ? 'checked' : ''}></div></label></div>`).join('');
    return `<div class="page-intro"><div><h2>محتوى وهوية الموقع</h2><p>التحكم في الإعلان والشعارات وقسم من نحن والفوتر دون تغيير أبعاد الهيدر أو الهيرو.</p></div></div><form id="contentForm" class="settings-grid"><article class="panel"><h3>بيانات المطعم وشريط الإعلان</h3><div class="field-grid"><label class="field">اسم المطعم<input name="name" required value="${esc(b.name)}"></label><label class="field">العملة<input name="currency" required value="${esc(b.currency)}"></label><label class="field">رقم واتساب<input name="whatsapp" required value="${esc(b.whatsapp)}"></label><label class="field">رقم الهاتف<input name="phone" value="${esc(b.phone)}"></label><label class="field full">العنوان<input name="address" value="${esc(b.address)}"></label><label class="field full">ساعات العمل<input name="openingHours" value="${esc(b.openingHours)}"></label></div><div class="switch-row"><div><strong>شريط الإعلان المتحرك</strong><small>أعلى الهيدر</small></div><input class="switch" name="announcementEnabled" type="checkbox" ${a.enabled ? 'checked' : ''}></div><div class="field-grid"><label class="field full">نص الإعلان<input name="announcementText" value="${esc(a.text)}"></label><label class="field">نص الرابط<input name="announcementLinkText" value="${esc(a.linkText)}"></label><label class="field">رابط الإعلان<input name="announcementLinkUrl" value="${esc(a.linkUrl)}"></label><label class="field">لون خلفية الشريط<input name="announcementBackgroundColor" type="color" value="${esc(a.backgroundColor || '#8f1832')}"></label><label class="field">لون النص<input name="announcementTextColor" type="color" value="${esc(a.textColor || '#fdf2d4')}"></label><label class="field">مدة حركة النص (ثانية)<input name="announcementSpeed" type="number" min="6" max="60" value="${number(a.speed || 18)}"></label></div></article><article class="panel"><h3>الهيدر والهيرو</h3><div class="field-grid"><label class="field">مسار لوجو الهيدر<input name="headerLogo" value="${esc(b.headerLogo)}"></label><label class="field">عرض لوجو الهيدر (px)<input name="headerLogoSize" type="number" min="20" max="500" value="${number(b.headerLogoSize)}"></label><label class="field">مسار لوجو الهيرو<input name="heroLogo" value="${esc(b.heroLogo || b.logo)}"></label><label class="field">عرض لوجو الهيرو (px)<input name="heroLogoSize" type="number" min="30" max="500" value="${number(b.heroLogoSize)}"></label><label class="field full">صورة خلفية الهيرو<input name="heroImage" value="${esc(b.heroImage)}"></label><label class="field">العنوان الرئيسي<input name="heroTitle" value="${esc(b.heroTitle)}"></label><label class="field">نص الخدمات<input name="serviceText" value="${esc(b.serviceText)}"></label><label class="field full">النص أسفل العنوان<textarea name="heroText">${esc(b.heroText)}</textarea></label></div><p class="note">تغيير حجم أي لوجو لا يغيّر ارتفاع الهيدر أو الهيرو ولا موضع النصوص.</p></article><article class="panel full"><h3>قسم من نحن (مخفي حتى يفتحه العميل)</h3><div class="field-grid"><label class="field">عنوان القسم<input name="aboutTitle" value="${esc(b.aboutTitle)}"></label><label class="field full">وصف مختصر<textarea name="aboutText">${esc(b.aboutText)}</textarea></label></div>${aboutRows}</article><article class="panel full"><h3>الفوتر والتواصل</h3><div class="field-grid"><label class="field">مسار لوجو الفوتر<input name="footerLogo" value="${esc(f.logo || b.logo)}"></label><label class="field">عرض لوجو الفوتر (px)<input name="footerLogoSize" type="number" min="30" max="500" value="${number(f.logoSize)}"></label><label class="field full">عنوان الفوتر<input name="footerAddress" value="${esc(f.address || b.address)}"></label></div><h4>السوشيال ميديا</h4>${socialRows || '<p class="muted">أضف الشبكات من الإعدادات المتقدمة.</p>'}<h4>تطبيقات التوصيل</h4>${deliveryRows || '<p class="muted">أضف التطبيقات من الإعدادات المتقدمة.</p>'}</article><article class="panel full"><h3>أقسام القائمة</h3><div class="mini-list">${state.categories.map((category, index) => `<div class="mini-row"><input name="categoryName-${index}" value="${esc(category.name)}"><input class="switch" name="categoryActive-${index}" type="checkbox" ${category.active ? 'checked' : ''} aria-label="تفعيل ${esc(category.name)}"></div>`).join('')}</div><div class="form-footer"><button class="primary" type="submit">حفظ محتوى الموقع</button></div></article></form>`;
  }

  function contentPage() {
    const b = state.business;
    return baseContentPage()
      .replace(/<label class="field">نص الخدمات<input name="serviceText"[^>]*><\/label>/, `<label class="field">نص الخدمات<input name="serviceText" value="${esc(b.serviceText)}"></label><label class="field"><span>إظهار شريط الخدمات</span><div class="switch-row"><small>أسفل الهيرو</small><input class="switch" name="serviceEnabled" type="checkbox" ${b.serviceEnabled !== false ? 'checked' : ''}></div></label><label class="field">لون نص شريط الخدمات<input name="serviceTextColor" type="color" value="${esc(b.serviceTextColor || '#fdf2d4')}"></label><label class="field">شفافية الخلفية السوداء<input name="serviceOpacity" type="number" min="0.05" max="0.9" step="0.05" value="${number(b.serviceOpacity ?? .65)}"></label>`)
      .replace('<h4>تطبيقات التوصيل</h4>', '<button class="secondary" type="button" data-action="add-social">＋ إضافة شبكة اجتماعية</button><h4>تطبيقات التوصيل</h4>')
      .replace('</article><article class="panel full"><h3>أقسام القائمة</h3>', '<button class="secondary" type="button" data-action="add-delivery-app">＋ إضافة تطبيق توصيل</button></article><article class="panel full"><h3>أقسام القائمة</h3>');
  }

  function backupPage() {
    return `<div class="page-intro"><div><h2>النسخ الاحتياطي والإعدادات المتقدمة</h2><p>صدّر نسخة JSON قبل التعديل، أو استوردها لاستعادة جميع الأصناف والإعدادات.</p></div></div><section class="settings-grid"><article class="panel"><h3>نسخة احتياطية</h3><p class="note">تتغير بيانات هذا الموقع في المتصفح الحالي فقط. استخدم تصدير النسخة ثم استوردها على أي جهاز أو متصفح آخر.</p><div class="backup-actions"><button class="primary" data-action="export-data">↓ تصدير نسخة JSON</button><label class="secondary upload-label">↑ استيراد نسخة JSON<input id="importFile" type="file" accept="application/json,.json"></label><button class="danger" data-action="reset-data">استعادة البيانات الأصلية</button></div></article><article class="panel"><h3>الإعدادات المتقدمة</h3><p class="muted">للمستخدم المتقدم: يمكنك تعديل نسخة البيانات كاملة، ثم حفظها.</p><form id="advancedForm"><label class="field"><span>JSON</span><textarea class="advanced-json" name="json" spellcheck="false">${esc(JSON.stringify(state, null, 2))}</textarea></label><div class="form-footer"><button class="primary" type="submit">حفظ JSON</button></div></form></article></section>`;
  }

  function openModal(html) { $('#editorModal').innerHTML = html; $('#modalBackdrop').classList.add('show'); $('#editorModal').classList.add('show'); $('#editorModal').setAttribute('aria-hidden', 'false'); }
  function closeModal() { $('#modalBackdrop').classList.remove('show'); $('#editorModal').classList.remove('show'); $('#editorModal').setAttribute('aria-hidden', 'true'); editorProduct = null; editorCoupon = null; }

  function readProductForm(form) {
    const value = formObject(form);
    const sizes = [...form.querySelectorAll('[data-size-label]')].map((input) => { const index = input.dataset.sizeLabel; return { id: editorProduct.sizes[index]?.id || uid('size'), label: input.value.trim(), price: number(form.querySelector(`[data-size-price="${index}"]`).value) }; }).filter((size) => size.label);
    return { name: value.name.trim(), category: value.category, description: value.description.trim(), image: value.image.trim(), basePrice: number(value.basePrice), oldPrice: number(value.oldPrice), calories: number(value.calories), badge: value.badge.trim(), active: form.elements.active.checked, requiresRice: form.elements.requiresRice.checked, riceAllowedIds: [...form.querySelectorAll('[name="allowedRice"]:checked')].map((input) => input.value), sizes };
  }

  function captureProductDraft() {
    const form = $('#productForm');
    if (form && editorProduct) Object.assign(editorProduct, readProductForm(form));
  }

  function openProductEditor(product) {
    editorProduct = copy(product || { id: uid('product'), category: state.categories[0]?.id || 'chicken', name: '', description: '', image: '', calories: 0, badge: '', basePrice: 0, oldPrice: 0, active: true, requiresRice: false, riceAllowedIds: [], sizes: [] });
    renderProductModal();
  }
  function renderProductModal() {
    const p = editorProduct;
    const sizeRows = (p.sizes || []).map((size, index) => `<div class="mini-row"><input data-size-label="${index}" value="${esc(size.label)}" placeholder="اسم الحجم"><input class="short" data-size-price="${index}" type="number" min="0" step="0.01" value="${number(size.price)}" placeholder="السعر"><button type="button" data-action="remove-size" data-index="${index}">×</button></div>`).join('');
    openModal(`<div class="modal-head"><h2>${p.name ? 'تعديل صنف' : 'إضافة صنف جديد'}</h2><button class="modal-close" data-action="close-modal" aria-label="إغلاق">×</button></div><form id="productForm" class="field-grid"><label class="field">اسم الصنف<input name="name" required value="${esc(p.name)}"></label><label class="field">القسم<select name="category">${state.categories.map((category) => `<option value="${esc(category.id)}" ${p.category === category.id ? 'selected' : ''}>${esc(category.name)}</option>`).join('')}</select></label><label class="field full">الوصف<input name="description" value="${esc(p.description)}" placeholder="وصف مختصر يظهر للعميل"></label><label class="field">السعر الأساسي<input name="basePrice" type="number" required min="0" step="0.5" value="${number(p.basePrice)}"></label><label class="field">السعر قبل التخفيض (اختياري)<input name="oldPrice" type="number" min="0" step="0.5" value="${number(p.oldPrice)}"></label><label class="field">السعرات (اختياري)<input name="calories" type="number" min="0" step="1" value="${number(p.calories)}"></label><label class="field">شارة أعلى الصورة (اختياري)<input name="badge" value="${esc(p.badge)}" placeholder="مثال: تحضير 25 دقيقة"></label><label class="field full">رابط أو مسار الصورة<input name="image" required value="${esc(p.image)}" placeholder="images/product.webp أو https://..."></label><label class="field">رفع صورة من الجهاز<input id="productImageFile" type="file" accept="image/*"><small class="muted">عند النشر ترفع تلقائيًا إلى مجلد uploads داخل المشروع.</small></label><div class="field"><span>معاينة الصورة</span><img class="image-preview" src="${esc(p.image)}" alt="معاينة"></div><label class="field"><span>الحالة</span><div class="switch-row"><small>عرض الصنف في الموقع</small><input class="switch" name="active" type="checkbox" ${p.active ? 'checked' : ''}></div></label><label class="field"><span>اختيار الرز</span><div class="switch-row"><small>يطلب من العميل تحديد نوع الرز</small><input class="switch" name="requiresRice" type="checkbox" ${p.requiresRice ? 'checked' : ''}></div></label><div class="field full"><span>أنواع الرز المتاحة لهذا الصنف</span><div class="check-grid">${state.riceTypes.map((rice) => `<label><input name="allowedRice" type="checkbox" value="${esc(rice.id)}" ${(p.riceAllowedIds === null || p.riceAllowedIds?.includes(rice.id)) ? 'checked' : ''}>${esc(rice.name)}</label>`).join('') || '<span class="muted">أضف أنواع رز من القسم المخصص أولًا.</span>'}</div></div><div class="field full"><div class="size-head"><h3>الأحجام والأسعار</h3><button class="secondary" type="button" data-action="add-size">＋ إضافة حجم</button></div><p class="muted">اتركها فارغة إذا كان للصنف سعر واحد فقط.</p><div class="mini-list">${sizeRows || '<p class="muted">لا توجد أحجام مضافة.</p>'}</div></div><div class="form-footer field full"><button class="secondary" type="button" data-action="close-modal">إلغاء</button><button class="primary" type="submit">حفظ الصنف</button></div></form>`);
  }

  function openCouponEditor(coupon) {
    editorCoupon = copy(coupon || { id: uid('coupon'), code: '', type: 'percent', amount: 10, minimum: 0, active: true });
    const c = editorCoupon;
    openModal(`<div class="modal-head"><h2>${c.code ? 'تعديل كود الخصم' : 'إضافة كود خصم'}</h2><button class="modal-close" data-action="close-modal">×</button></div><form id="couponForm" class="field-grid"><label class="field">الكود<input name="code" required maxlength="32" value="${esc(c.code)}" placeholder="مثال: WELCOME10"></label><label class="field">نوع الخصم<select name="type"><option value="percent" ${c.type === 'percent' ? 'selected' : ''}>نسبة مئوية</option><option value="fixed" ${c.type === 'fixed' ? 'selected' : ''}>مبلغ ثابت</option></select></label><label class="field">قيمة الخصم<input name="amount" type="number" required min="0" step="0.5" value="${number(c.amount)}"></label><label class="field">الحد الأدنى للطلب<input name="minimum" type="number" min="0" step="0.5" value="${number(c.minimum)}"></label><label class="field full"><span>الحالة</span><div class="switch-row"><small>إتاحة الكود للعميل</small><input class="switch" name="active" type="checkbox" ${c.active ? 'checked' : ''}></div></label><div class="form-footer field full"><button class="secondary" type="button" data-action="close-modal">إلغاء</button><button class="primary" type="submit">حفظ الكود</button></div></form>`);
  }

  function openRiceEditor(rice) {
    openModal(`<div class="modal-head"><h2>تعديل نوع الرز</h2><button class="modal-close" data-action="close-modal">×</button></div><form id="editRiceForm" class="field-grid" data-id="${esc(rice.id)}"><label class="field full">اسم النوع<input name="name" required value="${esc(rice.name)}"></label><label class="field">إضافة سعرية<input name="price" type="number" min="0" step="0.5" value="${number(rice.price)}"></label><label class="field"><span>الحالة</span><div class="switch-row"><small>يظهر للعميل</small><input class="switch" name="active" type="checkbox" ${rice.active ? 'checked' : ''}></div></label><div class="form-footer field full"><button class="secondary" type="button" data-action="close-modal">إلغاء</button><button class="primary" type="submit">حفظ</button></div></form>`);
  }

  function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }
  function handleProductSave(form) {
    Object.assign(editorProduct, readProductForm(form));
    const index = state.products.findIndex((product) => product.id === editorProduct.id);
    if (index >= 0) state.products[index] = editorProduct; else state.products.push(editorProduct);
    persist('تم حفظ الصنف.'); closeModal(); render();
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action], [data-go]'); if (!target) return;
    if (target.dataset.go) { page = target.dataset.go; productFilter = 'all'; render(); return; }
    const { action, id, index, direction } = target.dataset;
    if (action === 'toggle-menu') $('#sidebar').classList.toggle('open');
    if (action === 'close-modal') closeModal();
    if (action === 'add-product') openProductEditor();
    if (action === 'edit-product') openProductEditor(state.products.find((product) => product.id === id));
    if (action === 'toggle-product') { const product = state.products.find((item) => item.id === id); product.active = !product.active; persist(); render(); }
    if (action === 'delete-product') { const product = state.products.find((item) => item.id === id); if (product && confirm(`حذف «${product.name}» نهائيًا؟`)) { state.products = state.products.filter((item) => item.id !== id); persist('تم حذف الصنف.'); render(); } }
    if (action === 'add-size') { captureProductDraft(); editorProduct.sizes.push({ id: uid('size'), label: '', price: 0 }); renderProductModal(); }
    if (action === 'remove-size') { captureProductDraft(); editorProduct.sizes.splice(Number(index), 1); renderProductModal(); }
    if (action === 'move-product') moveProductWithinCategory(id, Number(direction));
    if (action === 'edit-rice') openRiceEditor(state.riceTypes.find((rice) => rice.id === id));
    if (action === 'delete-rice') { const rice = state.riceTypes.find((item) => item.id === id); if (rice && confirm(`حذف «${rice.name}»؟`)) { state.riceTypes = state.riceTypes.filter((item) => item.id !== id); persist('تم حذف نوع الرز.'); render(); } }
    if (action === 'add-coupon') openCouponEditor();
    if (action === 'edit-coupon') openCouponEditor(state.coupons.find((coupon) => coupon.id === id));
    if (action === 'toggle-coupon') { const coupon = state.coupons.find((item) => item.id === id); coupon.active = !coupon.active; persist(); render(); }
    if (action === 'delete-coupon') { const coupon = state.coupons.find((item) => item.id === id); if (coupon && confirm(`حذف كود ${coupon.code}؟`)) { state.coupons = state.coupons.filter((item) => item.id !== id); persist('تم حذف الكود.'); render(); } }
    if (action === 'add-method') { state.fulfillment.methods.push({ id: uid('method'), name: 'طريقة استلام جديدة', kind: 'custom', enabled: true, fields: [] }); window.SamamData.setState(state); render(); }
    if (action === 'add-payment') { state.fulfillment.payments.push({ id: uid('payment'), name: 'طريقة دفع جديدة', enabled: true }); window.SamamData.setState(state); render(); }
    if (action === 'add-method-field') { const method = state.fulfillment.methods[Number(target.dataset.methodIndex)]; if (method) { method.fields.push({ id: uid('field'), label: '', type: 'text', placeholder: '', required: false }); window.SamamData.setState(state); render(); } }
    if (action === 'remove-method-field') { const method = state.fulfillment.methods[Number(target.dataset.methodIndex)]; if (method) { method.fields.splice(Number(target.dataset.fieldIndex), 1); window.SamamData.setState(state); render(); } }
    if (action === 'add-social') { const footer = state.footer || (state.footer = {}); (footer.social || (footer.social = [])).push({ id: uid('social'), label: 'شبكة اجتماعية', url: '#', image: '', active: true }); window.SamamData.setState(state); render(); }
    if (action === 'add-delivery-app') { const footer = state.footer || (state.footer = {}); (footer.deliveryApps || (footer.deliveryApps = [])).push({ id: uid('delivery-app'), label: 'تطبيق توصيل', url: '#', image: '', active: true }); window.SamamData.setState(state); render(); }
    if (action === 'export-data') exportData();
    if (action === 'reset-data') { if (confirm('سيتم حذف التعديلات المحلية وإعادة البيانات الأصلية. هل تريد المتابعة؟')) { resetState(); state = getState(); persist('تمت استعادة البيانات الأصلية.'); render(); } }
  });

  document.addEventListener('click', (event) => { const button = event.target.closest('.nav-item'); if (button) { page = button.dataset.page; productFilter = 'all'; $('#sidebar').classList.remove('open'); render(); $('#adminMain').focus(); } });
  $('#modalBackdrop').addEventListener('click', closeModal);

  document.addEventListener('change', async (event) => {
    if (event.target.id === 'productFilter') { productFilter = event.target.value; render(); }
    if (event.target.id === 'productImageFile' && event.target.files?.[0]) {
      captureProductDraft();
      const file = event.target.files[0];
      try { editorProduct.image = await window.SamamData.uploadImage(file); toast('تم رفع الصورة إلى مجلد المشروع.'); renderProductModal(); }
      catch (_) { const reader = new FileReader(); reader.onload = () => { editorProduct.image = reader.result; toast('تمت المعاينة محليًا؛ استخدم استضافة PHP ليتم حفظ الصورة في المشروع.'); renderProductModal(); }; reader.readAsDataURL(file); }
    }
    if (event.target.matches('[data-footer-upload]') && event.target.files?.[0]) {
      const file = event.target.files[0]; const group = event.target.dataset.footerUpload === 'social' ? 'social' : 'deliveryApps'; const index = Number(event.target.dataset.footerIndex); const footer = state.footer || (state.footer = {});
      const setImage = (path) => { if (footer[group]?.[index]) { footer[group][index].image = path; window.SamamData.setState(state); render(); } };
      try { setImage(await window.SamamData.uploadImage(file)); toast('تم رفع الأيقونة إلى مجلد المشروع.'); }
      catch (_) { const reader = new FileReader(); reader.onload = () => { setImage(reader.result); toast('تم حفظ الأيقونة محليًا؛ استخدم استضافة PHP للحفظ داخل المشروع.'); }; reader.readAsDataURL(file); }
    }
    if (event.target.id === 'importFile' && event.target.files?.[0]) { const reader = new FileReader(); reader.onload = () => { try { const loaded = JSON.parse(reader.result); if (!loaded || !Array.isArray(loaded.products) || !loaded.business) throw new Error(); state = loaded; persist('تم استيراد النسخة الاحتياطية.'); render(); } catch (_) { toast('تعذر قراءة الملف. اختر نسخة JSON صحيحة صادرة من اللوحة.'); } }; reader.readAsText(event.target.files[0]); }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (form.id === 'loginForm') {
      event.preventDefault();
      const message = $('#loginMessage');
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      try {
        await window.SamamData.login(email, password);
        message.textContent = '';
        $('#loginGate').hidden = true;
        render();
      } catch (_) {
        message.textContent = 'تعذر تسجيل الدخول. راجع البريد وكلمة المرور وإعدادات Firebase.';
      }
      return;
    }
    if (!form.matches('#productForm,#couponForm,#riceForm,#editRiceForm,#fulfillmentForm,#contentForm,#advancedForm')) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.id === 'productForm') handleProductSave(form);
    if (form.id === 'couponForm') { const value = formObject(form); Object.assign(editorCoupon, { code: value.code.trim().toUpperCase(), type: value.type, amount: number(value.amount), minimum: number(value.minimum), active: form.elements.active.checked }); if (state.coupons.some((coupon) => coupon.code === editorCoupon.code && coupon.id !== editorCoupon.id)) { toast('هذا الكود موجود بالفعل.'); return; } const i = state.coupons.findIndex((coupon) => coupon.id === editorCoupon.id); if (i >= 0) state.coupons[i] = editorCoupon; else state.coupons.unshift(editorCoupon); persist('تم حفظ كود الخصم.'); closeModal(); render(); }
    if (form.id === 'riceForm') { const value = formObject(form); state.riceTypes.push({ id: uid('rice'), name: value.name.trim(), price: number(value.price), active: value.active === 'true' }); persist('تمت إضافة نوع الرز.'); render(); }
    if (form.id === 'editRiceForm') { const rice = state.riceTypes.find((item) => item.id === form.dataset.id); const value = formObject(form); Object.assign(rice, { name: value.name.trim(), price: number(value.price), active: form.elements.active.checked }); persist('تم حفظ نوع الرز.'); closeModal(); render(); }
    if (form.id === 'fulfillmentForm') {
      state.fulfillment.delivery = { enabled: form.elements.deliveryEnabled.checked, fee: number(form.elements.deliveryFee.value), freeEnabled: form.elements.freeEnabled.checked, freeOver: number(form.elements.freeOver.value) };
      state.fulfillment.methods = state.fulfillment.methods.map((method, i) => ({ ...method, name: form.elements[`methodName-${i}`].value.trim(), kind: form.elements[`methodKind-${i}`].value, enabled: form.elements[`methodEnabled-${i}`].checked, fields: (method.fields || []).map((field, fieldIndex) => ({ ...field, label: form.elements[`methodFieldLabel-${i}-${fieldIndex}`].value.trim(), type: form.elements[`methodFieldType-${i}-${fieldIndex}`].value, placeholder: form.elements[`methodFieldPlaceholder-${i}-${fieldIndex}`].value.trim(), required: form.elements[`methodFieldRequired-${i}-${fieldIndex}`].checked })).filter((field) => field.label) }));
      state.fulfillment.payments = state.fulfillment.payments.map((payment, i) => ({ ...payment, name: form.elements[`paymentName-${i}`].value.trim(), enabled: form.elements[`paymentEnabled-${i}`].checked })).filter((payment) => payment.name);
      persist('تم حفظ إعدادات التوصيل والاستلام.'); render();
    }
    if (form.id === 'contentForm') {
      const value = formObject(form); const footer = state.footer || (state.footer = {});
      Object.assign(state.business, { name: value.name.trim(), currency: value.currency.trim(), whatsapp: value.whatsapp.trim(), phone: value.phone.trim(), address: value.address.trim(), openingHours: value.openingHours.trim(), heroTitle: value.heroTitle.trim(), heroText: value.heroText.trim(), serviceText: value.serviceText.trim(), serviceEnabled: form.elements.serviceEnabled.checked, serviceTextColor: value.serviceTextColor, serviceOpacity: number(value.serviceOpacity), heroImage: value.heroImage.trim(), headerLogo: value.headerLogo.trim(), headerLogoSize: number(value.headerLogoSize), heroLogo: value.heroLogo.trim(), heroLogoSize: number(value.heroLogoSize), aboutTitle: value.aboutTitle.trim(), aboutText: value.aboutText.trim() });
      state.business.aboutCards = (state.business.aboutCards || []).map((card, i) => ({ ...card, title: form.elements[`aboutCardTitle-${i}`].value.trim(), text: form.elements[`aboutCardText-${i}`].value.trim() }));
      Object.assign(footer, { logo: value.footerLogo.trim(), logoSize: number(value.footerLogoSize), address: value.footerAddress.trim() });
      footer.social = (footer.social || []).map((item, i) => ({ ...item, label: form.elements[`socialLabel-${i}`].value.trim(), url: form.elements[`socialUrl-${i}`].value.trim(), image: form.elements[`socialImage-${i}`].value.trim(), active: form.elements[`socialActive-${i}`].checked }));
      footer.deliveryApps = (footer.deliveryApps || []).map((item, i) => ({ ...item, label: form.elements[`deliveryAppLabel-${i}`].value.trim(), url: form.elements[`deliveryAppUrl-${i}`].value.trim(), image: form.elements[`deliveryAppImage-${i}`].value.trim(), active: form.elements[`deliveryAppActive-${i}`].checked }));
      Object.assign(state.announcement, { enabled: form.elements.announcementEnabled.checked, text: value.announcementText.trim(), linkText: value.announcementLinkText.trim(), linkUrl: value.announcementLinkUrl.trim(), backgroundColor: value.announcementBackgroundColor, textColor: value.announcementTextColor, speed: Math.max(6, number(value.announcementSpeed)) });
      state.categories.forEach((category, i) => { category.name = form.elements[`categoryName-${i}`].value.trim(); category.active = form.elements[`categoryActive-${i}`].checked; }); persist('تم حفظ محتوى الموقع.'); render();
    }
    if (form.id === 'advancedForm') { try { const loaded = JSON.parse(form.elements.json.value); if (!loaded || !loaded.business || !Array.isArray(loaded.products) || !Array.isArray(loaded.categories)) throw new Error(); state = loaded; persist('تم حفظ الإعدادات المتقدمة.'); render(); } catch (_) { toast('JSON غير صالح أو لا يحتوي على حقول المطعم الأساسية.'); } }
  });

  function exportData() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `samam-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); toast('تم تنزيل النسخة الاحتياطية.'); }
  window.addEventListener('storage', (event) => { if (event.key === window.SamamData.STORAGE_KEY) render(); });
  document.addEventListener('DOMContentLoaded', async () => {
    await window.SamamData.load();
    const authenticated = await window.SamamData.session();
    $('#loginGate').hidden = !authenticated;
    if (authenticated) render();
    await window.SamamData.onAuthChange((user) => {
      $('#loginGate').hidden = Boolean(user);
      if (user) { state = getState(); render(); }
    });
  });
})();
