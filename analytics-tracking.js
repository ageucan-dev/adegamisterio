(() => {
  const ALLOWED_EVENTS = new Set([
    "login",
    "sign_up",
    "age_gate_view",
    "age_gate_result",
    "navigation_click",
    "whatsapp_open",
    "form_start",
    "form_error",
    "site_error"
  ]);

  const BLOCKED_PARAMETERS = new Set([
    "name",
    "full_name",
    "nome",
    "email",
    "mail",
    "phone",
    "telefone",
    "cpf",
    "document",
    "document_number",
    "birth_date",
    "nascimento",
    "address",
    "endereco",
    "street",
    "rua",
    "district",
    "bairro",
    "number",
    "numero",
    "complement",
    "reference",
    "notes",
    "observacao",
    "message",
    "mensagem",
    "uid",
    "user_id"
  ]);

  const recentEvents = new Map();
  const startedForms = new WeakSet();
  const statusValues = new WeakMap();

  let pendingLogin = false;
  let pendingSignUp = false;
  let signUpTracked = false;
  let lastGateScreen = "";

  window.dataLayer = window.dataLayer || [];

  function cleanValue(value) {
    if (typeof value === "boolean" || typeof value === "number") return value;
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-]/g, "")
      .slice(0, 80);
  }

  function cleanParameters(parameters = {}) {
    return Object.entries(parameters).reduce((safe, [key, value]) => {
      if (BLOCKED_PARAMETERS.has(String(key).toLowerCase())) return safe;
      const cleaned = cleanValue(value);
      if (cleaned === "") return safe;
      safe[key] = cleaned;
      return safe;
    }, {});
  }

  function track(eventName, parameters = {}) {
    if (eventName === "navigation_click" && parameters.button_name === "open_whatsapp") {
      eventName = "whatsapp_open";
      parameters = {
        channel: "whatsapp",
        section_name: parameters.section_name || "finish"
      };
    }

    if (!ALLOWED_EVENTS.has(eventName)) return false;

    const safeParameters = cleanParameters(parameters);
    const fingerprint = `${eventName}:${JSON.stringify(safeParameters)}`;
    const now = Date.now();
    const lastTime = recentEvents.get(fingerprint) || 0;

    if (now - lastTime < 800) return false;

    recentEvents.set(fingerprint, now);
    window.dataLayer.push({ event: eventName, ...safeParameters });
    return true;
  }

  window.copaoAnalytics = Object.freeze({ track });

  function formName(form) {
    if (form?.id === "gateForm") return "customer_registration";
    if (form?.id === "checkoutForm") return "delivery_details";
    if (form?.id === "customForm") return "product_customization";
    return "site_form";
  }

  function gateScreen() {
    const overlay = document.querySelector(".customer-gate-overlay");
    if (!overlay) return "";
    if (overlay.querySelector("#googleLogin")) return "login";
    if (overlay.querySelector("#gateForm")) return "registration";
    if (overlay.querySelector("#logoutGate")) return "access_denied";
    if (overlay.querySelector("#retryGate")) return "validation_error";
    return "access_gate";
  }

  function registerDeniedResult() {
    if (pendingSignUp && !signUpTracked) {
      track("sign_up", { method: "google" });
      signUpTracked = true;
    }

    track("age_gate_result", {
      result: "rejected",
      method: pendingSignUp ? "registration" : "stored_profile"
    });

    pendingLogin = false;
    pendingSignUp = false;
  }

  function inspectGate() {
    const screen = gateScreen();

    if (!screen) {
      lastGateScreen = "";
      return;
    }

    if (screen === lastGateScreen) return;
    lastGateScreen = screen;

    if (screen === "login") {
      pendingSignUp = false;
      signUpTracked = false;
    }

    track("age_gate_view", { screen_name: screen });

    if (screen === "access_denied") registerDeniedResult();
  }

  function statusErrorType(text) {
    if (/nome completo/i.test(text)) return "invalid_name";
    if (/telefone válido/i.test(text)) return "invalid_phone";
    if (/CPF com 11/i.test(text)) return "invalid_document";
    if (/data de nascimento/i.test(text)) return "missing_birth_date";
    if (/Confirme os dados/i.test(text)) return "terms_not_confirmed";
    if (/Erro ao salvar/i.test(text)) return "save_failed";
    return "";
  }

  function inspectStatuses() {
    document.querySelectorAll(".customer-gate-status").forEach((element) => {
      const text = element.textContent.trim();
      if (!text || statusValues.get(element) === text) return;
      statusValues.set(element, text);

      const errorType = statusErrorType(text);
      if (errorType) {
        track("form_error", {
          form_name: "customer_registration",
          error_type: errorType
        });
      }

      if (/Erro ao salvar|Falha na validação|Erro ao conectar|Erro no login|Domínio não autorizado|Falha de conexão/i.test(text)) {
        track("site_error", {
          script_name: "customer_access_gate",
          error_type: errorType || "authentication_error"
        });
      }
    });
  }

  function navigationDetails(target) {
    const mappings = [
      [".logo-wrap", "go_home", "header"],
      ['a[href="#produto"]', "open_products", "hero"],
      ['a[href="#carrinho"], .cart-chip, .bottom-cart-link', "open_cart", "navigation"],
      ['a[href="#finalizar"], .bottom-finish-link', "open_finish", "navigation"],
      [".choose-product", "open_product_builder", "products"],
      [".product-carousel-dot", "change_product", "products"],
      [".customer-profile-button", "open_profile", "profile"],
      [".customer-profile-logout", "logout", "profile"]
    ];

    for (const [selector, buttonName, sectionName] of mappings) {
      if (target.closest(selector)) {
        return { button_name: buttonName, section_name: sectionName };
      }
    }

    return null;
  }

  function trackCustomizationError(button) {
    if (!button?.matches("#addToCart, #buyNow")) return;

    const requiredGroups = ["size", "base", "intensity", "energy", "ice"];
    const hasMissingSelection = requiredGroups.some((group) => {
      return !document.querySelector(`input[name="${group}"]:checked`);
    });

    if (hasMissingSelection) {
      track("form_error", {
        form_name: "product_customization",
        error_type: "missing_selection"
      });
    }
  }

  function trackDeliveryError(button) {
    if (!button?.matches("#sendWhatsApp")) return;

    const cart = Array.isArray(window.state?.cart) ? window.state.cart : [];
    if (!cart.length) {
      track("form_error", {
        form_name: "delivery_details",
        error_type: "empty_cart"
      });
      return;
    }

    const requiredFields = ["customerName", "customerPhone", "street", "number", "district"];
    const hasMissingField = requiredFields.some((id) => {
      return !document.getElementById(id)?.value.trim();
    });

    if (hasMissingField) {
      track("form_error", {
        form_name: "delivery_details",
        error_type: "missing_required_fields"
      });
    }
  }

  document.addEventListener("focusin", (event) => {
    const form = event.target.closest("form");
    if (!form || startedForms.has(form)) return;

    startedForms.add(form);
    track("form_start", { form_name: formName(form) });
  }, true);

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("#gateForm");
    if (!form) return;

    pendingSignUp = true;
    signUpTracked = false;

    const nameIsValid = form.querySelector("#gateName")?.value.trim().length >= 3;
    const phoneIsValid = (form.querySelector("#gatePhone")?.value || "").replace(/\D/g, "").length >= 10;
    const documentIsValid = (form.querySelector("#gateCpf")?.value || "").replace(/\D/g, "").length === 11;
    const birthIsValid = Boolean(form.querySelector("#gateBirth")?.value);
    const termsAreValid = Boolean(form.querySelector("#gateTerms")?.checked);

    let errorType = "";
    if (!nameIsValid) errorType = "invalid_name";
    else if (!phoneIsValid) errorType = "invalid_phone";
    else if (!documentIsValid) errorType = "invalid_document";
    else if (!birthIsValid) errorType = "missing_birth_date";
    else if (!termsAreValid) errorType = "terms_not_confirmed";

    if (errorType) {
      track("form_error", {
        form_name: "customer_registration",
        error_type: errorType
      });
    }
  }, true);

  document.addEventListener("click", (event) => {
    const target = event.target;
    const loginButton = target.closest("#googleLogin");
    if (loginButton) pendingLogin = true;

    const navigation = navigationDetails(target);
    if (navigation) track("navigation_click", navigation);

    trackCustomizationError(target.closest("#addToCart, #buyNow"));
    trackDeliveryError(target.closest("#sendWhatsApp"));
  }, true);

  window.addEventListener("copao:customer-profile", () => {
    if (pendingLogin) track("login", { method: "google" });

    if (pendingSignUp && !signUpTracked) {
      track("sign_up", { method: "google" });
      signUpTracked = true;
    }

    track("age_gate_result", {
      result: "approved",
      method: pendingSignUp ? "registration" : "stored_profile"
    });

    pendingLogin = false;
    pendingSignUp = false;
  });

  window.addEventListener("error", (event) => {
    const source = String(event.filename || "inline_script").split("/").pop().split("?")[0];
    track("site_error", {
      script_name: source || "inline_script",
      error_type: "runtime_error"
    });
  });

  window.addEventListener("unhandledrejection", () => {
    track("site_error", {
      script_name: "promise",
      error_type: "unhandled_rejection"
    });
  });

  const observer = new MutationObserver(() => {
    inspectGate();
    inspectStatuses();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  inspectGate();
  inspectStatuses();
})();