(() => {
  const SCROLLED_CLASS = "logo-is-scrolled";
  const THRESHOLD = 24;

  function topbar() {
    return document.querySelector(".topbar");
  }

  function applyLogoScrollState() {
    const header = topbar();
    if (!header) return;

    header.classList.toggle(SCROLLED_CLASS, window.scrollY > THRESHOLD);
  }

  function initLogoScrollState() {
    applyLogoScrollState();

    window.addEventListener("scroll", applyLogoScrollState, { passive: true });
    window.addEventListener("resize", applyLogoScrollState);
    window.addEventListener("pageshow", applyLogoScrollState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLogoScrollState, { once: true });
  } else {
    initLogoScrollState();
  }
})();
