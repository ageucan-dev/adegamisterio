(() => {
  const OK = "copaoLegalAgeOk";
  const NO = "copaoLegalAgeNo";

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { return; }
  }

  function style() {
    if (document.querySelector("#legal-age-style")) return;
    const css = document.createElement("style");
    css.id = "legal-age-style";
    css.textContent = `
      .legal-age-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(11,29,58,.72);backdrop-filter:blur(18px)}
      .legal-age-box{width:min(100%,390px);padding:26px 22px 22px;border-radius:30px;background:#fffdf4;color:#0b1d3a;text-align:center;box-shadow:0 28px 90px rgba(0,0,0,.34)}
      .legal-age-box h2{margin:0;font-size:2rem;font-weight:950;line-height:1;color:#0b1d3a}
      .legal-age-box p{margin:12px auto 18px;color:#5c6a80;font-size:1rem;font-weight:750;line-height:1.38}
      .legal-age-kicker{margin:0 0 8px!important;color:#ff7a00!important;font-size:.78rem!important;font-weight:950!important;letter-spacing:.12em!important;text-transform:uppercase!important}
      .legal-age-actions{display:grid;gap:10px}
      .legal-age-actions button{width:100%;min-height:54px;border-radius:18px;font-size:1rem;font-weight:950}
      .legal-age-yes{border:0;background:linear-gradient(135deg,#ffd100,#ffb800);color:#0b1d3a}
      .legal-age-no{border:1px solid rgba(11,29,58,.12);background:#fff;color:#0b1d3a}
      .legal-age-closed{min-height:100vh;display:grid;place-items:center;padding:24px;background:#0b1d3a;color:#fff;text-align:center;font-family:Inter,system-ui,sans-serif}
      .legal-age-closed h1{margin:0 0 12px;font-size:2rem;line-height:1}
      .legal-age-closed p{margin:0;color:rgba(255,255,255,.72);font-size:1rem;font-weight:700;line-height:1.4}
    `;
    document.head.appendChild(css);
  }

  function closeSite() {
    save(NO, "1");
    document.body.innerHTML = '<main class="legal-age-closed"><div><h1>Acesso encerrado</h1><p>Este conteúdo não está disponível para este perfil de acesso.</p></div></main>';
  }

  function show() {
    if (read(OK) === "1" || read(NO) === "1") return;
    if (document.querySelector(".legal-age-overlay")) return;
    style();
    const overlay = document.createElement("div");
    overlay.className = "legal-age-overlay";
    overlay.innerHTML = '<div class="legal-age-box" role="dialog" aria-modal="true"><p class="legal-age-kicker">Confirmação necessária</p><h2>Você tem 18 anos ou mais?</h2><p>Confirme sua idade para continuar navegando.</p><div class="legal-age-actions"><button class="legal-age-yes" type="button">Sim, continuar</button><button class="legal-age-no" type="button">Não posso continuar</button></div></div>';
    overlay.querySelector(".legal-age-yes").addEventListener("click", () => { save(OK, "1"); overlay.remove(); });
    overlay.querySelector(".legal-age-no").addEventListener("click", closeSite);
    document.body.appendChild(overlay);
  }

  function init() {
    style();
    if (read(NO) === "1") { closeSite(); return; }
    if (read(OK) === "1") return;
    setTimeout(() => {
      const start = Date.now();
      const timer = setInterval(() => {
        const wheel = document.querySelector(".promo-wheel-overlay");
        const wheelOpen = wheel && wheel.classList.contains("is-visible");
        if (!wheelOpen || Date.now() - start > 18000) {
          clearInterval(timer);
          setTimeout(show, 450);
        }
      }, 400);
    }, 1700);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
