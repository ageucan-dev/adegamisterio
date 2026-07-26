(() => {
  const PLAYED_KEY = "copaoPromoWheelPlayedV1";
  const PLAYED_DATE_KEY = "copaoPromoWheelPlayedDateV1";
  const PRIZE_KEY = "copaoPromoWheelPrizeV1";
  const CONSUMED_PRIZE_KEY = "copaoConsumedRoulettePrizeV1";

  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function resetExpiredWheel() {
    const today = todayKey();
    const playedDate = localStorage.getItem(PLAYED_DATE_KEY);
    if (playedDate !== today) {
      localStorage.removeItem(PLAYED_KEY);
      localStorage.removeItem(PRIZE_KEY);
      localStorage.removeItem(PLAYED_DATE_KEY);
      return;
    }
    localStorage.setItem(PLAYED_KEY, "true");
  }

  function patchPromoStorage() {
    if (window.__copaoDailyWheelStoragePatched || !window.Storage?.prototype?.setItem) return;
    const originalSetItem = Storage.prototype.setItem;

    Storage.prototype.setItem = function patchedSetItem(key, value) {
      const today = todayKey();
      if (key === PLAYED_KEY && value === "true") originalSetItem.call(this, PLAYED_DATE_KEY, today);

      if (key === PRIZE_KEY) {
        try {
          const prize = JSON.parse(value);
          prize.day = today;
          prize.expiresAt = `${today}T23:59:59`;
          return originalSetItem.call(this, key, JSON.stringify(prize));
        } catch (error) {
          return originalSetItem.call(this, key, value);
        }
      }
      return originalSetItem.call(this, key, value);
    };

    window.__copaoDailyWheelStoragePatched = true;
  }

  function brl(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function readJson(key) {
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
    const consumed = readJson(CONSUMED_PRIZE_KEY);
    if (!prize || !consumed) return false;
    if (prize.prizeId && consumed.prizeId) return prize.prizeId === consumed.prizeId;
    if (prize.savedAt && consumed.prizeSavedAt) return prize.savedAt === consumed.prizeSavedAt;
    return false;
  }

  function getPrize() {
    const prize = readJson(PRIZE_KEY);
    if (!prize) return null;

    const day = prize.day || localStorage.getItem(PLAYED_DATE_KEY);
    const valid = (!day || day === todayKey()) &&
      prize.type === "discount" &&
      Number(prize.value || 0) === 5 &&
      !prizeWasConsumed(prize);

    if (valid) return prize;

    try {
      localStorage.removeItem(PRIZE_KEY);
    } catch (error) {
      // A interface continuará sem aplicar o benefício inválido.
    }
    return null;
  }

  function getTotals() {
    if (typeof cartTotals === "function") return cartTotals();
    return { subtotal: 0, delivery: 0, total: 0, promoDiscount: 0 };
  }

  function updateBenefitRow() {
    const summaryBox = document.querySelector(".summary-box");
    const totalRow = document.querySelector(".summary-box .summary-total");
    if (!summaryBox || !totalRow) return;

    let row = summaryBox.querySelector(".promo-benefit-row");
    const prize = getPrize();
    const totals = getTotals();

    if (!prize || !Number(totals.subtotal || 0)) {
      row?.remove();
      return;
    }

    if (!row) {
      row = document.createElement("div");
      row.className = "promo-benefit-row";
      summaryBox.insertBefore(row, totalRow);
    }

    const discountValue = Math.min(5, Number(totals.promoDiscount || prize.value || 0));
    row.innerHTML = `<span>Benefício da roleta</span><strong>-${brl(discountValue)}</strong>`;
  }

  function patchRenderCart() {
    if (window.__copaoBenefitRowPatched || typeof renderCart !== "function") return;
    const originalRenderCart = renderCart;
    renderCart = function patchedRenderCart() {
      originalRenderCart();
      window.setTimeout(updateBenefitRow, 0);
    };
    window.renderCart = renderCart;
    window.__copaoBenefitRowPatched = true;
    updateBenefitRow();
  }

  function scrollToCartSoft(delay = 360) {
    window.setTimeout(() => {
      const cart = document.querySelector("#carrinho");
      if (!cart) return;
      const targetTop = cart.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    }, delay);
  }

  function installBuyNowSoftScroll() {
    const buyNow = document.querySelector("#buyNow");
    if (!buyNow || buyNow.dataset.softCartScroll === "true") return;
    buyNow.dataset.softCartScroll = "true";
    buyNow.addEventListener("click", () => scrollToCartSoft(430), true);
  }

  try {
    resetExpiredWheel();
    patchPromoStorage();
  } catch (error) {
    // Se o navegador bloquear localStorage, o site continua funcionando normalmente.
  }

  patchRenderCart();
  installBuyNowSoftScroll();
  window.addEventListener("copao:cart-updated", updateBenefitRow);
  window.addEventListener("copao:roulette-prize-consumed", updateBenefitRow);
  window.addEventListener("copao:order-state-reset", updateBenefitRow);
  window.addEventListener("load", () => {
    patchRenderCart();
    installBuyNowSoftScroll();
    updateBenefitRow();
  });
})();
