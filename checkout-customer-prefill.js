(() => {
  const PROFILE_KEY = "copaoCustomerProfileV1";
  const DELIVERY_KEY = "copaoCheckoutDeliveryV1";

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

  function fillInput(key, value, force = false) {
    const input = getField(FIELD_SELECTORS[key]);
    const nextValue = normalizeText(value);
    if (!input || !nextValue) return;
    if (!force && normalizeText(input.value)) return;

    input.value = nextValue;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function prefillCheckoutFields(forceProfile = false) {
    const profile = readJson(PROFILE_KEY);
    const delivery = readJson(DELIVERY_KEY);
    const data = mergeDeliveryWithProfile(delivery, profile);

    Object.entries(data).forEach(([key, value]) => {
      const force = forceProfile && (key === "name" || key === "phone");
      fillInput(key, value, force);
    });
  }

  function installAutosave() {
    Object.values(FIELD_SELECTORS).forEach((selector) => {
      const input = getField(selector);
      if (!input || input.dataset.customerAutosave === "true") return;

      input.dataset.customerAutosave = "true";
      input.addEventListener("input", saveCurrentDelivery);
      input.addEventListener("change", saveCurrentDelivery);
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
    prefillCheckoutFields(true);
    saveCurrentDelivery();
  });

  window.addEventListener("pageshow", () => {
    prefillCheckoutFields();
    installAutosave();
  });

  window.addEventListener("beforeunload", saveCurrentDelivery);
})();
