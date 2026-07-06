(() => {
  function installCompactOptionStyles() {
    if (document.querySelector("#compact-option-card-style")) return;

    const style = document.createElement("style");
    style.id = "compact-option-card-style";
    style.textContent = `
      .option-grid {
        align-items: start !important;
      }

      .option-card.option-card--compact {
        min-height: 84px !important;
        padding-top: 18px !important;
        padding-bottom: 18px !important;
        justify-content: center !important;
        gap: 0 !important;
      }

      .option-card.option-card--compact span {
        margin: 0 !important;
      }

      .option-additional {
        margin-top: 6px !important;
        color: #0b1d3a !important;
        font-size: 0.95rem !important;
        font-weight: 700 !important;
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installCompactOptionStyles, { once: true });
  } else {
    installCompactOptionStyles();
  }
})();
