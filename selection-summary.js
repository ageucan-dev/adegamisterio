(() => {
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
