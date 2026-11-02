'use strict';
(() => {
  const messages = {
    'Save to phone': '保存到手机',
    'Preparing offline access…': '正在准备离线使用…',
    'Guide available offline': '行程指南已可离线使用',
    'Offline · guide saved on this device': '当前离线 · 指南已保存在此设备',
    'Connect once to enable offline access': '请先联网打开一次，以启用离线使用',
    'Offline preparation unavailable in this browser': '此浏览器暂无法完成离线准备',
    'Save Singapore Visit': '保存新加坡行程指南',
    'Close install instructions': '关闭安装说明',
    'Open the guide from your phone’s home screen, like an app.': '将指南添加到手机主屏幕，即可像应用一样打开。',
    'Install app': '安装应用',
    'iPhone · Safari': 'iPhone · Safari 浏览器',
    'Open the Share menu, choose Add to Home Screen, then tap Add. If shown, leave Open as Web App enabled.': '打开“分享”菜单，选择“添加到主屏幕”，然后轻点“添加”。如显示“作为网页 App 打开”选项，请保持开启。',
    'Android · Chrome': '安卓手机 · Chrome 浏览器',
    'Tap Install app above if available, or open Chrome’s menu and choose Add to home screen or Install app.': '如上方显示“安装应用”，可直接点击；也可打开 Chrome 菜单，选择“添加到主屏幕”或“安装应用”。',
    'Open the guide online once to prepare offline access. The itinerary and introductions work offline after preparation; photos you have viewed may be cached. New photos and map navigation need internet.': '请先联网打开一次，完成离线准备。准备完成后，行程与文字介绍可离线查看；看过的照片可能已被缓存。新照片及地图导航仍需联网。'
  };
  Object.entries(messages).forEach(([en, zh]) => addTranslation(en, zh));
  translateUI();
  const install = document.getElementById('installApp');
  const dialog = document.getElementById('installDialog');
  const nativeInstall = document.getElementById('nativeInstall');
  const status = document.getElementById('offlineStatus');
  let prompt = null;
  let ready = false;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const updateStandalone = () => document.documentElement.classList.toggle('standalone', standalone());
  const updateStatus = () => {
    status.classList.toggle('offline', !navigator.onLine);
    status.textContent = ready ? (navigator.onLine ? 'Guide available offline' : 'Offline · guide saved on this device') : (navigator.onLine ? 'Preparing offline access…' : 'Connect once to enable offline access');
    translateUI();
  };
  install.addEventListener('click', () => dialog.showModal());
  document.getElementById('closeInstall').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();} });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); prompt = event; nativeInstall.hidden = false;
  });
  nativeInstall.addEventListener('click', async () => {
    if (!prompt) return;
    const pending = prompt; prompt = null; nativeInstall.hidden = true;
    await pending.prompt();
    const choice = await pending.userChoice;
    if (choice.outcome === 'accepted') dialog.close();
  });
  window.addEventListener('appinstalled', () => { nativeInstall.hidden = true; dialog.close(); updateStandalone(); });
  window.matchMedia('(display-mode: standalone)').addEventListener('change', updateStandalone);
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStandalone(); updateStatus();
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js', {scope: './', updateViaCache: 'none'})
      .then(() => navigator.serviceWorker.ready)
      .then(() => { ready = true; updateStatus(); })
      .catch(() => { status.textContent = 'Offline preparation unavailable in this browser'; translateUI(); });
  } else {
    status.textContent = 'Offline preparation unavailable in this browser'; translateUI();
  }
})();
