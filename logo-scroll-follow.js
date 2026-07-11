(() => {
  const FIXED_CLASS = "topbar-is-fixed";
  const SPACER_CLASS = "topbar-scroll-spacer";
  const SCROLL_OFFSET = 4;

  let header = null;
  let spacer = null;
  let naturalTop = 0;
  let ticking = false;

  function ensureElements() {
    header = document.querySelector(".topbar");
    if (!header) return false;

    if (!spacer || !spacer.isConnected) {
      spacer = document.createElement("div");
      spacer.className = SPACER_CLASS;
      spacer.setAttribute("aria-hidden", "true");
      header.insertAdjacentElement("afterend", spacer);
    }

    return true;
  }

  function headerHeight() {
    if (!header) return 0;
    return Math.ceil(header.getBoundingClientRect().height || header.offsetHeight || 100);
  }

  function measureNaturalPosition() {
    if (!ensureElements()) return;

    const wasFixed = header.classList.contains(FIXED_CLASS);
    if (wasFixed) header.classList.remove(FIXED_CLASS);
    spacer.style.height = "0px";

    naturalTop = header.offsetTop;

    if (wasFixed) header.classList.add(FIXED_CLASS);
    applyState();
  }

  function applyState() {
    if (!ensureElements()) return;

    const shouldFix = window.scrollY > naturalTop + SCROLL_OFFSET;

    if (shouldFix) {
      spacer.style.height = `${headerHeight()}px`;
      header.classList.add(FIXED_CLASS);
      return;
    }

    header.classList.remove(FIXED_CLASS);
    spacer.style.height = "0px";
  }

  function requestApply() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      applyState();
    });
  }

  function initLogoScrollFollow() {
    measureNaturalPosition();

    window.addEventListener("scroll", requestApply, { passive: true });
    window.addEventListener("resize", measureNaturalPosition);
    window.addEventListener("pageshow", measureNaturalPosition);
    window.addEventListener("orientationchange", () => {
      window.setTimeout(measureNaturalPosition, 240);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLogoScrollFollow, { once: true });
  } else {
    initLogoScrollFollow();
  }
})();
