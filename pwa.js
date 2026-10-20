(() => {
  'use strict';

  const installButton = document.getElementById('installBtn');
  const connectionState = document.getElementById('connectionState');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  let installPrompt = null;

  function updateConnectionState() {
    const offline = !navigator.onLine;
    connectionState.textContent = offline ? '離線模式' : isStandalone ? '已安裝' : '';
    connectionState.classList.toggle('offline', offline);
  }

  window.addEventListener('online', updateConnectionState);
  window.addEventListener('offline', updateConnectionState);
  updateConnectionState();

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });

  if (isIOS && !isStandalone) {
    installButton.hidden = false;
    installButton.textContent = '安裝方式';
  }

  installButton.addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installButton.hidden = true;
      return;
    }
    if (isIOS) alert('在 Safari 點擊「分享」按鈕，再選擇「加入主畫面」。安裝完成後即可從桌面獨立啟動。');
  });

  window.addEventListener('appinstalled', () => {
    installButton.hidden = true;
    connectionState.textContent = '已安裝';
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
        registration.update();
      } catch (error) {
        console.warn('PWA 離線功能註冊失敗：', error);
      }
    });
  }
})();
