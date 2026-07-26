(() => {
  const SIZE_SELECTOR = '#sizeOptions input[name="size"][value="700ml"]';
  let sizeObserver = null;

  function ensureSizeSummary(fieldset) {
    const legend = fieldset?.querySelector("legend");
    if (!legend) return;

    const toggle = legend.querySelector(".step-toggle");
    let title = legend.querySelector(".fixed-size-title");

    if (!title) {
      title = [...legend.children].find((child) => {
        return child !== toggle && !child.classList.contains("step-summary");
      }) || null;

      if (title) {
        title.classList.add("fixed-size-title");
      } else {
        title = document.createElement("span");
        title.className = "fixed-size-title";
        legend.insertBefore(title, legend.firstChild);
      }
    }

    if (title.textContent !== "Tamanho") title.textContent = "Tamanho";

    [...legend.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) node.remove();
    });

    let summary = legend.querySelector(".step-summary");
    if (!summary) {
      summary = document.createElement("small");
      summary.className = "step-summary";
      legend.appendChild(summary);
    }

    if (summary.textContent !== "700ml") summary.textContent = "700ml";
    summary.hidden = false;

    if (toggle) {
      toggle.hidden = true;
      toggle.tabIndex = -1;
      toggle.setAttribute("aria-hidden", "true");
    }
  }

  function selectDefaultSize() {
    const size = document.querySelector(SIZE_SELECTOR);
    if (!size) return false;

    if (!size.checked) size.checked = true;
    size.defaultChecked = true;
    if (!size.hasAttribute("checked")) size.setAttribute("checked", "");
    size.tabIndex = -1;

    const card = size.closest(".option-card");
    card?.classList.add("is-checked");

    const fieldset = size.closest("fieldset");
    if (fieldset) {
      fieldset.dataset.selectionTouched = "true";
      fieldset.classList.add("fixed-size-fieldset");
      fieldset.classList.remove("is-collapsed");
      ensureSizeSummary(fieldset);
    }

    const options = document.querySelector("#sizeOptions");
    if (options && options.getAttribute("aria-hidden") !== "true") {
      options.setAttribute("aria-hidden", "true");
    }

    if (typeof window.updateLiveTotal === "function") window.updateLiveTotal();
    return true;
  }

  function syncAfterBuilderAction() {
    window.setTimeout(selectDefaultSize, 20);
    window.setTimeout(selectDefaultSize, 180);
    window.setTimeout(selectDefaultSize, 700);
  }

  function observeSizeFieldset() {
    if (sizeObserver) return;
    const builder = document.querySelector("#personalizacao");
    if (!builder) return;

    sizeObserver = new MutationObserver(() => {
      window.requestAnimationFrame(selectDefaultSize);
    });

    sizeObserver.observe(builder, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(".choose-product, #addToCart, #buyNow")) syncAfterBuilderAction();
  }, true);

  window.addEventListener("pageshow", syncAfterBuilderAction);
  window.addEventListener("load", () => {
    observeSizeFieldset();
    syncAfterBuilderAction();
  });
  window.addEventListener("copao:cart-updated", () => window.setTimeout(selectDefaultSize, 20));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      observeSizeFieldset();
      syncAfterBuilderAction();
    }, { once: true });
  } else {
    observeSizeFieldset();
    syncAfterBuilderAction();
  }
})();
