(() => {
  const fieldsetFrames = new WeakMap();
  let selectionTimer = 0;

  function selectedLabel(input) {
    const card = input.closest(".option-card");
    return card?.querySelector("span")?.textContent?.trim() || input.value || "";
  }

  function fieldsetRadios(fieldset) {
    return [...fieldset.querySelectorAll('input[type="radio"]')];
  }

  function isSingleOptionFieldset(fieldset) {
    return fieldsetRadios(fieldset).length === 1;
  }

  function markFieldsetTouched(fieldset) {
    if (!fieldset) return;
    fieldset.dataset.selectionTouched = "true";
  }

  function clearFieldsetTouched(fieldset) {
    if (!fieldset) return;
    delete fieldset.dataset.selectionTouched;
  }

  function shouldShowSelection(fieldset, checked) {
    if (!checked) return false;
    return fieldset.dataset.selectionTouched === "true" || isSingleOptionFieldset(fieldset);
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

  function updateCheckedClasses(fieldset, allowChecked = true) {
    if (!fieldset) return;
    fieldset.querySelectorAll(".option-card").forEach((card) => {
      const input = card.querySelector('input[type="radio"]');
      const isChecked = allowChecked && !!input?.checked;
      card.classList.toggle("is-checked", isChecked);
    });
  }

  function updateFieldsetSummary(fieldset) {
    if (!fieldset || !fieldset.isConnected) return;
    const checked = fieldset.querySelector('input[type="radio"]:checked');
    const canShow = shouldShowSelection(fieldset, checked);
    const summary = ensureSummary(fieldset);
    if (!summary) return;

    const nextText = canShow ? selectedLabel(checked) : "";
    if (summary.textContent !== nextText) summary.textContent = nextText;
    if (summary.hidden !== !canShow) summary.hidden = !canShow;
    updateCheckedClasses(fieldset, canShow);
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

  function resetPristineSelections() {
    document.querySelectorAll(".custom-form fieldset").forEach((fieldset) => {
      const radios = fieldsetRadios(fieldset);
      if (!radios.length) return;

      const isSingle = radios.length === 1;
      if (isSingle && radios[0].checked) {
        markFieldsetTouched(fieldset);
      } else {
        radios.forEach((input) => {
          input.checked = false;
          input.defaultChecked = false;
          input.removeAttribute("checked");
        });
        clearFieldsetTouched(fieldset);
      }

      const summary = fieldset.querySelector(".step-summary");
      if (summary && !fieldset.dataset.selectionTouched) {
        summary.textContent = "";
        summary.hidden = true;
      }

      fieldset.classList.remove("is-collapsed");
      updateFieldsetSummary(fieldset);
    });
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

    if (event.isTrusted || isSingleOptionFieldset(fieldset)) {
      markFieldsetTouched(fieldset);
    }

    markSelecting(form);
    queueFieldsetUpdate(fieldset);
    window.setTimeout(() => {
      if (document.activeElement === event.target) event.target.blur();
    }, 0);
  }, true);

  document.addEventListener("click", (event) => {
    if (event.target.closest(".choose-product")) {
      window.setTimeout(resetPristineSelections, 120);
      window.setTimeout(resetPristineSelections, 320);
      return;
    }

    if (!event.target.matches("#addToCart, #buyNow, #clearCart")) return;

    setTimeout(() => {
      if (event.target.matches("#addToCart")) {
        syncAllSummaries();
        scrollBuilderTop(420);
      }
    }, 140);
  }, true);

  window.addEventListener("pageshow", () => {
    const builder = document.querySelector("#personalizacao");
    if (!builder || builder.classList.contains("is-hidden")) resetPristineSelections();
  });

  window.addEventListener("load", () => {
    installBuilderClose();
    installBottomFinishFlow();
    window.requestAnimationFrame(() => {
      resetPristineSelections();
      syncAllSummaries();
    });
  });

  installBuilderClose();
  installBottomFinishFlow();
  window.requestAnimationFrame(() => {
    resetPristineSelections();
    syncAllSummaries();
  });
})();