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
  const consumedPrizeKey = "copaoConsumedRoulettePrizeV1";
  const customerProfileKey = "copaoCustomerProfileV1";
  let initialized = false;

  // Todos os setores continuam visíveis. Somente R$ 5 está habilitado como prêmio real.
  const wheelPrizes = [
    { id: "no_prize", label: "Tente na próxima", shortLabel: "Tente na próxima", type: "none", rotation: 30, enabled: true },
    { id: "discount_5", label: "R$ 5 de desconto", shortLabel: "R$5 OFF", type: "discount", value: 5, rotation: 90, enabled: true },
    { id: "discount_10", label: "R$ 10 de desconto", shortLabel: "R$10 OFF", type: "discount", value: 10, rotation: 150, enabled: false },
    { id: "discount_25", label: "R$ 25 de desconto", shortLabel: "R$25 OFF", type: "discount", value: 25, rotation: 210, enabled: false },
    { id: "free_cup_1", label: "1 copo Ethernity", shortLabel: "1 copo", type: "free_cup", value: 1, rotation: 270, enabled: false },
    { id: "free_cup_3", label: "3 copos Ethernity", shortLabel: "3 copos", type: "free_cup", value: 3, rotation: 330, enabled: false }
  ];

  const noPrizeSector = wheelPrizes.find((prize) => prize.id === "no_prize");
  const fiveOffPrize = wheelPrizes.find((prize) => prize.id === "discount_5");

  function fixText(value = "") {
    return spellingMap[value] || value;
  }

  function safeMoney(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function readJsonStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const value = JSON.parse(raw);
      return value && typeof value === "object" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function prizeWasConsumed(prize) {
    if (!prize) return false;
    const consumed = readJsonStorage(consumedPrizeKey);
    if (!consumed) return false;
    if (prize.prizeId && consumed.prizeId) return prize.prizeId === consumed.prizeId;
    if (prize.savedAt && consumed.prizeSavedAt) return prize.savedAt === consumed.prizeSavedAt;
    return false;
  }

  function validFiveOffPrize(prize) {
    return Boolean(
      prize &&
      prize.type === "discount" &&
      Number(prize.value || 0) === 5 &&
      !prizeWasConsumed(prize)
    );
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

  function fixStaticVisibleText() {
    document.querySelectorAll("span, small, legend, h2, p, button, label, div").forEach((node) => {
      if (node.children.length) return;
      const value = node.textContent.trim();
      if (spellingMap[value]) node.textContent = spellingMap[value];
    });
  }

  function createToast() {
    if (document.querySelector(".cart-toast")) return document.querySelector(".cart-toast");

    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.textContent = "✅ Produto adicionado";
    document.body.appendChild(toast);
    return toast;
  }

  let toastTimer;
  function showCartToast(message = "✅ Produto adicionado") {
    const toast = createToast();
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function installCartToast() {
    ["#addToCart", "#buyNow"].forEach((selector) => {
      const button = document.querySelector(selector);
      if (!button || button.dataset.toastReady === "true") return;

      button.dataset.toastReady = "true";
      button.addEventListener("click", () => {
        const before = getCartQuantity();
        setTimeout(() => {
          const after = getCartQuantity();
          if (after > before) showCartToast();
        }, 30);
      }, true);
    });
  }

  function installStepCollapse() {
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
      if (input.dataset.collapseReady === "true") return;
      input.dataset.collapseReady = "true";
      input.addEventListener("change", () => input.closest("fieldset")?.classList.add("is-collapsed"));
    });
  }

  function getSavedWheelPrize() {
    const prize = readJsonStorage(wheelPrizeKey);
    if (!validFiveOffPrize(prize)) return null;
    return prize;
  }

  function removeInvalidSavedPrize() {
    const prize = readJsonStorage(wheelPrizeKey);
    if (!prize || validFiveOffPrize(prize)) return;
    try {
      localStorage.removeItem(wheelPrizeKey);
    } catch (error) {
      // A roleta continua funcionando sem armazenamento persistente.
    }
  }

  function saveWheelPrize(prize, claim = {}) {
    try {
      const savedAt = new Date().toISOString();
      localStorage.setItem(wheelPrizeKey, JSON.stringify({
        prizeId: `discount_5_${claim.cycleNumber || "fallback"}_${claim.cyclePosition || Date.now()}`,
        label: fiveOffPrize.label,
        type: "discount",
        value: 5,
        source: claim.source || "fallback_2_percent",
        cycleNumber: Number(claim.cycleNumber || 0),
        cyclePosition: Number(claim.cyclePosition || 0),
        savedAt
      }));
    } catch (error) {
      return;
    }
  }

  function getPromoDiscount(baseTotal = 0) {
    const prize = getSavedWheelPrize();
    if (!prize) return 0;
    return Math.min(5, Math.max(baseTotal, 0));
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
    const cartCard = document.querySelector("#carrinho");
    if (!cartCard) return;

    let badge = cartCard.querySelector(".promo-wheel-badge");
    if (!prize) {
      badge?.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement("div");
      badge.className = "promo-wheel-badge";
      cartCard.insertBefore(badge, cartCard.querySelector(".summary-box"));
    }

    badge.textContent = `🎁 Benefício ativo: ${prize.label}`;
  }

  function fallbackClaim() {
    const won = Math.random() < 0.02;
    return {
      status: "created",
      result: won ? "win_5_off" : "no_prize",
      cycleNumber: 0,
      cyclePosition: 0,
      source: "fallback_2_percent"
    };
  }

  async function claimWheelResult() {
    const control = window.copaoRouletteControl;
    if (control?.claimSpin) {
      try {
        return await control.claimSpin();
      } catch (error) {
        console.warn("Controle global da roleta indisponível; usando contingência de 2%.", error);
      }
    }
    return fallbackClaim();
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
          <p class="promo-wheel-rule">1 giro por dia. Benefício não cumulativo e sujeito à disponibilidade.</p>
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

    spin.addEventListener("click", async () => {
      if (spin.disabled) return;

      spin.disabled = true;
      spin.textContent = "Validando giro...";
      result.textContent = "";

      const claim = await claimWheelResult();

      try {
        localStorage.setItem(wheelStorageKey, "true");
      } catch (error) {
        // O giro continua mesmo quando o navegador bloqueia o armazenamento.
      }

      if (claim.status === "already_played") {
        const activePrize = getSavedWheelPrize();
        result.textContent = activePrize
          ? "Seu giro de hoje já foi registrado. O benefício ativo continua disponível para este pedido."
          : "Seu giro de hoje já foi registrado.";
        spin.textContent = "Giro realizado";
        useButton.textContent = activePrize ? "Usar no pedido" : "Continuar pedido";
        useButton.hidden = false;
        return;
      }

      const prize = claim.result === "win_5_off" ? fiveOffPrize : noPrizeSector;
      const finalRotation = 360 * 6 + (360 - prize.rotation);

      spin.textContent = "Girando...";
      disc.style.transform = `rotate(${finalRotation}deg)`;

      window.setTimeout(() => {
        if (prize.type === "none") {
          try {
            localStorage.removeItem(wheelPrizeKey);
          } catch (error) {
            // Sem ação necessária.
          }
          installPromoBadge();
          if (typeof renderCart === "function") renderCart();
          result.textContent = "Quase! Continue montando seu copo e tente em uma próxima oportunidade.";
          spin.textContent = "Giro realizado";
          useButton.textContent = "Continuar pedido";
          useButton.hidden = false;
          return;
        }

        saveWheelPrize(prize, claim);
        patchPromoTotals();
        installPromoBadge();
        if (typeof renderCart === "function") renderCart();
        result.textContent = `Você ganhou: ${prize.label}! O benefício será enviado junto com seu pedido.`;
        spin.textContent = "Prêmio liberado";
        useButton.textContent = "Usar no pedido";
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

    removeInvalidSavedPrize();
    patchPromoTotals();
    installPromoBadge();
    if (alreadyPlayed) return;

    createPromoWheel();
    setTimeout(() => document.querySelector(".promo-wheel-overlay")?.classList.add("is-visible"), 1200);
  }

  function syncConsumedPrizeUi() {
    removeInvalidSavedPrize();
    installPromoBadge();
    if (typeof renderCart === "function") renderCart();
  }

  function approvedAccessAvailable() {
    try {
      const hasProfile = Boolean(localStorage.getItem(customerProfileKey));
      const gateOpen = document.body.classList.contains("access-gate-loading") ||
        Boolean(document.querySelector(".customer-gate-overlay"));
      return hasProfile && !gateOpen;
    } catch (error) {
      return false;
    }
  }

  function init() {
    if (initialized || !approvedAccessAvailable()) return false;
    initialized = true;
    fixStaticVisibleText();
    installCartToast();
    installStepCollapse();
    maybeOpenPromoWheel();
    return true;
  }

  function scheduleInit(delay = 0) {
    window.setTimeout(init, delay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => scheduleInit(0), { once: true });
  } else {
    scheduleInit(0);
  }

  window.addEventListener("copao:customer-profile", () => scheduleInit(80));
  window.addEventListener("copao:customer-approved", () => scheduleInit(80));
  window.addEventListener("pageshow", () => scheduleInit(150));
  window.addEventListener("copao:roulette-prize-consumed", syncConsumedPrizeUi);
  window.addEventListener("load", () => {
    scheduleInit(300);
    removeInvalidSavedPrize();
    patchPromoTotals();
    installPromoBadge();
  });
})();
