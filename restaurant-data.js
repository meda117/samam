/* Shared data layer for the storefront and the dashboard. */
(function () {
  const STORAGE_KEY = 'samam-restaurant-state-v2';
  const CART_KEY = 'samam-restaurant-cart-v2';

  const defaultState = {
    version: 3,
    business: {
      name: 'مطعم صمّام',
      tagline: 'مضغوط وأكثر',
      currency: 'ر.س',
      whatsapp: '966592372549',
      phone: '0592372549',
      address: 'المملكة العربية السعودية',
      heroImage: 'images/hero-1.jpg',
      logo: 'images/logo-p.png',
      headerLogo: 'images/SAMAM HEADER.png',
      headerLogoSize: 315,
      heroTitle: 'مضغوط وأكثر بطعم لا يُنسى',
      heroText: '',
      menuKicker: 'اختر ما يناسبك',
      heroLogo: 'images/logo-p.png',
      heroLogoSize: 580,
      serviceText: 'لخدمات الإعاشة والطلبات الكبيرة',
      serviceEnabled: true,
      serviceTextColor: '#fdf2d4',
      serviceOpacity: 0.65,
      aboutTitle: 'من نحن',
      aboutText: 'صمّام علامة تقدم المأكولات العربية الأصيلة بلمسة عصرية، وجودة نحرص عليها في كل طلب.',
      aboutCards: [
        { id: 'about-samam', title: 'صمّام', text: 'علامة تجارية تأسست عام 2024، بخبرة وشغف كبيرين لتقديم الأكل العربي بروح جديدة.' },
        { id: 'about-goal', title: 'هدفنا', text: 'نحسن تجربة الأكل ونقدم أطباقنا بشكل لائق يعبر عن جودتنا.' },
        { id: 'about-vision', title: 'رؤيتنا', text: 'أن نصبح الوجهة الأولى للمأكولات العربية بطريقة حديثة.' },
        { id: 'about-special', title: 'وش يميزنا', text: 'وصفات مطورة بنكهاتنا الخاصة وجودة عالية وطعم يرسخ بالذاكرة.' }
      ],
      openingHours: 'يوميًا من 11:00 ص إلى 1:00 ص'
    },
    footer: {
      logo: 'images/logo-p.png',
      logoSize: 260,
      address: 'المملكة العربية السعودية',
      social: [
        { id: 'facebook', label: 'فيسبوك', url: '#', image: 'images/facebook.png', active: true },
        { id: 'instagram', label: 'إنستغرام', url: '#', image: 'images/instagram (1).png', active: true },
        { id: 'twitter', label: 'إكس', url: '#', image: 'images/twitter.png', active: true },
        { id: 'tiktok', label: 'تيك توك', url: '#', image: 'images/tik-tok.png', active: true }
      ],
      deliveryApps: [
        { id: 'hunger', label: 'هنقرستيشن', url: '#', image: 'images/HungerStation-01-3.svg', active: true }
      ]
    },
    announcement: {
      enabled: true,
      text: 'أهلًا بكم في مطعم صمّام — اطلب الآن واستمتع بطعمنا المميز.',
      linkText: '',
      linkUrl: '',
      backgroundColor: '#8f1832',
      textColor: '#fdf2d4',
      speed: 18,
      moving: true
    },
    categories: [
      { id: 'chicken', name: 'دجاج', active: true },
      { id: 'meat', name: 'لحم', active: true },
      { id: 'rice', name: 'رز', active: true },
      { id: 'sides', name: 'طلبات جانبية', active: true },
      { id: 'drinks', name: 'المشروبات', active: true }
    ],
    riceTypes: [
      { id: 'mazza', name: 'رز مزه حبة طويلة', price: 0, active: true },
      { id: 'abu-bint', name: 'رز أبو بنت', price: 0, active: true }
    ],
    fulfillment: {
      delivery: { enabled: true, fee: 5, freeEnabled: false, freeOver: 0 },
      methods: [
        { id: 'delivery', name: 'توصيل للعنوان', enabled: true, kind: 'delivery', fields: [{ id: 'address', label: 'العنوان', type: 'text', placeholder: 'الحي، الشارع، رقم المبنى', required: true }] },
        { id: 'pickup', name: 'استلام من الفرع', enabled: true, kind: 'pickup', fields: [] },
        { id: 'car', name: 'استلام إلى السيارة', enabled: true, kind: 'car', fields: [{ id: 'car-color', label: 'لون السيارة', type: 'text', placeholder: 'مثال: أبيض', required: true }, { id: 'car-plate', label: 'رقم اللوحة', type: 'text', placeholder: 'أ ب ج 1234', required: true }] }
      ],
      payments: [
        { id: 'cash', name: 'الدفع عند الاستلام', enabled: true },
        { id: 'card', name: 'مدى / بطاقة عند الاستلام', enabled: true }
      ]
    },
    coupons: [
      { id: 'save10', code: 'SAVE10', type: 'percent', amount: 10, minimum: 0, active: true },
      { id: 'save20', code: 'SAVE20', type: 'percent', amount: 20, minimum: 0, active: true }
    ],
    products: [
      { id: 'chicken-madghoot', category: 'chicken', name: 'مضغوط دجاج', description: 'دجاج مضغوط بتتبيلتنا الخاصة', image: 'images/مضغوط دجاج.webp', calories: 950, badge: '', basePrice: 39, oldPrice: 0, active: true, requiresRice: true, sizes: [{ id: 'whole', label: 'حبة كاملة', price: 39 }, { id: 'half', label: 'نصف حبة', price: 19.5 }] },
      { id: 'pasta-kabsa', category: 'chicken', name: 'كبسة المكرونة بالدجاج', description: 'طبق كبسة مكرونة بالدجاج', image: 'images/IMG-20260106-WA0001.jpg', calories: 1400, badge: 'تحضير 25 دقيقة', basePrice: 22.5, oldPrice: 0, active: true, requiresRice: false, sizes: [] },
      { id: 'white-chicken', category: 'chicken', name: 'مضغوط دجاج أبيض', description: 'دجاج أبيض مضغوط طازج', image: 'images/مضغوط ابيض.webp', calories: 950, badge: 'على الطلب 45 دقيقة', basePrice: 39, oldPrice: 0, active: true, requiresRice: true, sizes: [{ id: 'whole', label: 'حبة كاملة', price: 39 }, { id: 'half', label: 'نصف حبة', price: 19.5 }] },
      { id: 'hashi', category: 'meat', name: 'نفر مضغوط حاشي', description: 'نفر حاشي مع الرز', image: 'images/حاشي.webp', calories: 1400, badge: 'على الطلب 55 دقيقة', basePrice: 59, oldPrice: 0, active: true, requiresRice: true, sizes: [] },
      { id: 'harri-meat', category: 'meat', name: 'مضغوط لحم حري', description: 'لحم حري فاخر', image: 'images/لحم غنم.webp', calories: 1400, badge: 'على الطلب 55 دقيقة', basePrice: 69, oldPrice: 0, active: true, requiresRice: true, sizes: [] },
      { id: 'white-harri', category: 'meat', name: 'مضغوط لحم حري أبيض', description: 'لحم حري أبيض مع الرز', image: 'images/لحم ابيض (1).webp', calories: 1400, badge: 'على الطلب 55 دقيقة', basePrice: 69, oldPrice: 0, active: true, requiresRice: true, sizes: [] },
      { id: 'white-hashi', category: 'meat', name: 'مضغوط حاشي أبيض', description: 'حاشي أبيض مع الرز', image: 'images/حاشي ابيض (1).webp', calories: 1400, badge: 'على الطلب 55 دقيقة', basePrice: 59, oldPrice: 0, active: true, requiresRice: true, sizes: [] },
      { id: 'cucumber-salad', category: 'sides', name: 'سلطة خيار بالزبادي', description: 'سلطة خيار وزبادي طازجة', image: 'images/سلطة خيار.webp', calories: 140, badge: '', basePrice: 4, oldPrice: 0, active: true, requiresRice: false, sizes: [] },
      { id: 'tahini', category: 'sides', name: 'طحينة', description: 'طحينة جانبية', image: 'images/طحينة.webp', calories: 173, badge: '', basePrice: 1, oldPrice: 0, active: true, requiresRice: false, sizes: [] },
      { id: 'red-salad', category: 'sides', name: 'سلطة حمراء', description: 'سلطة خضراء طازجة', image: 'images/سلطة.webp', calories: 73, badge: '', basePrice: 1, oldPrice: 0, active: true, requiresRice: false, sizes: [] },
      { id: 'cream-kunafa', category: 'sides', name: 'كنافة قشطة', description: 'حلوى كنافة بالقشطة', image: 'images/ك قشطة.webp', calories: 0, badge: '', basePrice: 9, oldPrice: 0, active: true, requiresRice: false, sizes: [] },
      { id: 'tabsi', category: 'sides', name: 'صحن تبسي', description: 'صحن تبسي جانبي', image: 'images/تبسي.png', calories: 0, badge: '', basePrice: 7, oldPrice: 0, active: true, requiresRice: false, sizes: [] },
      { id: 'pepsi', category: 'drinks', name: 'بيبسي 320مل', description: 'مشروب غازي بارد', image: 'images/pepsi.jpg', calories: 0, badge: '', basePrice: 3, oldPrice: 0, active: true, requiresRice: false, sizes: [] },
      { id: 'citrus', category: 'drinks', name: 'حمضيات 320مل', description: 'مشروب حمضيات بارد', image: 'images/mirinda.jpg', calories: 0, badge: '', basePrice: 3, oldPrice: 0, active: true, requiresRice: false, sizes: [] },
      { id: 'diet-pepsi', category: 'drinks', name: 'بيبسي دايت 320مل', description: 'مشروب غازي دايت بارد', image: 'images/pepsi.jpg', calories: 0, badge: '', basePrice: 3, oldPrice: 0, active: true, requiresRice: false, sizes: [] }
    ]
  };

  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function normalize(state) {
    const result = copy(state || defaultState);
    result.version = defaultState.version;
    result.business = { ...copy(defaultState.business), ...(result.business || {}) };
    result.announcement = { ...copy(defaultState.announcement), ...(result.announcement || {}) };
    result.footer = { ...copy(defaultState.footer), ...(result.footer || {}) };
    const assetAliases = {
      'images/logo p.png': 'images/logo-p.png',
      'images/hero 1.jpg (2).jpg': 'images/hero-1.jpg'
    };
    result.business.heroImage = assetAliases[result.business.heroImage] || result.business.heroImage;
    result.business.logo = assetAliases[result.business.logo] || result.business.logo;
    result.business.heroLogo = assetAliases[result.business.heroLogo] || result.business.heroLogo;
    result.footer.logo = assetAliases[result.footer.logo] || result.footer.logo;
    result.fulfillment = { ...copy(defaultState.fulfillment), ...(result.fulfillment || {}) };
    result.fulfillment.delivery = { ...copy(defaultState.fulfillment.delivery), ...(result.fulfillment.delivery || {}) };
    result.fulfillment.methods = (result.fulfillment.methods || []).map((method) => {
      const template = defaultState.fulfillment.methods.find((item) => item.id === method.id);
      return { ...method, fields: method.fields || copy(template?.fields || []) };
    });
    result.products = (result.products || []).map((product) => ({ ...product, riceAllowedIds: Array.isArray(product.riceAllowedIds) ? product.riceAllowedIds : null }));
    return result;
  }
  function getState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.products && saved.business) return normalize(saved);
    } catch (_) { /* A broken saved value is safely ignored. */ }
    return normalize(defaultState);
  }
  function setState(state) {
    state = normalize(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('samam:data:changed', { detail: state }));
  }
  function resetState() { localStorage.removeItem(STORAGE_KEY); }
  function money(value, currency) {
    return `${Number(value || 0).toFixed(2)} ${currency || 'ر.س'}`;
  }
  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  /* Legacy PHP transport retained for reference only; Firebase is used below.
  let serverAvailable = false;
  async function api(action, options = {}) {
    if (window.location.port === '5500') throw new Error('Live Server لا يشغّل PHP.');
    const response = await fetch(`api.php?action=${encodeURIComponent(action)}`, { credentials: 'same-origin', ...options });
    if (response.headers.get('X-Samam-Api') !== '1') throw new Error('PHP API غير متاح على هذا الخادم.');
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok === false) throw Object.assign(new Error(body.error || 'تعذر الاتصال بالخادم.'), { status: response.status });
    return body;
  }
  async function load() {
    try {
      const response = await api('state');
      serverAvailable = true;
      if (response.state && response.state.products && response.state.business) setState(response.state);
    } catch (_) { serverAvailable = false; }
    return getState();
  }
  async function save(state) {
    setState(state);
    if (!serverAvailable) return { local: true };
    return api('save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) });
  }
  async function login(password) { const result = await api('login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); serverAvailable = true; return result; }
  async function session() { try { const result = await api('session'); serverAvailable = true; return Boolean(result.authenticated); } catch (_) { return false; } }
  async function uploadImage(file) { const form = new FormData(); form.append('image', file); const result = await api('upload', { method: 'POST', body: form }); return result.path; }

  window.SamamData = { STORAGE_KEY, CART_KEY, defaultState, copy, getState, setState, resetState, money, uid, normalize, load, save, login, session, uploadImage, get serverAvailable() { return serverAvailable; } };
  */

  let serverAvailable = false;
  let firebaseContext = null;
  let firebaseStateUnsubscribe = null;

  async function ensureFirebase() {
    if (firebaseContext) return firebaseContext;
    const config = window.SamamFirebaseConfig;
    if (!config?.firebase?.apiKey || !config?.firebase?.databaseURL) throw new Error('Firebase configuration is missing.');
    const [appSdk, databaseSdk, authSdk, functionsSdk] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js'),
      import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js')
    ]);
    const app = appSdk.initializeApp(config.firebase);
    firebaseContext = {
      config, databaseSdk, authSdk, functionsSdk,
      database: databaseSdk.getDatabase(app),
      auth: authSdk.getAuth(app),
      functions: functionsSdk.getFunctions(app, config.functionsRegion || 'asia-southeast1')
    };
    return firebaseContext;
  }

  async function load() {
    try {
      const context = await ensureFirebase();
      const stateReference = context.databaseSdk.ref(context.database, 'restaurantState');
      const snapshot = await context.databaseSdk.get(stateReference);
      serverAvailable = true;
      if (snapshot.exists() && snapshot.val()?.products && snapshot.val()?.business) setState(snapshot.val());
      if (!firebaseStateUnsubscribe) {
        firebaseStateUnsubscribe = context.databaseSdk.onValue(stateReference, (nextSnapshot) => {
          const nextState = nextSnapshot.val();
          if (nextState?.products && nextState?.business) setState(nextState);
        }, () => { serverAvailable = false; });
      }
    } catch (_) { serverAvailable = false; }
    return getState();
  }

  async function save(state) {
    const normalized = normalize(state);
    setState(normalized);
    const context = await ensureFirebase();
    if (!context.auth.currentUser) {
      const error = new Error('يجب تسجيل دخول الأدمن قبل الحفظ.');
      error.code = 'auth/required';
      throw error;
    }
    await context.databaseSdk.set(context.databaseSdk.ref(context.database, 'restaurantState'), normalized);
    serverAvailable = true;
    return { remote: true };
  }

  async function waitForAuth(context) {
    if (context.auth.currentUser) return context.auth.currentUser;
    return new Promise((resolve) => {
      const unsubscribe = context.authSdk.onAuthStateChanged(context.auth, (user) => { unsubscribe(); resolve(user); });
    });
  }

  async function login(email, password) {
    const context = await ensureFirebase();
    const credential = await context.authSdk.signInWithEmailAndPassword(context.auth, email, password);
    serverAvailable = true;
    return credential.user;
  }
  async function logout() { const context = await ensureFirebase(); return context.authSdk.signOut(context.auth); }
  async function session() { try { return Boolean(await waitForAuth(await ensureFirebase())); } catch (_) { return false; } }
  async function onAuthChange(callback) { const context = await ensureFirebase(); return context.authSdk.onAuthStateChanged(context.auth, callback); }

  async function uploadImage(file) {
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('اختر ملف صورة صالحًا.');
    if (file.size > 5 * 1024 * 1024) throw new Error('أقصى حجم للصورة هو 5 ميجابايت.');
    const context = await ensureFirebase();
    if (!context.auth.currentUser) throw new Error('يجب تسجيل دخول الأدمن قبل رفع الصور.');
    const imageKit = context.config.imageKit || {};
    if (!imageKit.publicKey || !imageKit.urlEndpoint) throw new Error('ImageKit configuration is missing.');
    const callable = context.functionsSdk.httpsCallable(context.functions, 'imagekitAuth');
    const authResult = await callable();
    const authData = authResult.data || {};
    const safeName = String(file.name || 'product-image').replace(/[^a-zA-Z0-9._-]/g, '_');
    const form = new FormData();
    form.append('file', file);
    form.append('fileName', `${Date.now()}-${safeName}`);
    form.append('folder', '/samam');
    form.append('useUniqueFileName', 'true');
    form.append('publicKey', imageKit.publicKey);
    form.append('token', authData.token);
    form.append('signature', authData.signature);
    form.append('expire', String(authData.expire));
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: form });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) throw new Error(result.message || 'تعذر رفع الصورة إلى ImageKit.');
    return result.url;
  }

  window.SamamData = { STORAGE_KEY, CART_KEY, defaultState, copy, getState, setState, resetState, money, uid, normalize, load, save, login, logout, session, onAuthChange, uploadImage, get serverAvailable() { return serverAvailable; } };
})();
