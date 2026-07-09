(() => {
  const DEFAULT_VIEWPORT = "width=device-width, initial-scale=1.0";
  const RESET_VIEWPORT = "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover";
  let lastOverlayVisible = false;
  let resetTimer = null;

  function viewportMeta() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    return meta;
  }

  function blurActiveField() {
    const active = document.activeElement;
    if (active && /INPUT|TEXTAREA|SELECT/.test(active.tagName)) {
      active.blur();
    }
  }

  function resetViewport() {
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      blurActiveField();

      const meta = viewportMeta();
      meta.setAttribute("content", RESET_VIEWPORT);

      document.body.classList.add("mobile-viewport-reset");
      document.documentElement.style.overflowX = "hidden";
      document.body.style.overflowX = "hidden";

      window.scrollTo({ left: 0, top: Math.max(window.scrollY, 0), behavior: "auto" });

      window.setTimeout(() => {
        meta.setAttribute("content", DEFAULT_VIEWPORT);
        document.body.classList.remove("mobile-viewport-reset");
        window.scrollTo({ left: 0, top: Math.max(window.scrollY, 0), behavior: "auto" });
      }, 450);
    }, 80);
  }

  function checkGateState() {
    const overlayVisible = !!document.querySelector(".customer-gate-overlay");

    if (lastOverlayVisible && !overlayVisible) {
      resetViewport();
    }

    lastOverlayVisible = overlayVisible;
  }

  document.addEventListener("focusout", (event) => {
    if (event.target && event.target.closest && event.target.closest(".customer-gate-overlay")) {
      resetViewport();
    }
  }, true);

  document.addEventListener("submit", (event) => {
    if (event.target && event.target.closest && event.target.closest(".customer-gate-overlay")) {
      resetViewport();
    }
  }, true);

  document.addEventListener("click", (event) => {
    const button = event.target && event.target.closest && event.target.closest(".customer-gate-primary, .customer-gate-secondary, .customer-gate-danger");
    if (button) resetViewport();
  }, true);

  const observer = new MutationObserver(checkGateState);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  window.addEventListener("pageshow", resetViewport);
  window.addEventListener("orientationchange", resetViewport);
  window.addEventListener("resize", () => {
    if (!document.querySelector(".customer-gate-overlay")) resetViewport();
  });

  checkGateState();
})();
