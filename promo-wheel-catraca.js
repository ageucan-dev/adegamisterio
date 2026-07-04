(() => {
  const activeRuns = new WeakMap();

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

  function getRotationAngle(element) {
    const transform = window.getComputedStyle(element).transform;
    if (!transform || transform === "none") return 0;

    try {
      const matrix = new DOMMatrixReadOnly(transform);
      return Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    } catch (error) {
      const values = transform.match(/matrix\(([^)]+)\)/)?.[1]?.split(",").map(Number);
      if (!values || values.length < 4) return 0;
      return Math.atan2(values[1], values[0]) * (180 / Math.PI);
    }
  }

  function angleDelta(current, previous) {
    return ((current - previous + 540) % 360) - 180;
  }

  function setPointerAngle(pointer, angle) {
    pointer.style.setProperty("transform", `translateX(-50%) rotate(${angle}deg)`, "important");
  }

  function clearRun(pointer) {
    const run = activeRuns.get(pointer);
    if (!run) return;

    if (run.raf) cancelAnimationFrame(run.raf);
    run.timers.forEach((timer) => clearTimeout(timer));
    activeRuns.delete(pointer);
    setPointerAngle(pointer, 0);
  }

  function flickPointer(pointer, interval, run) {
    run.flickTimers.forEach((timer) => clearTimeout(timer));
    run.flickTimers = [];

    const duration = Math.max(58, Math.min(170, interval * 0.82 || 80));

    setPointerAngle(pointer, 16);

    run.flickTimers.push(
      setTimeout(() => setPointerAngle(pointer, -5), duration * 0.42),
      setTimeout(() => setPointerAngle(pointer, 0), duration * 0.78)
    );

    run.timers.push(...run.flickTimers);
  }

  function startPointerRatchet(pointer, disc) {
    if (!pointer || !disc) return;

    clearRun(pointer);

    const run = {
      raf: null,
      timers: [],
      flickTimers: [],
      lastAngle: null,
      traveled: 0,
      lastPegAt: 0,
      lastPegTime: performance.now(),
      startedAt: performance.now()
    };

    activeRuns.set(pointer, run);
    setPointerAngle(pointer, 0);

    function frame(now) {
      const angle = getRotationAngle(disc);

      if (run.lastAngle !== null) {
        const delta = angleDelta(angle, run.lastAngle);

        if (Math.abs(delta) > 0.03) {
          run.traveled += Math.abs(delta);

          while (run.traveled - run.lastPegAt >= 60) {
            const interval = Math.max(55, now - run.lastPegTime);
            run.lastPegAt += 60;
            run.lastPegTime = now;
            flickPointer(pointer, interval, run);
          }
        }
      }

      run.lastAngle = angle;

      if (now - run.startedAt < 4550) {
        run.raf = requestAnimationFrame(frame);
      } else {
        setPointerAngle(pointer, 0);
        activeRuns.delete(pointer);
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame((now) => {
        run.startedAt = now;
        run.lastPegTime = now;
        run.lastAngle = getRotationAngle(disc);
        run.raf = requestAnimationFrame(frame);
      });
    });
  }

  function wireWheel(modal) {
    if (!modal || modal.dataset.catracaReady === "true") return;

    const stage = modal.querySelector(".promo-wheel-stage");
    const disc = modal.querySelector(".promo-wheel-disc");
    const pointer = modal.querySelector(".promo-wheel-pointer");
    const spinButton = modal.querySelector(".promo-wheel-spin");

    injectPegs(stage);

    spinButton?.addEventListener("click", () => {
      startPointerRatchet(pointer, disc);
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
