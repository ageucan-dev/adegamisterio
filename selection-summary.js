(() => {
  const style = document.createElement("style");
  style.textContent = `
    .builder-card {
      position: relative !important;
    }

    .more-options-notice {
      margin: -2px 0 22px !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: #0b1d3a !important;
      font-size: .98rem !important;
      font-weight: 900 !important;
      text-align: center !important;
      box-shadow: none !important;
    }

    .more-options-notice.is-hidden {
      display: none !important;
    }

    .cart-price {
      display: inline-flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      justify-content: flex-start !important;
      gap: 2px !important;
      color: #0b1d3a !important;
      font-weight: 900 !important;
      line-height: 1.05 !important;
      white-space: nowrap !important;
      text-align: right !important;
    }

    .cart-old-price {
      color: #7a879c !important;
      font-size: .72rem !important;
      font-weight: 900 !important;
      text-decoration: line-through !important;
      text-decoration-thickness: 2px !important;
      line-height: 1 !important;
    }

    .cart-current-price {
      color: #0b1d3a !important;
      font-size: 1rem !important;
      font-weight: 900 !important;
      line-height: 1 !important;
    }

    .builder-close {
      position: absolute !important;
      top: 18px !important;
      right: 18px !important;
      z-index: 5 !important;
      width: 34px !important;
      height: 34px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 999px !important;
      border: 1px solid rgba(11,29,58,.14) !important;
      background: #fff4cc !important;
      color: #0b1d3a !important;
      font-size: 1.2rem !important;
      font-weight: 900 !important;
      line-height: 1 !important;
      box-shadow: 0 8px 18px rgba(11,29,58,.08) !important;
      cursor: pointer !important;
    }

    .builder-card .section-title {
      padding-right: 44px !important;
    }

    .custom-form legend {
      display: grid !important;
      grid-template-columns: 1fr auto !important;
      align-items: center !important;
      column-gap: 10px !important;
      row-gap: 2px !important;
      width: 100% !important;
    }

    .custom-form legend .step-summary {
      grid-column: 1 / -1 !important;
      display: block !important;
      margin-top: 2px !important;
      color: #ff7a00 !important;
      font-size: 0.82rem !important;
      font-weight: 900 !important;
      line-height: 1.2 !important;
    }

    .custom-form legend .step-summary[hidden] {
      display: none !important;
    }

    .custom-form fieldset.is-collapsed legend {
      margin-bottom: 10px !important;
    }

    .custom-form.is-selecting-option .option-card,
    .custom-form.is-selecting-option fieldset,
    .custom-form.is-selecting-option .option-grid {
      transition: none !important;
      animation: none !important;
    }
  `;
  document.head.appendChild(style);

  let rafId = 0;
  let selectionTimer = 0;

  function selectedLabel(input) {
    const card = input.closest(".option-card");
    return card?.querySelector("span")?.textContent?.trim() || input.value || "";
  }

  function ensureSummary(fieldset) {
    const legend = fieldset.querySelector("legend");
    if (!legend) return null;

    let summary = legend.querySelector(".step-summary");
    if (!summary) {
      summary = document.createElement("small");
      summary.className = "step-summary";
      summary.hidden = true;
      legend.appendChild(summary);
    }
    return summary;
  }

  function updateCheckedClasses(fieldset) {
    if (!fieldset) return;
    fieldset.querySelectorAll(".option-card").forEach((card) => {
      const input = card.querySelector('input[type="radio"]');
      card.classList.toggle("is-checked", !!input?.checked);
    });
  }

  function updateFieldsetSummary(fieldset) {
    const checked = fieldset.querySelector('input[type="radio"]:checked');
    const summary = ensureSummary(fieldset);
    if (!summary) return;

    const nextText = checked ? selectedLabel(checked) : "";
    if (summary.textContent !== nextText) summary.textContent = nextText;
    summary.hidden = !checked;
    updateCheckedClasses(fieldset);
  }

  function queueFieldsetUpdate(fieldset) {
    if (!fieldset) return;
    window.cancelAnimationFrame(rafId);
    rafId = window.requestAnimationFrame(() => updateFieldsetSummary(fieldset));
  }

  function markSelecting(form) {
    if (!form) return;
    form.classList.add("is-selecting-option");
    window.clearTimeout(selectionTimer);
    selectionTimer = window.setTimeout(() => {
      form.classList.remove("is-selecting-option");
    }, 180);
  }

  function syncAllSummaries() {
    document.querySelectorAll(".custom-form fieldset").forEach(updateFieldsetSummary);
  }

  function scrollWithOffset(target, delay = 0) {
    if (!target) return;
    window.setTimeout(() => {
      const headerOffset = 92;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    }, delay);
  }

  function scrollBuilderTop(delay = 220) {
    const builder = document.querySelector("#personalizacao");
    if (!builder || builder.classList.contains("is-hidden")) return;
    scrollWithOffset(builder, delay);
  }

  function deliveryComplete() {
    const requiredFields = ["#customerName", "#customerPhone", "#street", "#number", "#district"];
    return requiredFields.every((selector) => document.querySelector(selector)?.value.trim());
  }

  function handleBottomFinish(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!deliveryComplete()) {
      scrollWithOffset(document.querySelector(".checkout-card"), 80);
      setTimeout(() => document.querySelector("#customerName")?.focus({ preventScroll: true }), 520);
      return;
    }

    if (typeof finish === "function") {
      finish();
      return;
    }

    document.querySelector("#sendWhatsApp")?.click();
  }

  function installMoreOptionsNotice() {
    const product = document.querySelector("#produto");
    if (!product || document.querySelector(".more-options-notice")) return;

    const notice = document.createElement("div");
    notice.className = "more-options-notice";
    notice.textContent = "Mais opções em breve";
    product.insertAdjacentElement("afterend", notice);
  }

  function hideMoreOptionsNotice() {
    document.querySelector(".more-options-notice")?.classList.add("is-hidden");
  }

  function showMoreOptionsNotice() {
    document.querySelector(".more-options-notice")?.classList.remove("is-hidden");
  }

  function installBuilderClose() {
    const builder = document.querySelector("#personalizacao");
    if (!builder || builder.querySelector(".builder-close")) return;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "builder-close";
    close.setAttribute("aria-label", "Fechar personalização");
    close.textContent = "×";

    close.addEventListener("click", () => {
      builder.classList.add("is-hidden");
      showMoreOptionsNotice();
      document.querySelector("#produto")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    builder.appendChild(close);
  }

  function installBottomFinishFlow() {
    const bottomFinish = document.querySelector(".bottom-finish-link");
    if (!bottomFinish || bottomFinish.dataset.deliveryFlow === "true") return;

    bottomFinish.dataset.deliveryFlow = "true";
    bottomFinish.addEventListener("click", handleBottomFinish);
  }

  document.addEventListener("change", (event) => {
    if (!event.target.matches('.custom-form input[type="radio"]')) return;
    const fieldset = event.target.closest("fieldset");
    const form = event.target.closest(".custom-form");
    markSelecting(form);
    queueFieldsetUpdate(fieldset);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.matches("#showBuilder, #addToCart, #buyNow, #clearCart")) return;

    if (event.target.matches("#showBuilder")) {
      hideMoreOptionsNotice();
      setTimeout(() => {
        installBuilderClose();
        scrollBuilderTop(80);
      }, 80);
      return;
    }

    setTimeout(() => {
      syncAllSummaries();
      if (event.target.matches("#addToCart")) scrollBuilderTop(420);
    }, 140);
  }, true);

  window.addEventListener("load", () => {
    installMoreOptionsNotice();
    installBuilderClose();
    installBottomFinishFlow();
    syncAllSummaries();
  });

  installMoreOptionsNotice();
  installBuilderClose();
  installBottomFinishFlow();
  syncAllSummaries();
})();
