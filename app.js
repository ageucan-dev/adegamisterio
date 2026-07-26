const DELIVERY_FEE = 5;
const FREE_DELIVERY_MIN_CUPS = 3;
const CART_STORAGE_KEY = "copaoCartV2";

const sharedSizes = [
  { id: "700ml", label: "700ml", price: 11.5 }
];

const sharedEnergies = [
  { id: "baly-tradicional", label: "Baly Tradicional", price: 3.9 },
  { id: "baly-maca-verde", label: "Baly Maçã Verde", price: 3.9 },
  { id: "baly-melancia", label: "Baly Melancia", price: 3.9 },
  { id: "baly-tropical", label: "Baly Tropical", price: 3.9 },
  { id: "red-bull-tradicional", label: "Red Bull Tradicional", price: 14.9 },
  { id: "red-bull-tropical", label: "Red Bull Tropical", price: 14.9 },
  { id: "red-bull-morango-pessego", label: "Red Bull Morango e Pêssego", price: 14.9 }
];

const sharedIces = [
  { id: "gelo-maracuja", label: "Gelo de Maracujá", price: 3.9 },
  { id: "gelo-coco", label: "Gelo de Água de Coco", price: 3.9 },
  { id: "gelo-morango", label: "Gelo de Morango", price: 3.9 }
];

const products = {
  "ethernity-mix": {
    id: "ethernity-mix",
    name: "Ether Mix",
    minimumPrice: 16,
    description: "Monte seu copo do seu jeito: escolha tamanho, sabor da base, intensidade, energético, gelo e quantidade.",
    sizes: sharedSizes,
    bases: [
      { id: "citrico", label: "Cítrico", price: 5.9 },
      { id: "maca-verde", label: "Maçã Verde", price: 5.9 },
      { id: "melancia", label: "Melancia", price: 5.9 },
      { id: "morango", label: "Morango", price: 5.9 },
      { id: "tropical", label: "Tropical", price: 5.9 }
    ],
    energies: sharedEnergies,
    ices: sharedIces
  },

  "mix-gold": {
    id: "mix-gold",
    name: "Ballan Mix",
    minimumPrice: 21,
    description: "Monte seu copo do seu jeito: escolha tamanho, sabor da base, intensidade, energético, gelo e quantidade.",
    sizes: sharedSizes,
    bases: [
      { id: "mix-gold", label: "Ballan Mix", price: 11.9 }
    ],
    energies: sharedEnergies,
    ices: sharedIces
  }
};

var state = {
  quantity: 1,
  cart: [],
  selectedProductId: "ethernity-mix"
};

window.state = state;
window.products = products;

const els = {
  sizeOptions: document.querySelector("#sizeOptions"),
  baseOptions: document.querySelector("#baseOptions"),
  energyOptions: document.querySelector("#energyOptions"),
  iceOptions: document.querySelector("#iceOptions"),
  quantityValue: document.querySelector("#quantityValue"),
  itemTotal: document.querySelector("#itemTotal"),
  addToCart: document.querySelector("#addToCart"),
  buyNow: document.querySelector("#buyNow"),
  decreaseQty: document.querySelector("#decreaseQty"),
  increaseQty: document.querySelector("#increaseQty"),
  notes: document.querySelector("#notes"),
  cartItems: document.querySelector("#cartItems"),
  cartCount: document.querySelector("#cartCount"),
  bottomCartCount: document.querySelector("#bottomCartCount"),
  bottomTotalValue: document.querySelector("#bottomTotalValue"),
  subtotalValue: document.querySelector("#subtotalValue"),
  deliveryRow: document.querySelector("#deliveryRow"),
  deliveryValue: document.querySelector("#deliveryValue"),
  orderTotal: document.querySelector("#orderTotal"),
  clearCart: document.querySelector("#clearCart"),
  sendWhatsApp: document.querySelector("#sendWhatsApp"),
  customerName: document.querySelector("#customerName"),
  customerPhone: document.querySelector("#customerPhone"),
  street: document.querySelector("#street"),
  number: document.querySelector("#number"),
  district: document.querySelector("#district"),
  complement: document.querySelector("#complement"),
  reference: document.querySelector("#reference"),
  deliveryNotes: document.querySelector("#deliveryNotes"),
  builderTitle: document.querySelector("#builderTitle"),
  builderCard: document.querySelector("#personalizacao"),
  carousel: document.querySelector("#productCarousel"),
  bottomBar: document.querySelector(".bottom-bar"),
  freightProgress: document.querySelector("#freightProgress"),
  freightProgressText: document.querySelector("#freightProgressText"),
  freightProgressAux: document.querySelector("#freightProgressAux"),
  freightProgressFill: document.querySelector("#freightProgressFill")
};

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function currentCatalog() {
  return products[state.selectedProductId] || products["ethernity-mix"];
}

function minPrice(list) {
  return Math.min(...list.map((item) => item.price));
}

function priceAdditional(list, selectedItem) {
  if (!selectedItem || !Array.isArray(list) || !list.length) return 0;
  return Math.max(Number(selectedItem.price || 0) - minPrice(list), 0);
}

function minUnitPrice(product) {
  return Number(product.minimumPrice || 0);
}

function optionMarkup(groupName, item, groupItems) {
  const additional = item.price - minPrice(groupItems);
  const hasAdditional = additional > 0;
  const cardClass = hasAdditional ? "option-card option-card--with-additional" : "option-card option-card--compact";
  const priceLabel = hasAdditional ? `<small class="option-additional">+${money(additional)}</small>` : "";
  const checked = groupName === "size" && item.id === "700ml" ? " checked" : "";
  return `<label class="${cardClass}"><input type="radio" name="${groupName}" value="${item.id}"${checked} /><span>${item.label}</span>${priceLabel}</label>`;
}

function updateProductPrices() {
  document.querySelectorAll("[data-product-price]").forEach((el) => {
    const product = products[el.dataset.productPrice];
    if (!product) return;
    el.textContent = `/ ${money(minUnitPrice(product)).replace("R$ ", "R$").replace("R$ ", "R$")}`;
  });
}

function autoSelectSingleBase(catalog) {
  const isSingleBase = catalog.bases.length === 1;
  els.baseOptions.classList.toggle("option-grid--single", isSingleBase);
  if (!isSingleBase) return;

  const input = els.baseOptions.querySelector('input[name="base"]');
  if (!input) return;
  input.checked = true;
  window.setTimeout(() => input.dispatchEvent(new Event("change", { bubbles: true })), 0);
}

function ensureDefaultSize() {
  const input = els.sizeOptions?.querySelector('input[name="size"][value="700ml"]');
  if (!input) return;
  input.checked = true;
  input.defaultChecked = true;
  input.setAttribute("checked", "");
}

function renderOptions() {
  const catalog = currentCatalog();

  els.sizeOptions.innerHTML = catalog.sizes.map((item) => optionMarkup("size", item, catalog.sizes)).join("");
  els.baseOptions.innerHTML = catalog.bases.map((item) => optionMarkup("base", item, catalog.bases)).join("");
  els.energyOptions.innerHTML = catalog.energies.map((item) => optionMarkup("energy", item, catalog.energies)).join("");
  els.iceOptions.innerHTML = catalog.ices.map((item) => optionMarkup("ice", item, catalog.ices)).join("");

  document.querySelectorAll('input[name="intensity"]').forEach((input) => {
    input.checked = false;
  });

  ensureDefaultSize();
  autoSelectSingleBase(catalog);

  if (els.builderTitle) els.builderTitle.textContent = `Monte seu copo - ${catalog.name}`;
  updateLiveTotal();
}

function selectedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value;
}

function findById(list, id) {
  return list.find((item) => item.id === id);
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function missingSelections() {
  const missing = [];
  if (!selectedValue("size")) missing.push("tamanho");
  if (!selectedValue("base")) missing.push("sabor da base");
  if (!selectedValue("intensity")) missing.push("intensidade");
  if (!selectedValue("energy")) missing.push("energético");
  if (!selectedValue("ice")) missing.push("gelo saborizado");
  return missing;
}

function currentCup() {
  const catalog = currentCatalog();
  const size = findById(catalog.sizes, selectedValue("size"));
  const base = findById(catalog.bases, selectedValue("base"));
  const energy = findById(catalog.energies, selectedValue("energy"));
  const ice = findById(catalog.ices, selectedValue("ice"));
  const intensity = selectedValue("intensity");

  if (!size || !base || !energy || !ice || !intensity) return null;

  const unitPrice = minUnitPrice(catalog)
    + priceAdditional(catalog.sizes, size)
    + priceAdditional(catalog.bases, base)
    + priceAdditional(catalog.energies, energy)
    + priceAdditional(catalog.ices, ice);

  return {
    id: makeId(),
    product: catalog.name,
    productId: catalog.id,
    size,
    base,
    energy,
    ice,
    intensity,
    notes: els.notes.value.trim(),
    quantity: state.quantity,
    unitPrice
  };
}

function updateLiveTotal() {
  const item = currentCup();
  els.quantityValue.textContent = state.quantity;
  els.itemTotal.textContent = item ? money(item.unitPrice * state.quantity) : money(0);
}

function deliveryFee(totalCups) {
  if (totalCups <= 0 || totalCups >= FREE_DELIVERY_MIN_CUPS) return 0;
  return DELIVERY_FEE;
}

function cartTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
  const totalCups = state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const delivery = deliveryFee(totalCups);
  return { subtotal, totalCups, delivery, total: subtotal + delivery };
}

function saveCart() {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  } catch (error) {
    // O carrinho continua funcionando mesmo quando o navegador bloqueia o armazenamento.
  }
}

function loadSavedCart() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved)) return;

    state.cart = saved.filter((item) => {
      return item && item.id && item.product && item.size && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0;
    }).map((item) => ({
      ...item,
      quantity: Math.max(1, Number(item.quantity || 1)),
      unitPrice: Number(item.unitPrice || 0)
    }));
  } catch (error) {
    state.cart = [];
  }
}

function updateFreightProgress(totals) {
  if (!els.freightProgress) return;

  const cups = Number(totals.totalCups || 0);
  const visible = cups > 0;
  els.freightProgress.hidden = !visible;
  document.body.classList.toggle("has-freight-progress", visible);

  if (!visible) return;

  const remaining = Math.max(FREE_DELIVERY_MIN_CUPS - cups, 0);
  const progress = Math.min((cups / FREE_DELIVERY_MIN_CUPS) * 100, 100);
  const free = remaining === 0;

  els.freightProgress.classList.toggle("is-complete", free);
  els.freightProgressFill.style.width = `${progress}%`;
  els.freightProgressText.textContent = free
    ? "Frete grátis liberado"
    : `Adicione mais ${remaining} ${remaining === 1 ? "copo" : "copos"} e ganhe frete grátis`;
  els.freightProgressAux.textContent = free ? "Entrega: Grátis" : `Entrega: ${money(DELIVERY_FEE)}`;

  const bottomHeight = Math.ceil(els.bottomBar?.getBoundingClientRect().height || 64);
  document.documentElement.style.setProperty("--bottom-bar-height", `${bottomHeight}px`);
}

function cartPriceMarkup(item) {
  return `<strong class="cart-price">${money(item.unitPrice * item.quantity)}</strong>`;
}

function renderCart() {
  const totals = cartTotals();
  els.cartCount.textContent = totals.totalCups;
  els.bottomCartCount.textContent = totals.totalCups;
  if (els.bottomTotalValue) els.bottomTotalValue.textContent = money(totals.total);
  els.subtotalValue.textContent = money(totals.subtotal);
  els.orderTotal.textContent = money(totals.total);

  if (els.deliveryRow && els.deliveryValue) {
    els.deliveryRow.hidden = totals.totalCups === 0;
    els.deliveryValue.textContent = totals.totalCups >= FREE_DELIVERY_MIN_CUPS ? "Grátis" : money(totals.delivery);
  }

  updateFreightProgress(totals);
  saveCart();

  if (!state.cart.length) {
    els.cartItems.className = "cart-items empty-state";
    els.cartItems.textContent = "Seu carrinho ainda está vazio.";
    window.dispatchEvent(new CustomEvent("copao:cart-updated", { detail: { totalCups: 0, delivery: 0 } }));
    return;
  }

  els.cartItems.className = "cart-items";
  els.cartItems.innerHTML = state.cart.map((item) => `
    <article class="cart-item">
      <div class="cart-item-header">
        <div>
          <h3>${item.product} - ${item.size.label}</h3>
          <p>${item.base.label} | ${item.intensity} | ${item.energy.label} | ${item.ice.label}</p>
          ${item.notes ? `<p>Obs: ${item.notes}</p>` : ""}
        </div>
        ${cartPriceMarkup(item)}
      </div>
      <div class="cart-item-actions">
        <div class="quantity-control">
          <button class="item-action" type="button" data-action="minus" data-id="${item.id}">-</button>
          <strong>${item.quantity}</strong>
          <button class="item-action" type="button" data-action="plus" data-id="${item.id}">+</button>
        </div>
        <button class="item-action" type="button" data-action="remove" data-id="${item.id}">Remover</button>
      </div>
    </article>
  `).join("");

  window.dispatchEvent(new CustomEvent("copao:cart-updated", {
    detail: { totalCups: totals.totalCups, delivery: totals.delivery }
  }));
}

function resetCustomization() {
  state.quantity = 1;
  els.notes.value = "";
  document.querySelectorAll('.custom-form input[type="radio"]').forEach((input) => {
    input.checked = false;
    input.defaultChecked = false;
    input.removeAttribute("checked");
  });
  document.querySelectorAll(".custom-form fieldset").forEach((fieldset) => {
    fieldset.classList.remove("is-collapsed", "base-single-open", "base-single-selected");
  });
  ensureDefaultSize();
  updateLiveTotal();
}

function setActiveProduct(productId) {
  document.querySelectorAll(".product-slide").forEach((slide) => {
    slide.classList.toggle("is-active", slide.dataset.product === productId);
  });
  document.querySelectorAll(".choose-product").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.product === productId);
  });
}

function setActiveCarouselDot(index) {
  document.querySelectorAll("[data-carousel-dot]").forEach((dot) => {
    dot.classList.toggle("is-active", Number(dot.dataset.carouselDot) === index);
  });
}

function syncCarouselState() {
  if (!els.carousel) return;
  const slides = [...document.querySelectorAll(".product-slide")];
  if (!slides.length) return;

  const slideWidth = slides[0].getBoundingClientRect().width || els.carousel.clientWidth || 1;
  const index = Math.max(0, Math.min(slides.length - 1, Math.round(els.carousel.scrollLeft / slideWidth)));
  const productId = slides[index]?.dataset.product || "ethernity-mix";
  setActiveCarouselDot(index);
  setActiveProduct(productId);
}

function openBuilder(productId) {
  if (!products[productId]) return;
  state.selectedProductId = productId;
  setActiveProduct(productId);
  resetCustomization();
  renderOptions();
  els.builderCard?.classList.remove("is-hidden");
  els.builderCard?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addCurrentToCart() {
  const missing = missingSelections();
  if (missing.length) {
    alert(`Escolha: ${missing.join(", ")} antes de adicionar ao carrinho.`);
    return false;
  }

  const cup = currentCup();
  if (!cup) return false;

  state.cart.push(cup);
  renderCart();
  resetCustomization();
  renderOptions();
  return true;
}

function changeCartItem(id, action) {
  const item = state.cart.find((cartItem) => cartItem.id === id);
  if (!item) return;
  if (action === "plus") item.quantity += 1;
  if (action === "minus") item.quantity = Math.max(1, item.quantity - 1);
  if (action === "remove") state.cart = state.cart.filter((cartItem) => cartItem.id !== id);
  renderCart();
}

function deliveryData() {
  return {
    name: els.customerName.value.trim(),
    phone: els.customerPhone.value.trim(),
    street: els.street.value.trim(),
    number: els.number.value.trim(),
    district: els.district.value.trim(),
    complement: els.complement.value.trim(),
    reference: els.reference.value.trim(),
    notes: els.deliveryNotes.value.trim()
  };
}

function validateBeforeSend() {
  const data = deliveryData();
  if (!state.cart.length) return "Adicione pelo menos um copo ao carrinho.";
  if (!data.name || !data.phone || !data.street || !data.number || !data.district) {
    return "Preencha nome, contato, rua, número e bairro antes de finalizar.";
  }
  return "";
}

function buildSummary() {
  const totals = cartTotals();
  const data = deliveryData();
  const items = state.cart.map((item, index) => [
    `*${index + 1}. ${item.product} - ${item.size.label}*`,
    `• Base: ${item.base.label}`,
    `• Intensidade: ${item.intensity}`,
    `• Energético: ${item.energy.label}`,
    `• Gelo: ${item.ice.label}`,
    `• Quantidade: ${item.quantity}`,
    `• Valor unitário: ${money(item.unitPrice)}`,
    `• Subtotal: ${money(item.unitPrice * item.quantity)}`,
    item.notes ? `• Observações: ${item.notes}` : ""
  ].filter(Boolean).join("\n")).join("\n\n");

  return [
    "*🥤 COPÃO NA MÃO | NOVO PEDIDO*",
    "_Ficha organizada para preparo e conferência._",
    "",
    "*🛒 ITENS DO CARRINHO*",
    items,
    "",
    "*💰 RESUMO DO PEDIDO*",
    `• Subtotal: ${money(totals.subtotal)}`,
    `• Entrega: ${totals.delivery ? money(totals.delivery) : "Grátis"}`,
    `• *Total: ${money(totals.total)}*`,
    "",
    "*📍 DADOS DE ENTREGA*",
    `• Nome: ${data.name}`,
    `• Contato: ${data.phone}`,
    `• Endereço: ${data.street}, ${data.number} - ${data.district}`,
    data.complement ? `• Complemento: ${data.complement}` : "",
    data.reference ? `• Referência: ${data.reference}` : "",
    data.notes ? `• Observação: ${data.notes}` : "",
    "",
    "✅ Aguardo confirmação para preparo."
  ].filter(Boolean).join("\n");
}

function finish() {
  const error = validateBeforeSend();
  if (error) {
    alert(error);
    return;
  }
  const summary = encodeURIComponent(buildSummary());
  window.open(`https://wa.me/5516996396543?text=${summary}`, "_blank", "noopener,noreferrer");
}

function initProductCarousel() {
  document.querySelectorAll("[data-carousel-dot]").forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.carouselDot);
      const slide = document.querySelectorAll(".product-slide")[index];
      if (!slide || !els.carousel) return;
      els.carousel.scrollTo({ left: slide.offsetLeft - els.carousel.offsetLeft, behavior: "smooth" });
      setActiveCarouselDot(index);
      setActiveProduct(slide.dataset.product);
    });
  });

  if (!els.carousel) return;
  let scrollTimer = null;
  els.carousel.addEventListener("scroll", () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(syncCarouselState, 90);
  }, { passive: true });
  window.addEventListener("resize", () => {
    syncCarouselState();
    updateFreightProgress(cartTotals());
  });
  syncCarouselState();
}

loadSavedCart();
updateProductPrices();
renderOptions();
updateLiveTotal();
renderCart();
initProductCarousel();

window.cartTotals = cartTotals;
window.deliveryData = deliveryData;
window.validateBeforeSend = validateBeforeSend;
window.finish = finish;
window.renderCart = renderCart;
window.renderOptions = renderOptions;
window.updateProductPrices = updateProductPrices;
window.updateLiveTotal = updateLiveTotal;
window.ensureDefaultSize = ensureDefaultSize;

document.querySelectorAll("[data-scroll-to]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.scrollTo}`)?.scrollIntoView({ behavior: "smooth" }));
});

document.addEventListener("change", (event) => {
  if (event.target.matches('input[type="radio"]')) updateLiveTotal();
});

document.querySelectorAll(".choose-product").forEach((button) => {
  button.addEventListener("click", () => openBuilder(button.dataset.product));
});

els.decreaseQty.addEventListener("click", () => {
  state.quantity = Math.max(1, state.quantity - 1);
  updateLiveTotal();
});

els.increaseQty.addEventListener("click", () => {
  state.quantity += 1;
  updateLiveTotal();
});

els.addToCart.addEventListener("click", addCurrentToCart);
els.buyNow.addEventListener("click", () => {
  if (addCurrentToCart()) document.querySelector("#carrinho").scrollIntoView({ behavior: "smooth" });
});

els.clearCart.addEventListener("click", () => {
  state.cart = [];
  renderCart();
});

els.cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  changeCartItem(button.dataset.id, button.dataset.action);
});

els.sendWhatsApp.addEventListener("click", finish);
