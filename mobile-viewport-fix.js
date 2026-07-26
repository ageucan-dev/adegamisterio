(() => {
  const VIEWPORT_CONTENT = "width=device-width, initial-scale=1.0, viewport-fit=cover";
  let lastOverlayVisible = false;
  let normalizeTimer = null;

  function viewportMeta() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    return meta;
  }

  function isEditable(element) {
    return Boolean(element && /INPUT|TEXTAREA|SELECT/.test(element.tagName));
  }

  function lockHorizontalAxis() {
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    if (document.scrollingElement) document.scrollingElement.scrollLeft = 0;
  }

  function normalizeViewport(delay = 80) {
    window.clearTimeout(normalizeTimer);
    normalizeTimer = window.setTimeout(() => {
      lockHorizontalAxis();

      // A abertura do teclado no Android dispara resize. Nunca altera foco ou viewport
      // enquanto um campo está ativo, evitando que o teclado seja fechado.
      if (isEditable(document.activeElement)) return;

      const meta = viewportMeta();
      if (meta.getAttribute("content") !== VIEWPORT_CONTENT) {
        meta.setAttribute("content", VIEWPORT_CONTENT);
      }

      document.body.classList.add("mobile-viewport-reset");
      window.setTimeout(() => document.body.classList.remove("mobile-viewport-reset"), 120);
    }, delay);
  }

  function checkGateState() {
    const overlayVisible = Boolean(document.querySelector(".customer-gate-overlay"));

    if (lastOverlayVisible && !overlayVisible) {
      normalizeViewport(120);
    }

    lastOverlayVisible = overlayVisible;
  }

  document.addEventListener("focusin", (event) => {
    if (!isEditable(event.target)) return;
    document.body.classList.add("mobile-keyboard-active");
    lockHorizontalAxis();
  }, true);

  document.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (isEditable(document.activeElement)) return;
      document.body.classList.remove("mobile-keyboard-active");
      normalizeViewport(40);
    }, 80);
  }, true);

  const observer = new MutationObserver(checkGateState);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });

  window.addEventListener("pageshow", () => normalizeViewport(0));
  window.addEventListener("orientationchange", () => normalizeViewport(220));

  // No Android, o teclado virtual altera a altura da viewport e dispara resize.
  // Aqui apenas bloqueamos o eixo horizontal; não usamos blur, focus ou scroll forçado.
  window.addEventListener("resize", lockHorizontalAxis, { passive: true });
  window.visualViewport?.addEventListener("resize", lockHorizontalAxis, { passive: true });
  window.visualViewport?.addEventListener("scroll", lockHorizontalAxis, { passive: true });

  lockHorizontalAxis();
  normalizeViewport(0);
  checkGateState();
})();
