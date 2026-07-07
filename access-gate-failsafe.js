(() => {
  function showFallback() {
    const isLoading = document.body.classList.contains("access-gate-loading");
    const hasGate = document.querySelector(".customer-gate-overlay");

    if (!isLoading || hasGate) return;

    document.body.classList.remove("access-gate-loading");

    const fallback = document.createElement("div");
    fallback.style.cssText = [
      "position:fixed",
      "left:16px",
      "right:16px",
      "bottom:calc(env(safe-area-inset-bottom, 0px) + 22px)",
      "z-index:12000",
      "padding:16px",
      "border-radius:20px",
      "background:#0b1d3a",
      "color:#fff",
      "font-family:Inter,Arial,sans-serif",
      "font-weight:800",
      "box-shadow:0 18px 60px rgba(11,29,58,.28)"
    ].join(";");

    fallback.innerHTML = `
      <div style="font-size:15px;line-height:1.35;margin-bottom:10px;">Não foi possível carregar o acesso seguro.</div>
      <button type="button" style="width:100%;min-height:44px;border:0;border-radius:14px;background:#ffd100;color:#0b1d3a;font-weight:950;font-size:15px;">Recarregar site</button>
    `;

    fallback.querySelector("button").addEventListener("click", () => location.reload());
    document.body.appendChild(fallback);
  }

  window.setTimeout(showFallback, 4200);
})();
