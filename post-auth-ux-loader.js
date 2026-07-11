(() => {
  const DEFAULT_OFFSET = 92;
  const PRODUCT_OFFSET = 8;

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

  function absoluteTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function bottomBarSpace() {
    const bar = document.querySelector(".bottom-bar");
    const barHeight = bar ? Math.ceil(bar.getBoundingClientRect().height) : 0;
    return barHeight + 104;
  }

  function scrollTargetFromTrigger(trigger) {
    if (!trigger) return null;

    const scrollId = trigger.dataset?.scrollTo;
    if (scrollId) return document.getElementById(scrollId);

    const href = trigger.getAttribute?.("href") || "";
    if (!href.startsWith("#") || href.length <= 1) return null;

    return document.getElementById(href.slice(1));
  }

  function productPreviewScrollTop(target) {
    const targetTop = absoluteTop(target) - PRODUCT_OFFSET;
    const activeSlide = target.querySelector(".product-slide.is-active") || target.querySelector(".product-slide");
    const buildButton = activeSlide?.querySelector(".product-build-btn");

    if (!buildButton) return Math.max(targetTop, 0);

    const buttonBottom = buildButton.getBoundingClientRect().bottom + window.scrollY;
    const visibleBottom = window.innerHeight - bottomBarSpace();
    const minScrollToShowButton = buttonBottom - visibleBottom;

    if (minScrollToShowButton <= targetTop) return Math.max(targetTop, 0);
    return Math.max(minScrollToShowButton, 0);
  }

  function regularScrollTop(target) {
    return Math.max(absoluteTop(target) - DEFAULT_OFFSET, 0);
  }

  function scrollNow(target) {
    const targetTop = target.id === "produto" ? productPreviewScrollTop(target) : regularScrollTop(target);
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth"
    });
  }

  function smoothScrollTo(target, delay = 0) {
    if (!target) return;

    window.setTimeout(() => scrollNow(target), delay);

    if (target.id === "produto") {
      window.setTimeout(() => scrollNow(target), delay + 420);
      window.setTimeout(() => scrollNow(target), delay + 920);
    }
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

      if (!event.isTrusted && fieldset.querySelectorAll('input[type="radio"]').length > 1) return;

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