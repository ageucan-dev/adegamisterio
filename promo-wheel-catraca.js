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

  function setPointerAngle(pointer, angle) {
    pointer.style.setProperty("transform", `translateX(-50%) rotate(${angle}deg)`, "important");
  }

  function startPointerRatchet(pointer) {
    if (!pointer) return;

    clearPointerTimers(pointer);
    pointer.classList.add("is-clicking");

    let elapsed = 0;
    let interval = 62;

    function tick() {
      setPointerAngle(pointer, 17);
      const backTimer = setTimeout(() => setPointerAngle(pointer, -5), Math.max(24, interval * 0.35));
      const resetTimer = setTimeout(() => setPointerAngle(pointer, 0), Math.max(42, interval * 0.62));

      elapsed += interval;

      if (elapsed < 1900) interval = 62;
      else if (elapsed < 3000) interval = 88;
      else if (elapsed < 3800) interval = 130;
      else interval = 190;

      if (elapsed < 4300) {
        const nextTimer = setTimeout(tick, interval);
        activeTimers.set(pointer, [...(activeTimers.get(pointer) || []), backTimer, resetTimer, nextTimer]);
      } else {
        pointer.classList.remove("is-clicking");
        setPointerAngle(pointer, 0);
      }
    }

    tick();
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
