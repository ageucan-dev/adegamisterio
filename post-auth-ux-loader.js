(() => {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installPersonalizationAutoCollapse, { once: true });
  } else {
    installPersonalizationAutoCollapse();
  }
})();
