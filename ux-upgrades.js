(() => {
  const spellingMap = {
    "Citrico": "Cítrico",
    "Maca Verde": "Maçã Verde",
    "Medio": "Médio",
    "Energetico": "Energético",
    "Gelo de Agua de Coco": "Gelo de Água de Coco",
    "Red Bull Morango e Pessego": "Red Bull Morango e Pêssego",
    "Seu carrinho ainda esta vazio.": "Seu carrinho ainda está vazio.",
    "Observacoes": "Observações",
    "Referencia": "Referência",
    "Numero": "Número",
    "Finalizacao": "Finalização",
    "Personalizacao": "Personalização"
  };

  const wheelStorageKey = "copaoPromoWheelPlayedV1";
  const wheelPrizeKey = "copaoPromoWheelPrizeV1";

  const wheelPrizes = [
    { label: "Tente na próxima", shortLabel: "Tente na próxima", chance: 80, type: "none", rotation: 30 },
    { label: "R$ 5 de desconto", shortLabel: "R$5 OFF", chance: 10, type: "discount", value: 5, rotation: 90 },
    { label: "R$ 10 de desconto", shortLabel: "R$10 OFF", chance: 6, type: "discount", value: 10, rotation: 150 },
    { label: "R$ 25 de desconto", shortLabel: "R$25 OFF", chance: 3, type: "discount", value: 25, rotation: 210 },
    { label: "1 copo Ethernity", shortLabel: "1 copo", chance: 1, type: "free_cup", value: 1, rotation: 270 },
    { label: "3 copos Ethernity", shortLabel: "3 copos", chance: 0, type: "free_cup", value: 3, rotation: 330 }
  ];

  function fixText(value = "") {
    return spellingMap[value] || value;
  }

  function getCartQuantity() {
    try {
      if (typeof state !== "undefined" && Array.isArray(state.cart)) {
        return state.cart.reduce((total, item) => total + item.quantity, 0);
      }
    } catch (error) {
      return 0;
    }
    return 0;
  }

  function fixVisibleText() {
    document.querySelectorAll("span, small, legend, h2, p, button, label, div").forEach((node) => {
      if (node.children.length) return;
      const value = node.textContent.trim();
      if (spellingMap[value]) node.textContent = spellingMap[value];
    });
  }

  fixVisibleText();

  const observer = new MutationObserver(() => fixVisibleText());
  observer.observe(document.body, { childList: true, subtree: true });

  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.textContent = "✅ Produto adicionado";
  document.body.appendChild(toast);

  let toastTimer;
  function showCartToast(message = "✅ Produto adicionado") {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  ["#addToCart", "#buyNow"].forEach((selector) => {
    const button = document.querySelector(selector);
    button?.addEventListener("click", () => {
      const before = getCartQuantity();
      setTimeout(() => {
        const after = getCartQuantity();
        if (after > before) showCartToast();
      }, 30);
    }, true);
  });

  document.querySelectorAll(".custom-form fieldset").forEach((fieldset) => {
    const legend = fieldset.querySelector("legend");
    if (!legend || legend.querySelector(".step-toggle")) return;

    const label = document.createElement("span");
    label.textContent = fixText(legend.textContent.trim());

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "step-toggle";
    toggle.setAttribute("aria-label", "Abrir etapa");
    toggle.textContent = "+";

    legend.textContent = "";
    legend.append(label, toggle);

    legend.addEventListener("click", () => {
      if (!fieldset.classList.contains("is-collapsed")) return;
      fieldset.classList.remove("is-collapsed");
    });
  });

  document.querySelectorAll('.custom-form input[type="radio"]').forEach((input) => {
    input.addEventListener("change", () => {
      const fieldset = input.closest("fieldset");
      fieldset?.classList.add("is-collapsed");
    });
  });

  function safeMoney(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function label(item) {
    return fixText(item?.label || "");
  }

  function getCartItems() {
    try {
      if (typeof state !== "undefined" && Array.isArray(state.cart)) return state.cart;
    } catch (error) {
      return [];
    }
    return [];
  }

  function getSavedWheelPrize() {
    try {
      const raw = localStorage.getItem(wheelPrizeKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveWheelPrize(prize) {
    try {
      localStorage.setItem(wheelPrizeKey, JSON.stringify({
        label: prize.label,
        type: prize.type,
        value: prize.value || 0,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      return;
    }
  }

  function getPromoDiscount(baseTotal = 0) {
    const prize = getSavedWheelPrize();
    if (!prize || prize.type !== "discount") return 0;
    return Math.min(Number(prize.value || 0), Math.max(baseTotal, 0));
  }

  function getPromoLine(totals) {
    const prize = getSavedWheelPrize();
    if (!prize || prize.type === "none") return "";

    if (prize.type === "discount") {
      const value = totals?.promoDiscount || Number(prize.value || 0);
      return `• Roleta do Copão: -${safeMoney(value)} (${prize.label})`;
    }

    if (prize.type === "free_cup") return `• Roleta do Copão: ${prize.label}`;
    return "";
  }

  function patchPromoTotals() {
    if (window.__copaoPromoTotalsPatched || typeof cartTotals !== "function") return;

    const originalCartTotals = cartTotals;
    cartTotals = function patchedCartTotals() {
      const totals = originalCartTotals();
      const promoDiscount = getPromoDiscount(totals.total);
      return {
        ...totals,
        promoDiscount,
        total: Math.max(totals.total - promoDiscount, 0)
      };
    };

    window.__copaoPromoTotalsPatched = true;
    if (typeof renderCart === "function") renderCart();
  }

  function installPromoBadge() {
    const prize = getSavedWheelPrize();
    if (!prize || prize.type === "none") return;

    const cartCard = document.querySelector("#carrinho");
    if (!cartCard) return;

    let badge = cartCard.querySelector(".promo-wheel-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "promo-wheel-badge";
      cartCard.insertBefore(badge, cartCard.querySelector(".summary-box"));
    }

    badge.textContent = `🎁 Benefício ativo: ${prize.label}`;
  }

  function pickWheelPrize() {
    const totalChance = wheelPrizes.reduce((sum, prize) => sum + prize.chance, 0);
    let draw = Math.random() * totalChance;

    for (const prize of wheelPrizes) {
      draw -= prize.chance;
      if (draw <= 0) return prize;
    }

    return wheelPrizes[0];
  }

  function createPromoWheel() {
    if (document.querySelector(".promo-wheel-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "promo-wheel-overlay";
    overlay.innerHTML = `
      <div class="promo-wheel-modal" role="dialog" aria-modal="true" aria-label="Roleta do Copão">
        <button class="promo-wheel-close" type="button" aria-label="Fechar roleta">×</button>
        <p class="promo-wheel-kicker">Lançamento</p>
        <h2 class="promo-wheel-title">Roleta do Copão</h2>
        <p class="promo-wheel-subtitle">Gire uma vez e tente ganhar um benefício para usar no pedido de hoje.</p>
        <div class="promo-wheel-stage">
          <div class="promo-wheel-pointer"></div>
          <div class="promo-wheel-disc">
            ${wheelPrizes.map((prize) => `<span class="promo-wheel-label">${prize.shortLabel}</span>`).join("")}
          </div>
        </div>
        <div class="promo-wheel-actions">
          <p class="promo-wheel-result"></p>
          <button class="promo-wheel-spin" type="button">Girar agora</button>
          <button class="promo-wheel-use" type="button" hidden>Usar no pedido</button>
          <p class="promo-wheel-rule">1 giro por dispositivo. Benefício não cumulativo e sujeito à disponibilidade.</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = overlay.querySelector(".promo-wheel-close");
    const spin = overlay.querySelector(".promo-wheel-spin");
    const useButton = overlay.querySelector(".promo-wheel-use");
    const result = overlay.querySelector(".promo-wheel-result");
    const disc = overlay.querySelector(".promo-wheel-disc");

    const closeWheel = () => overlay.classList.remove("is-visible");
    close.addEventListener("click", closeWheel);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeWheel();
    });

    useButton.addEventListener("click", () => {
      closeWheel();
      document.querySelector("#produto")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    spin.addEventListener("click", () => {
      if (spin.disabled) return;

      const prize = pickWheelPrize();
      const finalRotation = 360 * 6 + (360 - prize.rotation);

      spin.disabled = true;
      spin.textContent = "Girando...";
      result.textContent = "";
      disc.style.transform = `rotate(${finalRotation}deg)`;

      try {
        localStorage.setItem(wheelStorageKey, "true");
      } catch (error) {
        return;
      }

      window.setTimeout(() => {
        if (prize.type === "none") {
          result.textContent = "Quase! Continue montando seu copo e tente em uma próxima oportunidade.";
          spin.textContent = "Giro realizado";
          useButton.hidden = false;
          return;
        }

        saveWheelPrize(prize);
        patchPromoTotals();
        installPromoBadge();
        result.textContent = `Você ganhou: ${prize.label}! O benefício será enviado junto com seu pedido.`;
        spin.textContent = "Prêmio liberado";
        useButton.hidden = false;
        showCartToast(`🎁 ${prize.label} ativado`);
      }, 4200);
    });
  }

  function maybeOpenPromoWheel() {
    let alreadyPlayed = false;
    try {
      alreadyPlayed = localStorage.getItem(wheelStorageKey) === "true";
    } catch (error) {
      alreadyPlayed = false;
    }

    patchPromoTotals();
    installPromoBadge();
    if (alreadyPlayed) return;

    createPromoWheel();
    setTimeout(() => {
      document.querySelector(".promo-wheel-overlay")?.classList.add("is-visible");
    }, 1400);
  }

  function getFormattedWhatsAppMessage() {
    if (typeof cartTotals !== "function" || typeof deliveryData !== "function") {
      return "Olá, Copão na Mão! Quero finalizar meu pedido.";
    }

    const totals = cartTotals();
    const data = deliveryData();
    const cart = getCartItems();
    const promoLine = getPromoLine(totals);

    const items = cart.map((item, index) => {
      return [
        `*${index + 1}. ${item.product} - ${label(item.size)}*`,
        `• Base: ${label(item.base)}`,
        `• Intensidade: ${fixText(item.intensity)}`,
        `• Energético: ${label(item.energy)}`,
        `• Gelo: ${label(item.ice)}`,
        `• Quantidade: ${item.quantity}`,
        `• Valor unitário: ${safeMoney(item.unitPrice)}`,
        `• Subtotal: ${safeMoney(item.unitPrice * item.quantity)}`,
        item.notes ? `• Observações: ${item.notes}` : ""
      ].filter(Boolean).join("\n");
    }).join("\n\n");

    return [
      "*🥤 COPÃO NA MÃO | NOVO PEDIDO*",
      "_Ficha organizada para preparo e conferência._",
      "",
      "*🛒 ITENS DO CARRINHO*",
      items,
      "",
      "*💰 RESUMO DO PEDIDO*",
      `• Subtotal: ${safeMoney(totals.subtotal)}`,
      `• Desconto progressivo: -${safeMoney(totals.discount)}`,
      promoLine,
      `• *Total: ${safeMoney(totals.total)}*`,
      "",
      "*📍 DADOS DE ENTREGA*",
      `• Nome: ${data.name}`,
      `• Contato: ${data.phone}`,
      `• Endereço: ${data.street}, ${data.number} - ${data.district}`,
      data.complement ? `• Complemento: ${data.complement}` : "",
      data.reference ? `• Referência: ${data.reference}` : "",
      data.notes ? `• Observação: ${data.notes}` : "",
      "",
      "✅ Aguardo confirmação para preparo."
    ].filter(Boolean).join("\n");
  }

  function finishWithPromo() {
    if (typeof validateBeforeSend !== "function") return;
    const error = validateBeforeSend();
    if (error) { alert(error); return; }

    const message = encodeURIComponent(getFormattedWhatsAppMessage());
    window.open(`https://wa.me/5516996396543?text=${message}`, "_blank", "noopener,noreferrer");
  }

  if (typeof finish === "function") finish = finishWithPromo;

  const finishButton = document.querySelector("#sendWhatsApp");
  finishButton?.addEventListener("click", (event) => {
    const error = typeof validateBeforeSend === "function" ? validateBeforeSend() : "";
    if (error) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    finishWithPromo();
  }, true);

  window.addEventListener("load", maybeOpenPromoWheel);
  setTimeout(maybeOpenPromoWheel, 800);
})();
