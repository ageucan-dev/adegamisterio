(() => {
  const STORAGE_KEY = "copaoCheckoutCustomerV1";
  const FIELD_SELECTORS = {
    name: "#customerName",
    phone: "#customerPhone"
  };

  function readSavedCustomer() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (error) {
      return {};
    }
  }

  function writeSavedCustomer(data) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name: String(data.name || "").trim(),
        phone: String(data.phone || "").trim(),
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      // Se o navegador bloquear localStorage, o checkout segue funcionando normalmente.
    }
  }

  function fieldValue(selector) {
    return document.querySelector(selector)?.value?.trim() || "";
  }

  function saveCurrentCustomer() {
    const previous = readSavedCustomer();
    const next = {
      name: fieldValue(FIELD_SELECTORS.name) || previous.name || "",
      phone: fieldValue(FIELD_SELECTORS.phone) || previous.phone || ""
    };

    if (!next.name && !next.phone) return;
    writeSavedCustomer(next);
  }

  function fillIfEmpty(input, value) {
    if (!input || input.value.trim() || !value) return;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function prefillCustomerFields() {
    const saved = readSavedCustomer();
    fillIfEmpty(document.querySelector(FIELD_SELECTORS.name), saved.name);
    fillIfEmpty(document.querySelector(FIELD_SELECTORS.phone), saved.phone);
  }

  function installAutosave() {
    Object.values(FIELD_SELECTORS).forEach((selector) => {
      const input = document.querySelector(selector);
      if (!input || input.dataset.customerAutosave === "true") return;

      input.dataset.customerAutosave = "true";
      input.addEventListener("input", saveCurrentCustomer);
      input.addEventListener("change", saveCurrentCustomer);
      input.addEventListener("blur", saveCurrentCustomer);
    });

    ["#sendWhatsApp", "#buyNow", ".bottom-finish-link"].forEach((selector) => {
      const button = document.querySelector(selector);
      if (!button || button.dataset.customerAutosaveClick === "true") return;

      button.dataset.customerAutosaveClick = "true";
      button.addEventListener("click", saveCurrentCustomer, true);
    });
  }

  function init() {
    prefillCustomerFields();
    installAutosave();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("pageshow", () => {
    prefillCustomerFields();
    installAutosave();
  });
})();
