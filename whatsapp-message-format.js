(() => {
  const PROMO_PRIZE_KEY = "copaoPromoWheelPrizeV1";
  const WHATSAPP_NUMBER = "5516996396543";

  function brl(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function getCart() {
    try {
      return Array.isArray(state?.cart) ? state.cart : [];
    } catch (error) {
      return [];
    }
  }

  function getTotals() {
    if (typeof cartTotals === "function") return cartTotals();

    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);
    const discount = Math.max(totalCups - 1, 0) * 9;
    const total = Math.max(subtotal - discount, 0);

    return { subtotal, totalCups, discount, total };
  }

  function getDeliveryData() {
    if (typeof deliveryData === "function") return deliveryData();

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
      `• Desconto progressivo: -${brl(totals.discount)}`,
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
      "*🥤 COPÃO NA MÃO | NOVO PEDIDO*",
      "Ficha organizada para preparo e conferência.",
      "",
      "*🛒 ITENS DO CARRINHO*",
      "",
      items,
      "",
      "*💰 RESUMO DO PEDIDO*",
      ...summaryLines,
      "",
      "*📍 DADOS DE ENTREGA*",
      ...deliveryLines,
      "",
      "✅ Aguardo confirmação para preparo."
    ].join("\n");
  }

  function sendCleanWhatsAppMessage() {
    const error = typeof validateBeforeSend === "function" ? validateBeforeSend() : "";
    if (error) {
      alert(error);
      return;
    }

    const message = encodeURIComponent(buildCleanWhatsAppMessage());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener,noreferrer");
  }

  window.buildCleanWhatsAppMessage = buildCleanWhatsAppMessage;

  if (typeof finish === "function") {
    finish = sendCleanWhatsAppMessage;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("#sendWhatsApp");
    if (!button) return;

    const error = typeof validateBeforeSend === "function" ? validateBeforeSend() : "";
    if (error) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    sendCleanWhatsAppMessage();
  }, true);
})();
