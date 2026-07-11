(() => {
  const HEADER_OFFSET = 92;

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

      button,
      a,
      label,
      input,
      textarea,
      select,
      [role="button"],
      .btn,
      .choose-product,
      .product-carousel-dot,
      .item-action,
      .bottom-bar a {
        pointer-events: auto !important;
        touch-action: manipulation !important;
      }

      #inicio.hero::before,
      #inicio.hero::after {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function scrollTargetFromTrigger(trigger) {
    if (!trigger) return null;

    const scrollId = trigger.dataset?.scrollTo;
    if (scrollId) return document.getElementById(scrollId);

    const href = trigger.getAttribute?.("href") || "";
    if (!href.startsWith("#") || href.length <= 1) return null;

    return document.getElementById(href.slice(1));
  }

  function smoothScrollTo(target, delay = 0) {
    if (!target) return;

    window.setTimeout(() => {
      const targetTop = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: "smooth"
      });
    }, delay);
  }

  function installInteractionSafety() {
    if (window.__copaoInteractionSafetyReady) return;
    window.__copaoInteractionSafetyReady = true;

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest?.('a[href^="#"], [data-scroll-to]');
      if (!trigger || trigger.closest?.(".customer-gate-overlay")) return;

      const target = scrollTargetFromTrigger(trigger);
      if (!target) return;

      event.preventDefault();
      smoothScrollTo(target);
    }, true);

    document.addEventListener("click", (event) => {
      const productButton = event.target.closest?.(".choose-product");
      if (!productButton || productButton.closest?.(".customer-gate-overlay")) return;

      const builder = document.getElementById("personalizacao");
      window.setTimeout(() => {
        if (builder && !builder.classList.contains("is-hidden")) smoothScrollTo(builder);
      }, 260);
    }, true);
  }

  function installPersonalizationAutoCollapse() {
    if (window.__copaoAutoCollapseReady) return;
    window.__copaoAutoCollapseReady = true;
    installPersonalizationStyles();
    installInteractionSafety();

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
