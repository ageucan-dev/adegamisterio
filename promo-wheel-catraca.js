(() => {
  const activeTimers = new WeakMap();

  function injectPegs(stage) {
    const disc = stage?.querySelector(".promo-wheel-disc");
    if (!disc || disc.querySelector(".promo-wheel-pegs")) return;

    const pegs = document.createElement("div");
    pegs.className = "promo-wheel-pegs";
    pegs.innerHTML = `
      <span class="promo-wheel-peg peg-1"></span>
      <span class="promo-wheel-peg peg-2"></span>
      <span class="promo-wheel-peg peg-3"></span>
      <span class="promo-wheel-peg peg-4"></span>
      <span class="promo-wheel-peg peg-5"></span>
      <span class="promo-wheel-peg peg-6"></span>
    `;

    disc.appendChild(pegs);
  }

  function clearPointerTimers(pointer) {
    const timers = activeTimers.get(pointer) || [];
    timers.forEach((timer) => clearTimeout(timer));
    activeTimers.delete(pointer);
  }

  function startPointerRatchet(pointer) {
    if (!pointer) return;

    clearPointerTimers(pointer);

    pointer.classList.add("is-clicking");
    pointer.style.animationDuration = "0.06s";

    const timers = [
      setTimeout(() => {
        pointer.style.animationDuration = "0.085s";
      }, 1900),

      setTimeout(() => {
        pointer.style.animationDuration = "0.12s";
      }, 3000),

      setTimeout(() => {
        pointer.style.animationDuration = "0.18s";
      }, 3700),

      setTimeout(() => {
        pointer.classList.remove("is-clicking");
        pointer.style.animationDuration = "";
      }, 4300)
    ];

    activeTimers.set(pointer, timers);
  }

  function wireWheel(modal) {
    if (!modal || modal.dataset.catracaReady === "true") return;

    const stage = modal.querySelector(".promo-wheel-stage");
    const pointer = modal.querySelector(".promo-wheel-pointer");
    const spinButton = modal.querySelector(".promo-wheel-spin");

    injectPegs(stage);

    spinButton?.addEventListener("click", () => {
      startPointerRatchet(pointer);
    }, true);

    modal.dataset.catracaReady = "true";
  }

  function scanWheels() {
    document.querySelectorAll(".promo-wheel-modal").forEach(wireWheel);
  }

  const observer = new MutationObserver(scanWheels);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("load", scanWheels);
  setTimeout(scanWheels, 300);
  setTimeout(scanWheels, 1000);
})();
