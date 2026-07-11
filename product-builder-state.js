(() => {
  const BASE_SELECTOR = '#baseOptions';

  function baseFieldset() {
    return document.querySelector(BASE_SELECTOR)?.closest('fieldset') || null;
  }

  function currentProduct() {
    const productId = window.state?.selectedProductId;
    return productId && window.products ? window.products[productId] : null;
  }

  function ensureSummary(fieldset) {
    const legend = fieldset?.querySelector('legend');
    if (!legend) return null;

    let summary = legend.querySelector('.step-summary');
    if (!summary) {
      summary = document.createElement('small');
      summary.className = 'step-summary';
      legend.appendChild(summary);
    }

    return summary;
  }

  function selectedBaseLabel() {
    const checked = document.querySelector(`${BASE_SELECTOR} input[name="base"]:checked`);
    return checked?.closest('.option-card')?.querySelector('span')?.textContent?.trim() || '';
  }

  function isSingleBaseProduct(product = currentProduct()) {
    return Array.isArray(product?.bases) && product.bases.length === 1;
  }

  function clearBaseSummary(fieldset) {
    const summary = ensureSummary(fieldset);
    if (!summary) return;
    summary.textContent = '';
    summary.hidden = true;
  }

  function openSingleBaseField(force = false) {
    const product = currentProduct();
    const fieldset = baseFieldset();
    if (!fieldset || !isSingleBaseProduct(product)) return;

    if (fieldset.classList.contains('base-single-selected') && !force) return;

    fieldset.classList.add('base-single-open');
    fieldset.classList.remove('base-single-selected', 'is-collapsed');
    clearBaseSummary(fieldset);
  }

  function collapseSingleBaseField() {
    const fieldset = baseFieldset();
    if (!fieldset || !fieldset.classList.contains('base-single-open')) return;

    const label = selectedBaseLabel();
    if (!label) return;

    const summary = ensureSummary(fieldset);
    if (summary) {
      summary.textContent = label;
      summary.hidden = false;
    }

    fieldset.classList.remove('base-single-open');
    fieldset.classList.add('base-single-selected', 'is-collapsed');
  }

  function reopenSingleBaseFromLegend(event) {
    const fieldset = baseFieldset();
    if (!fieldset || !fieldset.classList.contains('base-single-selected')) return false;

    const legend = fieldset.querySelector('legend');
    if (!legend?.contains(event.target)) return false;

    openSingleBaseField(true);
    return true;
  }

  function normalizeBaseStateAfterProductOpen() {
    const fieldset = baseFieldset();
    const product = currentProduct();
    if (!fieldset || !product) return;

    if (!isSingleBaseProduct(product)) {
      fieldset.classList.remove('base-single-open', 'base-single-selected');
      return;
    }

    const input = document.querySelector(`${BASE_SELECTOR} input[name="base"]`);
    if (input && !input.checked) input.checked = true;

    openSingleBaseField(true);
  }

  document.addEventListener('click', (event) => {
    if (reopenSingleBaseFromLegend(event)) return;

    const baseChoice = event.target.closest(`${BASE_SELECTOR} .option-card, ${BASE_SELECTOR} input[name="base"]`);
    if (baseChoice) {
      window.setTimeout(collapseSingleBaseField, 40);
      return;
    }

    const productButton = event.target.closest('.choose-product');
    if (!productButton) return;

    window.setTimeout(normalizeBaseStateAfterProductOpen, 160);
  }, true);

  document.addEventListener('change', (event) => {
    if (event.target?.matches(`${BASE_SELECTOR} input[name="base"]`)) return;

    const fieldset = baseFieldset();
    if (!fieldset?.classList.contains('base-single-selected')) return;

    fieldset.classList.remove('base-single-open');
    fieldset.classList.add('base-single-selected');
  }, true);
})();
