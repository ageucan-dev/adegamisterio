(() => {
  const style = document.createElement("style");
  style.textContent = `
    .builder-card {
      position: relative !important;
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
  `;
  document.head.appendChild(style);

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

  function updateFieldsetSummary(fieldset) {
    const checked = fieldset.querySelector('input[type="radio"]:checked');
    const summary = ensureSummary(fieldset);
    if (!summary) return;

    const nextText = checked ? selectedLabel(checked) : "";
    if (summary.textContent !== nextText) summary.textContent = nextText;
    summary.hidden = !checked;
  }

  function syncAllSummaries() {
    document.querySelectorAll(".custom-form fieldset").forEach(updateFieldsetSummary);
  }

  function scrollBuilderTop() {
    const builder = document.querySelector("#personalizacao");
    if (!builder || builder.classList.contains("is-hidden")) return;
    builder.scrollIntoView({ behavior: "smooth", block: "start" });
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
      document.querySelector("#produto")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    builder.appendChild(close);
  }

  document.addEventListener("change", (event) => {
    if (!event.target.matches('.custom-form input[type="radio"]')) return;
    const fieldset = event.target.closest("fieldset");
    if (!fieldset) return;

    updateFieldsetSummary(fieldset);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.matches("#showBuilder, #addToCart, #buyNow, #clearCart")) return;

    if (event.target.matches("#showBuilder")) {
      setTimeout(() => {
        installBuilderClose();
        scrollBuilderTop();
      }, 80);
      return;
    }

    setTimeout(() => {
      syncAllSummaries();
      if (event.target.matches("#addToCart, #buyNow")) scrollBuilderTop();
    }, 100);
  }, true);

  window.addEventListener("load", () => {
    installBuilderClose();
    syncAllSummaries();
  });

  installBuilderClose();
  syncAllSummaries();
})();
