(() => {
  const DEFAULT_OFFSET = 92;
  const PRODUCT_OFFSET = 8;
  const PROMO_ASSET_VERSION = "13";
  const CUSTOMER_PROFILE_KEY = "copaoCustomerProfileV1";

  let promoAssetsLoaded = false;
  let promoAssetsPromise = null;
  let promoAccessConfirmed = false;

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

  function applyCatalogFixes() {
    const catalog = window.products;
    if (!catalog || window.__copaoCatalogFixesApplied) return;

    const allowedSizes = [{ id: "700ml", label: "700ml", price: 11.5 }];

    Object.values(catalog).forEach((product) => {
      product.sizes = allowedSizes;
      product.ices = Array.isArray(product.ices)
        ? product.ices.filter((item) => item.id !== "gelo-melancia")
        : [];
    });

    window.__copaoCatalogFixesApplied = true;

    if (typeof renderOptions === "function") renderOptions();
    if (typeof updateProductPrices === "function") updateProductPrices();
  }

  function cartQuantity() {
    const cart = window.state?.cart;
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  function clearCustomizationUi() {
    if (window.state) window.state.quantity = 1;

    const notes = document.querySelector("#notes");
    if (notes) notes.value = "";

    document.querySelectorAll('.custom-form input[type="radio"]').forEach((input) => {
      input.checked = false;
      input.defaultChecked = false;
      input.removeAttribute("checked");
    });

    document.querySelectorAll(".custom-form .option-card").forEach((card) => {
      card.classList.remove("is-checked");
    });

    document.querySelectorAll(".custom-form fieldset").forEach((fieldset) => {
      fieldset.classList.remove("is-collapsed", "base-single-open", "base-single-selected");
      delete fieldset.dataset.selectionTouched;

      const summary = fieldset.querySelector(".step-summary");
      if (summary) {
        summary.textContent = "";
        summary.hidden = true;
      }
    });

    const quantityValue = document.querySelector("#quantityValue");
    if (quantityValue) quantityValue.textContent = "1";

    if (typeof updateLiveTotal === "function") {
      updateLiveTotal();
    } else {
      const itemTotal = document.querySelector("#itemTotal");
      if (itemTotal) itemTotal.textContent = "R$ 0,00";
    }
  }

  function installBuilderFinishCleanup() {
    if (window.__copaoBuilderFinishCleanupReady) return;
    window.__copaoBuilderFinishCleanupReady = true;

    document.addEventListener("click", (event) => {
      const button = event.target.closest?.("#addToCart, #buyNow");
      if (!button) return;

      const beforeQuantity = cartQuantity();
      const shouldCloseBuilder = button.id === "buyNow";

      window.setTimeout(() => {
        if (cartQuantity() <= beforeQuantity) return;

        clearCustomizationUi();

        if (shouldCloseBuilder) {
          document.querySelector("#personalizacao")?.classList.add("is-hidden");
        }
      }, 0);
    }, true);
  }

  function loadStyle(href) {
    return new Promise((resolve) => {
      if (document.querySelector(`link[href^="${href}"]`)) return resolve();

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${href}?v=${PROMO_ASSET_VERSION}`;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src^="${src}"]`)) return resolve();

      const script = document.createElement("script");
      script.src = `${src}?v=${PROMO_ASSET_VERSION}`;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function customerAccessIsOpen() {
    return document.body.classList.contains("access-gate-loading") ||
      Boolean(document.querySelector(".customer-gate-overlay"));
  }

  function hasCachedApprovedProfile() {
    try {
      return Boolean(window.localStorage.getItem(CUSTOMER_PROFILE_KEY));
    } catch (error) {
      return false;
    }
  }

  async function loadPromoAssets() {
    if (promoAssetsLoaded) return true;
    if (customerAccessIsOpen()) return false;
    if (!promoAccessConfirmed && !hasCachedApprovedProfile()) return false;
    if (promoAssetsPromise) return promoAssetsPromise;

    promoAssetsPromise = (async () => {
      await loadStyle("ux-upgrades.css");
      await loadStyle("promo-wheel-catraca.css");
      await loadScript("ux-upgrades.js");
      await loadScript("promo-wheel-catraca.js");
      promoAssetsLoaded = true;
      return true;
    })().catch((error) => {
      console.error("Não foi possível carregar a roleta promocional.", error);
      promoAssetsPromise = null;
      return false;
    });

    return promoAssetsPromise;
  }

  function confirmPromoAccessAndLoad() {
    promoAccessConfirmed = true;
    window.setTimeout(loadPromoAssets, 300);
  }

  function initialize() {
    applyCatalogFixes();
    installPersonalizationAutoCollapse();
    installBuilderFinishCleanup();
  }

  window.addEventListener("copao:customer-profile", confirmPromoAccessAndLoad);
  window.addEventListener("copao:customer-approved", confirmPromoAccessAndLoad);
  window.addEventListener("pageshow", () => {
    initialize();
    window.setTimeout(loadPromoAssets, 600);
  });
  window.addEventListener("load", () => {
    initialize();
    window.setTimeout(loadPromoAssets, 2600);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  const promoTimer = window.setInterval(async () => {
    const loaded = await loadPromoAssets();
    if (loaded) window.clearInterval(promoTimer);
  }, 1000);

  window.setTimeout(() => window.clearInterval(promoTimer), 120000);
})();
