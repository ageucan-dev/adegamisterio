(() => {
  function selectDefaultSize() {
    const size = document.querySelector('#sizeOptions input[name="size"][value="700ml"]');
    if (!size) return;

    size.checked = true;
    size.defaultChecked = true;
    size.setAttribute("checked", "");
    size.closest(".option-card")?.classList.add("is-checked");

    const fieldset = size.closest("fieldset");
    if (fieldset) fieldset.dataset.selectionTouched = "true";

    if (typeof window.updateLiveTotal === "function") window.updateLiveTotal();
  }

  function syncAfterBuilderAction() {
    window.setTimeout(selectDefaultSize, 20);
    window.setTimeout(selectDefaultSize, 180);
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(".choose-product, #addToCart, #buyNow")) syncAfterBuilderAction();
  }, true);

  window.addEventListener("pageshow", syncAfterBuilderAction);
  window.addEventListener("load", syncAfterBuilderAction);
  window.addEventListener("copao:cart-updated", () => window.setTimeout(selectDefaultSize, 20));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncAfterBuilderAction, { once: true });
  } else {
    syncAfterBuilderAction();
  }
})();
