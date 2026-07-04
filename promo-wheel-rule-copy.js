(() => {
  function updatePromoWheelRuleCopy() {
    document.querySelectorAll(".promo-wheel-rule").forEach((rule) => {
      rule.textContent = "1 giro por dia. Benefício não cumulativo e sujeito à disponibilidade.";
    });
  }

  const observer = new MutationObserver(updatePromoWheelRuleCopy);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("load", updatePromoWheelRuleCopy);
  updatePromoWheelRuleCopy();
})();
