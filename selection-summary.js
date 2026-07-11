(() => {
  const fieldsetFrames = new WeakMap();
  let selectionTimer = 0;

  function selectedLabel(input) {
    const card = input.closest(".option-card");
    return card?.querySelector("span")?.textContent?.trim() || input.value || "";
  }

  function ensureSummary(fieldset) {
    const legend = fieldset.querySelector("legend");
    if (!legend) return null;

    let summary = legend.querySelector(".step-summary");
    if (!summary) {
      summary = document.createElement("small");
      summary.className = "step-summary";
      summary.hidden = true;
      legend.appendChild(summary);
    }
    return summary;
  }

  function updateCheckedClasses(fieldset) {
    if (!fieldset) return;
    fieldset.querySelectorAll(".option-card").forEach((card) => {
      const input = card.querySelector('input[type="radio"]');
      const isChecked = !!input?.checked;
      if (card.classList.contains("is-checked") !== isChecked) {
        card.classList.toggle("is-checked", isChecked);
      }
    });
  }

  function updateFieldsetSummary(fieldset) {
    if (!fieldset || !fieldset.isConnected) return;
    const checked = fieldset.querySelector('input[type="radio"]:checked');
    const summary = ensureSummary(fieldset);
    if (!summary) return;

    const nextText = checked ? selectedLabel(checked) : "";
    if (summary.textContent !== nextText) summary.textContent = nextText;
    const shouldHide = !checked;
    if (summary.hidden !== shouldHide) summary.hidden = shouldHide;
    updateCheckedClasses(fieldset);
  }

  function queueFieldsetUpdate(fieldset) {
    if (!fieldset) return;
    const previousFrame = fieldsetFrames.get(fieldset);
    if (previousFrame) window.cancelAnimationFrame(previousFrame);

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const frame = window.requestAnimationFrame(() => {
      updateFieldsetSummary(fieldset);
      fieldsetFrames.delete(fieldset);
      window.requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - scrollY) > 2 || Math.abs(window.scrollX - scrollX) > 2) {
          window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
        }
      });
    });

    fieldsetFrames.set(fieldset, frame);
  }

  function markSelecting(form) {
    if (!form) return;
    form.classList.add("is-selecting-option");
    window.clearTimeout(selectionTimer);
    selectionTimer = window.setTimeout(() => {
      form.classList.remove("is-selecting-option");
    }, 110);
  }

  function syncAllSummaries() {
    document.querySelectorAll(".custom-form fieldset").forEach(updateFieldsetSummary);
  }

  function scrollWithOffset(target, delay = 0) {
    if (!target) return;
    window.setTimeout(() => {
      const headerOffset = 92;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    }, delay);
  }

  function scrollBuilderTop(delay = 220) {
    const builder = document.querySelector("#personalizacao");
    if (!builder || builder.classList.contains("is-hidden")) return;
    scrollWithOffset(builder, delay);
  }

  function deliveryComplete() {
    const requiredFields = ["#customerName", "#customerPhone", "#street", "#number", "#district"];
    return requiredFields.every((selector) => document.querySelector(selector)?.value.trim());
  }

  function handleBottomFinish(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!deliveryComplete()) {
      scrollWithOffset(document.querySelector(".checkout-card"), 80);
      setTimeout(() => document.querySelector("#customerName")?.focus({ preventScroll: true }), 520);
      return;
    }

    if (typeof finish === "function") {
      finish();
      return;
    }

    document.querySelector("#sendWhatsApp")?.click();
  }

  function installBuilderClose() {
    const builder = document.querySelector("#personalizacao");
    if (!builder || builder.querySelector(".builder-close")) return;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "builder-close";
    close.setAttribute("aria-label", "Fechar personalização");
    close.textContent = "×";

    close.addEventListener("click", () => {
      builder.classList.add("is-hidden");
      document.querySelector("#produto")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    builder.appendChild(close);
  }

  function installBottomFinishFlow() {
    const bottomFinish = document.querySelector(".bottom-finish-link");
    if (!bottomFinish || bottomFinish.dataset.deliveryFlow === "true") return;

    bottomFinish.dataset.deliveryFlow = "true";
    bottomFinish.addEventListener("click", handleBottomFinish);
  }

  document.addEventListener("change", (event) => {
    if (!event.target.matches('.custom-form input[type="radio"]')) return;
    const fieldset = event.target.closest("fieldset");
    const form = event.target.closest(".custom-form");
    markSelecting(form);
    queueFieldsetUpdate(fieldset);
    window.setTimeout(() => {
      if (document.activeElement === event.target) event.target.blur();
    }, 0);
  }, true);

  document.addEventListener("click", (event) => {
    if (!event.target.matches("#addToCart, #buyNow, #clearCart")) return;

    setTimeout(() => {
      if (event.target.matches("#addToCart")) {
        syncAllSummaries();
        scrollBuilderTop(420);
      }
    }, 140);
  }, true);

  window.addEventListener("load", () => {
    installBuilderClose();
    installBottomFinishFlow();
    window.requestAnimationFrame(syncAllSummaries);
  });

  installBuilderClose();
  installBottomFinishFlow();
  window.requestAnimationFrame(syncAllSummaries);
})();
