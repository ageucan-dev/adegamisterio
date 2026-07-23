(() => {
  const PROMO_PRIZE_KEY = "copaoPromoWheelPrizeV1";
  const WHATSAPP_NUMBER = "5516996396543";

  const EMOJI = {
    cup: String.fromCodePoint(0x1F964),
    cart: String.fromCodePoint(0x1F6D2),
    money: String.fromCodePoint(0x1F4B0),
    pin: String.fromCodePoint(0x1F4CD),
    check: String.fromCodePoint(0x2705),
    gift: String.fromCodePoint(0x1F381)
  };

  function brl(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
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
    const discount = Math.max(totalCups - 1, 0) * 9;
    const total = Math.max(subtotal - discount, 0);

    return { subtotal, totalCups, discount, total };
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

  function getPromoPrize() {
    try {
      const raw = localStorage.getItem(PROMO_PRIZE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function getPromoLine(totals) {
    const prize = getPromoPrize();
    if (!prize || prize.type === "none") return "";

    if (prize.type === "discount") {
      const value = Number(totals?.promoDiscount || prize.value || 0);
      return `• Roleta do Copão: -${brl(value)} (${prize.label})`;
    }

    if (prize.type === "free_cup") {
      return `• Roleta do Copão: ${prize.label}`;
    }

    return "";
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

    const summaryLines = [
      `• Subtotal: ${brl(totals.subtotal)}`,
      Number(totals.discount || 0) > 0 ? `• Desconto progressivo: -${brl(totals.discount)}` : "",
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

  function openWhatsAppWithMessage(message) {
    const url = new URL("https://api.whatsapp.com/send");
    url.searchParams.set("phone", WHATSAPP_NUMBER);
    url.searchParams.set("text", message);

    window.copaoAnalytics?.track?.("navigation_click", {
      button_name: "open_whatsapp",
      section_name: "finish"
    });

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  function sendCleanWhatsAppMessage() {
    const error = typeof window.validateBeforeSend === "function" ? window.validateBeforeSend() : "";
    if (error) {
      alert(error);
      return;
    }

    openWhatsAppWithMessage(buildCleanWhatsAppMessage());
  }

  function installCleanSender() {
    const button = document.querySelector("#sendWhatsApp");

    if (button && typeof window.finish === "function") {
      button.removeEventListener("click", window.finish);
    }

    window.buildCleanWhatsAppMessage = buildCleanWhatsAppMessage;
    window.sendCleanWhatsAppMessage = sendCleanWhatsAppMessage;
    window.finish = sendCleanWhatsAppMessage;

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
    document.addEventListener("DOMContentLoaded", installCleanSender, { once: true });
  } else {
    installCleanSender();
  }

  window.addEventListener("load", installCleanSender);
})();
