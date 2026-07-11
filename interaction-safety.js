(() => {
  const HEADER_OFFSET = 92;

  function targetFromTrigger(trigger) {
    if (!trigger) return null;

    const scrollId = trigger.dataset?.scrollTo;
    if (scrollId) return document.getElementById(scrollId);

    const href = trigger.getAttribute?.("href") || "";
    if (!href.startsWith("#") || href.length <= 1) return null;

    return document.getElementById(href.slice(1));
  }

  function smoothScrollTo(target, delay = 0) {
    if (!target) return;

    window.setTimeout(() => {
      const targetTop = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: "smooth"
      });
    }, delay);
  }

  function isGateClick(trigger) {
    return !!trigger.closest?.(".customer-gate-overlay");
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.('a[href^="#"], [data-scroll-to]');
    if (!trigger || isGateClick(trigger)) return;

    const target = targetFromTrigger(trigger);
    if (!target) return;

    event.preventDefault();
    smoothScrollTo(target);
  }, true);

  document.addEventListener("click", (event) => {
    const productButton = event.target.closest?.(".choose-product");
    if (!productButton || isGateClick(productButton)) return;

    const builder = document.getElementById("personalizacao");
    window.setTimeout(() => {
      if (builder && !builder.classList.contains("is-hidden")) smoothScrollTo(builder);
    }, 260);
  }, true);

  document.addEventListener("touchstart", (event) => {
    const interactive = event.target.closest?.("button, a, label, input, textarea, select, [role='button']");
    if (!interactive) return;
    interactive.classList.add("is-touching");
    window.setTimeout(() => interactive.classList.remove("is-touching"), 180);
  }, { passive: true });
})();
