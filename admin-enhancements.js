(() => {
  'use strict';

  const defaultKicker = 'اختر ما يناسبك';

  function addMenuKickerControl() {
    const form = document.querySelector('#contentForm');
    if (!form || form.elements.menuKicker) return;

    const heroTitle = form.elements.heroTitle;
    const fields = heroTitle && heroTitle.closest('.field-grid');
    if (!fields) return;

    const business = window.SamamData.getState().business || {};
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = '<span>النص الصغير أعلى قائمة الطعام</span><input name="menuKicker" maxlength="80">';
    label.querySelector('input').value = business.menuKicker || defaultKicker;
    fields.appendChild(label);
  }

  function addFooterLogoControl() {
    const form = document.querySelector('#contentForm');
    if (!form || document.querySelector('#footerLogoFile')) return;

    const footerLogo = form.elements.footerLogo;
    const fields = footerLogo && footerLogo.closest('.field-grid');
    if (!fields) return;

    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = '<span>رفع لوجو الفوتر</span><input id="footerLogoFile" data-brand-upload="footerLogo" type="file" accept="image/*"><small>تُرفع الصورة إلى ImageKit، ثم احفظ المحتوى لنشرها.</small>';
    fields.appendChild(label);
  }

  function addBrandImageUploadControls() {
    const form = document.querySelector('#contentForm');
    if (!form) return;
    const fields = [
      ['headerLogo', 'headerLogoFile', 'رفع لوجو الهيدر'],
      ['heroLogo', 'heroLogoFile', 'رفع لوجو الهيرو'],
      ['heroImage', 'heroImageFile', 'رفع صورة خلفية الهيرو']
    ];
    fields.forEach(([fieldName, inputId, labelText]) => {
      if (document.querySelector(`#${inputId}`)) return;
      const field = form.elements[fieldName];
      const host = field && field.closest('.field');
      if (!host) return;
      const label = document.createElement('label');
      label.className = 'field';
      label.innerHTML = `<span>${labelText}</span><input id="${inputId}" data-brand-upload="${fieldName}" type="file" accept="image/*"><small>تُرفع الصورة إلى ImageKit، ثم احفظ المحتوى لنشرها.</small>`;
      host.insertAdjacentElement('afterend', label);
    });
  }

  function refineContactControls() {
    const form = document.querySelector('#contentForm');
    if (!form) return;
    const phone = form.elements.phone;
    if (phone) phone.closest('.field')?.remove();
    const contactWhatsapp = form.elements.contactWhatsapp || form.elements.whatsapp;
    if (contactWhatsapp?.closest('.field')) {
      contactWhatsapp.name = 'contactWhatsapp';
      contactWhatsapp.value = (window.SamamData.getState().business || {}).contactWhatsapp || contactWhatsapp.value;
      contactWhatsapp.closest('.field').childNodes[0].nodeValue = 'رقم واتساب «راسلنا» في الفوتر';
      const host = contactWhatsapp.closest('.field');
      if (!form.elements.serviceWhatsapp) {
        const business = window.SamamData.getState().business || {};
        const label = document.createElement('label');
        label.className = 'field';
        label.innerHTML = '<span>رقم واتساب خدمات الإعاشة</span><input name="serviceWhatsapp" inputmode="tel" required>';
        label.querySelector('input').value = business.serviceWhatsapp || business.whatsapp || '';
        host.insertAdjacentElement('afterend', label);
      }
    }
    const location = form.elements.footerAddress;
    if (location?.closest('.field')) location.closest('.field').childNodes[0].nodeValue = 'الموقع في الفوتر';
    const opacity = form.elements.serviceOpacity;
    if (opacity) opacity.closest('.field')?.remove();
  }

  function showUploadMessage(message) {
    const toast = document.querySelector('#adminToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showUploadMessage.timer);
    showUploadMessage.timer = setTimeout(() => toast.classList.remove('show'), 3600);
  }

  function addAnnouncementMotionControl() {
    const form = document.querySelector('#contentForm');
    if (!form || form.elements.announcementMoving) return;

    const speed = form.elements.announcementSpeed;
    const fields = speed && speed.closest('.field-grid');
    if (!fields) return;

    const announcement = window.SamamData.getState().announcement || {};
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = '<span>حركة نص الإعلان</span><div class="switch-row"><small>فعّلها ليكون النص متحركًا، أو أوقفها ليبقى ثابتًا.</small><input class="switch" name="announcementMoving" type="checkbox"></div>';
    label.querySelector('input').checked = announcement.moving !== false;
    fields.appendChild(label);
  }

  const originalSave = window.SamamData.save.bind(window.SamamData);
  window.SamamData.save = async (nextState) => {
    const control = document.querySelector('#contentForm input[name="menuKicker"]');
    if (control && nextState && nextState.business) {
      nextState.business.menuKicker = control.value.trim() || defaultKicker;
    }
    return originalSave(nextState);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('#adminMain');
    if (!main) return;
    new MutationObserver(() => { addMenuKickerControl(); addFooterLogoControl(); addBrandImageUploadControls(); addAnnouncementMotionControl(); refineContactControls(); }).observe(main, { childList: true, subtree: true });
    addMenuKickerControl();
    addFooterLogoControl();
    addBrandImageUploadControls();
    addAnnouncementMotionControl();
    refineContactControls();
  });

  document.addEventListener('change', async (event) => {
    const target = event.target;
    const fieldName = target.dataset.brandUpload;
    if (!fieldName || !target.files?.[0]) return;
    const imagePath = document.querySelector(`#contentForm [name="${fieldName}"]`);
    if (!imagePath) return;
    target.disabled = true;
    try {
      imagePath.value = await window.SamamData.uploadImage(target.files[0]);
      imagePath.dispatchEvent(new Event('input', { bubbles: true }));
      showUploadMessage('تم رفع الصورة إلى ImageKit. اضغط «حفظ محتوى الموقع» لنشر التغيير.');
    } catch (error) {
      showUploadMessage(error?.message || 'تعذر رفع الصورة. تحقق من إعداد خدمة الرفع.');
    } finally {
      target.disabled = false;
    }
  });
})();
