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
    label.innerHTML = '<span>رفع لوجو الفوتر</span><input id="footerLogoFile" type="file" accept="image/*"><small>اختر الصورة ثم اضغط حفظ محتوى الموقع.</small>';
    fields.appendChild(label);
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
    new MutationObserver(() => { addMenuKickerControl(); addFooterLogoControl(); addAnnouncementMotionControl(); }).observe(main, { childList: true, subtree: true });
    addMenuKickerControl();
    addFooterLogoControl();
    addAnnouncementMotionControl();
  });

  document.addEventListener('change', async (event) => {
    if (event.target.id !== 'footerLogoFile' || !event.target.files?.[0]) return;
    const logoPath = document.querySelector('#contentForm input[name="footerLogo"]');
    if (!logoPath) return;
    try {
      logoPath.value = await window.SamamData.uploadImage(event.target.files[0]);
    } catch (_) {
      const reader = new FileReader();
      reader.onload = () => { logoPath.value = reader.result; };
      reader.readAsDataURL(event.target.files[0]);
    }
  });
})();
