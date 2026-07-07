(() => {
  let loaded = false;
  let attempts = 0;

  function installPersonalizationAutoCollapse() {
    if (window.__copaoAutoCollapseReady) return;
    window.__copaoAutoCollapseReady = true;

    document.addEventListener("change", (event) => {
      const input = event.target.closest('.custom-form input[type="radio"]');
      if (!input) return;

      const fieldset = input.closest("fieldset");
      if (!fieldset) return;

      window.setTimeout(() => {
        fieldset.classList.add("is-collapsed");
      }, 120);
    }, true);

    document.addEventListener("click", (event) => {
      const legend = event.target.closest(".custom-form legend");
      if (!legend) return;

      const fieldset = legend.closest("fieldset");
      if (!fieldset) return;

      fieldset.classList.remove("is-collapsed");
    }, true);
  }

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
    installPersonalizationAutoCollapse();

    if (loaded) return true;
    if (accessIsOpen()) return false;

    loaded = true;
    loadScript("ux-upgrades.js").catch(() => {
      loaded = false;
    });

    return true;
  }

  window.addEventListener("copao:customer-approved", tryLoad);
  window.addEventListener("load", () => setTimeout(tryLoad, 600));
  installPersonalizationAutoCollapse();

  const timer = setInterval(() => {
    const done = tryLoad();
    if (done || attempts >= 30) clearInterval(timer);
  }, 800);
})();
