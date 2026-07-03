(() => {
  const style = document.createElement("style");
  style.textContent = `
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
      legend.appendChild(summary);
    }
    return summary;
  }

  function updateFieldsetSummary(fieldset) {
    const checked = fieldset.querySelector('input[type="radio"]:checked');
    const summary = ensureSummary(fieldset);
    if (!summary) return;

    summary.textContent = checked ? selectedLabel(checked) : "";
    summary.hidden = !checked;
  }

  function syncAllSummaries() {
    document.querySelectorAll(".custom-form fieldset").forEach(updateFieldsetSummary);
  }

  document.addEventListener("change", (event) => {
    if (!event.target.matches('.custom-form input[type="radio"]')) return;
    const fieldset = event.target.closest("fieldset");
    if (!fieldset) return;

    setTimeout(() => updateFieldsetSummary(fieldset), 0);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.matches("#addToCart, #buyNow, #clearCart")) return;
    setTimeout(syncAllSummaries, 60);
  }, true);

  new MutationObserver(syncAllSummaries).observe(document.body, {
    childList: true,
    subtree: true
  });

  syncAllSummaries();
})();
