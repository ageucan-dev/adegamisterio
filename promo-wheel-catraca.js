(() => {
  const activeTimers = new WeakMap();

  function clearPointerTimers(pointer) {
    const timers = activeTimers.get(pointer) || [];
    timers.forEach((timer) => clearTimeout(timer));
    activeTimers.delete(pointer);
  }

  function startPointerCatraca(pointer) {
    if (!pointer) return;

    clearPointerTimers(pointer);
    pointer.classList.add("is-clicking");
    pointer.style.animationDuration = "0.085s";

    const timers = [
      setTimeout(() => { pointer.style.animationDuration = "0.12s"; }, 2600),
      setTimeout(() => { pointer.style.animationDuration = "0.18s"; }, 3400),
      setTimeout(() => {
        pointer.classList.remove("is-clicking");
        pointer.style.animationDuration = "";
      }, 4300)
    ];

    activeTimers.set(pointer, timers);
  }

  document.addEventListener("click", (event) => {
    const spinButton = event.target.closest(".promo-wheel-spin");
    if (!spinButton) return;

    const modal = spinButton.closest(".promo-wheel-modal");
    const pointer = modal?.querySelector(".promo-wheel-pointer");
    startPointerCatraca(pointer);
  }, true);
})();
