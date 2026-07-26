(() => {
  const PROMO_PRIZE_KEY = "copaoPromoWheelPrizeV1";
  const CONSUMED_PRIZE_KEY = "copaoConsumedRoulettePrizeV1";
  const LAST_ORDER_KEY = "copaoLastOrderCompletedV1";
  const CART_STORAGE_KEY = "copaoCartV2";
  const WHATSAPP_NUMBER = "5516996396543";

  const EMOJI = {
    cup: String.fromCodePoint(0x1F964),
    cart: String.fromCodePoint(0x1F6D2),
    money: String.fromCodePoint(0x1F4B0),
    pin: String.fromCodePoint(0x1F4CD),
    check: String.fromCodePoint(0x2705)
  };

  function brl(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function readJson(key, storage = window.localStorage) {
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value, storage = window.localStorage) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getCart() {
    try {
      return Array.isArray(window.state?.cart) ? window.state.cart : [];
    } catch (error) {
      return [];
    }
  }

  function getTotals() {
    if (typeof window.cartTotals === "function") return window.cartTotals();
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);
    const delivery = totalCups > 0 && totalCups < 3 ? 5 : 0;
    return { subtotal, totalCups, delivery, total: subtotal + delivery };
  }

  function getDeliveryData() {
    if (typeof window.deliveryData === "function") return window.deliveryData();
    return {
      name: document.querySelector("#customerName")?.value.trim() || "",
      phone: document.querySelector("#customerPhone")?.value.trim() || "",
      street: document.querySelector("#street")?.value.trim() || "",
      number: document.querySelector("#number")?.value.trim() || "",
      district: document.querySelector("#district")?.value.trim() || "",
      complement: document.querySelector("#complement")?.value.trim() || "",
      reference: document.querySelector("#reference")?.value.trim() || "",
      notes: document.querySelector("#deliveryNotes")?.value.trim() || ""
    };
  }

  function prizeMatchesConsumed(prize, consumed) {
    if (!prize || !consumed) return false;
    if (prize.prizeId && consumed.prizeId) return prize.prizeId === consumed.prizeId;
    if (prize.savedAt && consumed.prizeSavedAt) return prize.savedAt === consumed.prizeSavedAt;
    return false;
  }

  function getPromoPrize() {
    const prize = readJson(PROMO_PRIZE_KEY);
    const consumed = readJson(CONSUMED_PRIZE_KEY);
    if (!prize || prizeMatchesConsumed(prize, consumed)) return null;
    if (prize.type !== "discount" || Number(prize.value || 0) !== 5) return null;
    return prize;
  }

  function getPromoLine(totals) {
    const prize = getPromoPrize();
    if (!prize) return "";
    const value = Math.min(5, Number(totals?.promoDiscount || prize.value || 0));
    return `• Roleta do Copão: -${brl(value)} (${prize.label})`;
  }

  function itemBlock(item, index) {
    return [
      `*${index + 1}. ${item.product} - ${item.size.label}*`,
      `• Base: ${item.base.label}`,
      `• Intensidade: ${item.intensity}`,
      `• Energético: ${item.energy.label}`,
      `• Gelo: ${item.ice.label}`,
      `• Quantidade: ${item.quantity}`,
      `• Valor unitário: ${brl(item.unitPrice)}`,
      `• Subtotal: ${brl(item.unitPrice * item.quantity)}`,
      item.notes ? `• Observações: ${item.notes}` : ""
    ].filter(Boolean).join("\n");
  }

  function buildCleanWhatsAppMessage() {
    const cart = getCart();
    const totals = getTotals();
    const data = getDeliveryData();
    const promoLine = getPromoLine(totals);
    const items = cart.map(itemBlock).join("\n\n");
    const deliveryText = Number(totals.delivery || 0) > 0 ? brl(totals.delivery) : "Grátis";

    const summaryLines = [
      `• Subtotal: ${brl(totals.subtotal)}`,
      `• Entrega: ${deliveryText}`,
      promoLine,
      `• Total: ${brl(totals.total)}`
    ].filter(Boolean);

    const deliveryLines = [
      `• Nome: ${data.name}`,
      `• Contato: ${data.phone}`,
      `• Endereço: ${data.street}, ${data.number} - ${data.district}`,
      data.complement ? `• Complemento: ${data.complement}` : "",
      data.reference ? `• Referência: ${data.reference}` : "",
      data.notes ? `• Observação: ${data.notes}` : ""
    ].filter(Boolean);

    return [
      `*${EMOJI.cup} COPÃO NA MÃO | NOVO PEDIDO*`,
      "Ficha organizada para preparo e conferência.",
      "",
      `*${EMOJI.cart} ITENS DO CARRINHO*`,
      "",
      items,
      "",
      `*${EMOJI.money} RESUMO DO PEDIDO*`,
      ...summaryLines,
      "",
      `*${EMOJI.pin} DADOS DE ENTREGA*`,
      ...deliveryLines,
      "",
      `${EMOJI.check} Aguardo confirmação para preparo.`
    ].join("\n");
  }

  function createWhatsAppUrl(message) {
    const url = new URL("https://api.whatsapp.com/send");
    url.searchParams.set("phone", WHATSAPP_NUMBER);
    url.searchParams.set("text", message);
    return url.toString();
  }

  function removePromoVisuals() {
    document.querySelector(".promo-wheel-badge")?.remove();
    document.querySelector(".promo-benefit-row")?.remove();
  }

  function consumePromoPrize(prize) {
    if (prize) {
      writeJson(CONSUMED_PRIZE_KEY, {
        prizeId: prize.prizeId || "",
        prizeSavedAt: prize.savedAt || "",
        consumedAt: new Date().toISOString()
      });
    }

    try {
      localStorage.removeItem(PROMO_PRIZE_KEY);
      sessionStorage.removeItem(PROMO_PRIZE_KEY);
    } catch (error) {
      // O reset visual e em memória ainda será realizado.
    }

    removePromoVisuals();
    window.dispatchEvent(new CustomEvent("copao:roulette-prize-consumed", {
      detail: { prizeType: prize ? "fixed_discount" : "none" }
    }));
  }

  function resetCustomizationUi() {
    if (window.state) window.state.quantity = 1;

    const notes = document.querySelector("#notes");
    if (notes) notes.value = "";

    document.querySelectorAll('.custom-form input[type="radio"]').forEach((input) => {
      input.checked = false;
      input.defaultChecked = false;
      input.removeAttribute("checked");
    });

    document.querySelectorAll(".custom-form .option-card").forEach((card) => {
      card.classList.remove("is-checked");
    });

    document.querySelectorAll(".custom-form fieldset").forEach((fieldset) => {
      fieldset.classList.remove("is-collapsed", "base-single-open", "base-single-selected");
      delete fieldset.dataset.selectionTouched;
    });

    if (typeof window.renderOptions === "function") {
      window.renderOptions();
    } else {
      window.ensureDefaultSize?.();
      window.updateLiveTotal?.();
    }

    document.querySelector("#personalizacao")?.classList.add("is-hidden");
  }

  function resetOrderState() {
    if (window.state) {
      window.state.cart = [];
      window.state.quantity = 1;
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, "[]");
    } catch (error) {
      // O estado em memória ainda será limpo.
    }

    resetCustomizationUi();
    removePromoVisuals();

    if (typeof window.renderCart === "function") {
      window.renderCart();
    } else {
      document.querySelector("#cartCount")?.replaceChildren("0");
      document.querySelector("#bottomCartCount")?.replaceChildren("0");
      document.querySelector("#subtotalValue")?.replaceChildren("R$ 0,00");
      document.querySelector("#deliveryValue")?.replaceChildren("R$ 0,00");
      document.querySelector("#orderTotal")?.replaceChildren("R$ 0,00");
      document.querySelector("#bottomTotalValue")?.replaceChildren("R$ 0,00");
      const freight = document.querySelector("#freightProgress");
      if (freight) freight.hidden = true;
    }

    window.dispatchEvent(new CustomEvent("copao:order-state-reset", {
      detail: { reason: "whatsapp_order_sent" }
    }));
  }

  function markOrderCompleted(prize) {
    const completedAt = new Date().toISOString();
    writeJson(LAST_ORDER_KEY, {
      completedAt,
      prizeId: prize?.prizeId || "",
      prizeSavedAt: prize?.savedAt || "",
      resetVersion: 1
    });
    return completedAt;
  }

  function persistedCartIsEmpty() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const cart = raw ? JSON.parse(raw) : [];
      return !Array.isArray(cart) || cart.length === 0;
    } catch (error) {
      return true;
    }
  }

  function uiLooksStale() {
    const memoryHasCart = Array.isArray(window.state?.cart) && window.state.cart.length > 0;
    const cartCount = Number(document.querySelector("#cartCount")?.textContent || 0);
    const hasPromoUi = Boolean(document.querySelector(".promo-wheel-badge, .promo-benefit-row"));
    return memoryHasCart || cartCount > 0 || hasPromoUi;
  }

  function enforceCompletedOrderState() {
    const completed = readJson(LAST_ORDER_KEY);
    if (!completed) return;

    const prize = readJson(PROMO_PRIZE_KEY);
    if (prize && (
      (completed.prizeId && prize.prizeId === completed.prizeId) ||
      (completed.prizeSavedAt && prize.savedAt === completed.prizeSavedAt)
    )) {
      consumePromoPrize(prize);
    }

    if (persistedCartIsEmpty() && uiLooksStale()) resetOrderState();
  }

  function openWhatsAppUrl(url) {
    window.copaoAnalytics?.track?.("navigation_click", {
      button_name: "open_whatsapp",
      section_name: "finish"
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function sendCleanWhatsAppMessage() {
    const error = typeof window.validateBeforeSend === "function" ? window.validateBeforeSend() : "";
    if (error) {
      alert(error);
      return;
    }

    const message = buildCleanWhatsAppMessage();
    const whatsappUrl = createWhatsAppUrl(message);
    const prize = getPromoPrize();

    markOrderCompleted(prize);
    consumePromoPrize(prize);
    resetOrderState();
    openWhatsAppUrl(whatsappUrl);
  }

  function installCleanSender() {
    const button = document.querySelector("#sendWhatsApp");
    window.buildCleanWhatsAppMessage = buildCleanWhatsAppMessage;
    window.sendCleanWhatsAppMessage = sendCleanWhatsAppMessage;
    window.finish = sendCleanWhatsAppMessage;
    window.resetCopaoOrderState = resetOrderState;
    if (!button || button.dataset.cleanWhatsappReady === "true") return;

    button.dataset.cleanWhatsappReady = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      sendCleanWhatsAppMessage();
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installCleanSender();
      enforceCompletedOrderState();
    }, { once: true });
  } else {
    installCleanSender();
    enforceCompletedOrderState();
  }

  window.addEventListener("pageshow", enforceCompletedOrderState);
  window.addEventListener("focus", enforceCompletedOrderState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") enforceCompletedOrderState();
  });
  window.addEventListener("load", installCleanSender);
})();
