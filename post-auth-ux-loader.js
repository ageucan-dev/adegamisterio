(() => {
  let loaded = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src^="${src}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = `${src}?v=3`;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function accessIsOpen() {
    return document.querySelector(".customer-gate-overlay") || document.body.classList.contains("access-gate-loading");
  }

  function tryLoad() {
    if (loaded || accessIsOpen()) return;
    loaded = true;
    loadScript("ux-upgrades.js").catch(() => { loaded = false; });
  }

  window.addEventListener("copao:customer-approved", tryLoad);
  window.addEventListener("load", () => setTimeout(tryLoad, 1800));
  setInterval(tryLoad, 900);
})();
