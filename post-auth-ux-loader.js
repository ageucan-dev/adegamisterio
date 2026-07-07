(() => {
  let loaded = false;
  let attempts = 0;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src^="${src}"]`)) return resolve();

      const script = document.createElement("script");
      script.src = `${src}?v=4`;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function accessIsOpen() {
    return document.querySelector(".customer-gate-overlay") ||
      document.body.classList.contains("access-gate-loading");
  }

  function tryLoad() {
    attempts += 1;

    if (loaded) return true;
    if (accessIsOpen()) return false;

    loaded = true;
    loadScript("ux-upgrades.js").catch(() => {
      loaded = false;
    });

    return true;
  }

  window.addEventListener("copao:customer-approved", tryLoad);
  window.addEventListener("load", () => setTimeout(tryLoad, 1200));

  const timer = setInterval(() => {
    const done = tryLoad();
    if (done || attempts >= 30) clearInterval(timer);
  }, 800);
})();
