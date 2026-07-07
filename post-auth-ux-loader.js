(() => {
  let loaded = false;
  let attempts = 0;

  function installPersonalizationStyles() {
    if (document.querySelector("#copao-auto-collapse-style")) return;

    const style = document.createElement("style");
    style.id = "copao-auto-collapse-style";
    style.textContent = `
      .custom-form fieldset.is-collapsed > *:not(legend) {
        display: none !important;
      }

      .custom-form fieldset.is-collapsed legend {
        cursor: pointer !important;
      }

      .custom-form fieldset.is-collapsed .step-toggle {
        display: inline-flex !important;
      }
    `;
    document.head.appendChild(style);
  }

  function installPersonalizationAutoCollapse() {
    if (window.__copaoAutoCollapseReady) return;
    window.__copaoAutoCollapseReady = true;
    installPersonalizationStyles();

    document.addEventListener("change", (event) => {
      const input = event.target.closest('.custom-form input[type="radio"]');
      if (!input) return;

      const fieldset = input.closest("fieldset");
      if (!fieldset) return;

      window.setTimeout(() => {
        fieldset.classList.add("is-collapsed");
      }, 80);
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
      script.src = `${src}?v=5`;
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
    installPersonalizationStyles();

    if (loaded) return true;
    if (accessIsOpen()) return false;

    loaded = true;
    loadScript("ux-upgrades.js").catch(() => {
      loaded = false;
    });

    return true;
  }

  window.addEventListener("copao:customer-approved", tryLoad);
  window.addEventListener("load", () => setTimeout(tryLoad, 300));
  document.addEventListener("DOMContentLoaded", installPersonalizationAutoCollapse, { once: true });
  installPersonalizationAutoCollapse();

  const timer = setInterval(() => {
    const done = tryLoad();
    if (done || attempts >= 30) clearInterval(timer);
  }, 600);
})();
