(() => {
  const PROFILE_KEY = "copaoCustomerProfileV1";
  const DELIVERY_KEY = "copaoCheckoutDeliveryV1";
  const EDITED_FLAG = "customerEdited";

  const FIELD_SELECTORS = {
    name: "#customerName",
    phone: "#customerPhone",
    street: "#street",
    number: "#number",
    district: "#district",
    complement: "#complement",
    reference: "#reference",
    deliveryNotes: "#deliveryNotes"
  };

  let saveTimer = null;

  function readJson(key) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (error) {
      return {};
    }
  }

  function writeJson(key, data) {
    try {
      window.localStorage.setItem(key, JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      // Se o navegador bloquear localStorage, o checkout segue funcionando normalmente.
    }
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function getField(selector) {
    return document.querySelector(selector);
  }

  function fieldValue(selector) {
    return normalizeText(getField(selector)?.value || "");
  }

  function currentDeliveryData() {
    return Object.fromEntries(
      Object.entries(FIELD_SELECTORS).map(([key, selector]) => [key, fieldValue(selector)])
    );
  }

  function mergeDeliveryWithProfile(delivery = {}, profile = {}) {
    return {
      name: normalizeText(delivery.name || profile.name),
      phone: normalizeText(delivery.phone || profile.phone),
      street: normalizeText(delivery.street),
      number: normalizeText(delivery.number),
      district: normalizeText(delivery.district),
      complement: normalizeText(delivery.complement),
      reference: normalizeText(delivery.reference),
      deliveryNotes: normalizeText(delivery.deliveryNotes)
    };
  }

  function saveCurrentDelivery() {
    window.clearTimeout(saveTimer);
    saveTimer = null;

    const profile = readJson(PROFILE_KEY);
    const previous = readJson(DELIVERY_KEY);
    const current = currentDeliveryData();

    const next = Object.fromEntries(
      Object.keys(FIELD_SELECTORS).map((key) => [key, current[key] || previous[key] || ""])
    );

    next.name = next.name || profile.name || "";
    next.phone = next.phone || profile.phone || "";

    const hasAnyData = Object.values(next).some(Boolean);
    if (!hasAnyData) return;

    writeJson(DELIVERY_KEY, next);
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveCurrentDelivery, 180);
  }

  function fillInput(key, value) {
    const input = getField(FIELD_SELECTORS[key]);
    const nextValue = normalizeText(value);
    if (!input || !nextValue) return;

    // Nunca altera o campo ativo nem um campo que o usuário já editou manualmente.
    if (document.activeElement === input) return;
    if (input.dataset[EDITED_FLAG] === "true") return;
    if (normalizeText(input.value)) return;

    input.value = nextValue;
  }

  function prefillCheckoutFields() {
    const profile = readJson(PROFILE_KEY);
    const delivery = readJson(DELIVERY_KEY);
    const data = mergeDeliveryWithProfile(delivery, profile);

    Object.entries(data).forEach(([key, value]) => fillInput(key, value));
  }

  function installAutosave() {
    Object.values(FIELD_SELECTORS).forEach((selector) => {
      const input = getField(selector);
      if (!input || input.dataset.customerAutosave === "true") return;

      input.dataset.customerAutosave = "true";
      input.addEventListener("input", (event) => {
        if (event.isTrusted) input.dataset[EDITED_FLAG] = "true";
        scheduleSave();
      });
      input.addEventListener("change", scheduleSave);
      input.addEventListener("blur", saveCurrentDelivery);
    });

    ["#addToCart", "#sendWhatsApp", "#buyNow", ".bottom-finish-link"].forEach((selector) => {
      const button = document.querySelector(selector);
      if (!button || button.dataset.customerAutosaveClick === "true") return;

      button.dataset.customerAutosaveClick = "true";
      button.addEventListener("click", saveCurrentDelivery, true);
    });
  }

  function init() {
    prefillCheckoutFields();
    installAutosave();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("copao:customer-profile", () => {
    prefillCheckoutFields();
    scheduleSave();
  });

  window.addEventListener("pageshow", () => {
    prefillCheckoutFields();
    installAutosave();
  });

  window.addEventListener("beforeunload", saveCurrentDelivery);
})();
