(() => {
  const PLAYED_KEY = "copaoPromoWheelPlayedV1";
  const PLAYED_DATE_KEY = "copaoPromoWheelPlayedDateV1";
  const PRIZE_KEY = "copaoPromoWheelPrizeV1";

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

      if (key === PLAYED_KEY && value === "true") {
        originalSetItem.call(this, PLAYED_DATE_KEY, today);
      }

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
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function getPrize() {
    try {
      const raw = localStorage.getItem(PRIZE_KEY);
      if (!raw) return null;

      const prize = JSON.parse(raw);
      const day = prize.day || localStorage.getItem(PLAYED_DATE_KEY);
      if (day && day !== todayKey()) return null;
      if (!prize.type || prize.type === "none") return null;

      return prize;
    } catch (error) {
      return null;
    }
  }

  function getTotals() {
    if (typeof cartTotals === "function") return cartTotals();
    return { subtotal: 0, discount: 0, total: 0, promoDiscount: 0 };
  }

  function updateProgressiveDiscountRow() {
    const discountValue = document.querySelector("#discountValue");
    const row = discountValue?.parentElement;
    if (!row) return;

    const totals = getTotals();
    const shouldShow = Number(totals.discount || 0) > 0;
    row.hidden = !shouldShow;
    row.style.display = shouldShow ? "" : "none";
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

    if (prize.type === "discount") {
      const discountValue = Number(totals.promoDiscount || prize.value || 0);
      row.innerHTML = `<span>Benefício</span><strong>-${brl(discountValue)}</strong>`;
      return;
    }

    row.innerHTML = `<span>Benefício</span><strong>${prize.label || "Prêmio ativo"}</strong>`;
  }

  function updateSummaryRows() {
    updateProgressiveDiscountRow();
    updateBenefitRow();
  }

  function patchRenderCart() {
    if (window.__copaoBenefitRowPatched || typeof renderCart !== "function") return;

    const originalRenderCart = renderCart;
    renderCart = function patchedRenderCart() {
      originalRenderCart();
      window.setTimeout(updateSummaryRows, 0);
    };

    window.__copaoBenefitRowPatched = true;
    updateSummaryRows();
  }

  function installBenefitStyles() {
    if (document.querySelector("#promo-benefit-row-style")) return;

    const style = document.createElement("style");
    style.id = "promo-benefit-row-style";
    style.textContent = `
      .promo-benefit-row span,
      .promo-benefit-row strong {
        color: #ff7a00 !important;
        font-weight: 950 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function scrollToCartSoft(delay = 360) {
    window.setTimeout(() => {
      const cart = document.querySelector("#carrinho");
      if (!cart) return;

      const headerOffset = 88;
      const targetTop = cart.getBoundingClientRect().top + window.scrollY - headerOffset;
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

  installBenefitStyles();
  patchRenderCart();
  installBuyNowSoftScroll();

  window.addEventListener("load", () => {
    installBenefitStyles();
    patchRenderCart();
    installBuyNowSoftScroll();
    updateSummaryRows();
  });
})();
