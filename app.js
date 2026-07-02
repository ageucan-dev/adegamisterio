const DISCOUNT_PER_EXTRA_CUP = 9;

const catalog = {
  sizes: [
    { id: "500ml", label: "500ml", price: 11.5 },
    { id: "700ml", label: "700ml", price: 12.5 }
  ],
  bases: [
    { id: "citrico", label: "Citrico", price: 5.9 },
    { id: "maca-verde", label: "Maca Verde", price: 5.9 },
    { id: "melancia", label: "Melancia", price: 5.9 },
    { id: "morango", label: "Morango", price: 5.9 },
    { id: "sevilla", label: "Sevilla", price: 5.9 },
    { id: "tropical", label: "Tropical", price: 5.9 }
  ],
  energies: [
    { id: "baly-tradicional", label: "Baly Tradicional", price: 3.9 },
    { id: "baly-maca-verde", label: "Baly Maca Verde", price: 3.9 },
    { id: "baly-melancia", label: "Baly Melancia", price: 3.9 },
    { id: "baly-tropical", label: "Baly Tropical", price: 3.9 },
    { id: "red-bull-tradicional", label: "Red Bull Tradicional", price: 14.9 },
    { id: "red-bull-tropical", label: "Red Bull Tropical", price: 14.9 },
    { id: "red-bull-morango-pessego", label: "Red Bull Morango e Pessego", price: 14.9 },
    { id: "monster-tradicional", label: "Monster Tradicional", price: 8.9 },
    { id: "monster-mango", label: "Monster Mango Loco", price: 8.9 },
    { id: "monster-pipeline", label: "Monster Pipeline Punch", price: 8.9 },
    { id: "monster-pacific", label: "Monster Pacific Punch", price: 8.9 }
  ],
  ices: [
    { id: "gelo-melancia", label: "Gelo de Melancia", price: 3.9 },
    { id: "gelo-maracuja", label: "Gelo de Maracuja", price: 3.9 },
    { id: "gelo-coco", label: "Gelo de Agua de Coco", price: 3.9 },
    { id: "gelo-morango", label: "Gelo de Morango", price: 3.9 }
  ]
};

const state = { quantity: 1, cart: [] };

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
  subtotalValue: document.querySelector("#subtotalValue"),
  discountValue: document.querySelector("#discountValue"),
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
  deliveryNotes: document.querySelector("#deliveryNotes")
};

function money(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function optionMarkup(groupName, item, checked = false) {
  return `<label class="option-card"><input type="radio" name="${groupName}" value="${item.id}" ${checked ? "checked" : ""} /><span>${item.label}</span><small>${money(item.price)}</small></label>`;
}

function renderOptions() {
  els.sizeOptions.innerHTML = catalog.sizes.map((item, index) => optionMarkup("size", item, index === 0)).join("");
  els.baseOptions.innerHTML = catalog.bases.map((item, index) => optionMarkup("base", item, index === 0)).join("");
  els.energyOptions.innerHTML = catalog.energies.map((item, index) => optionMarkup("energy", item, index === 0)).join("");
  els.iceOptions.innerHTML = catalog.ices.map((item, index) => optionMarkup("ice", item, index === 0)).join("");
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

function currentCup() {
  const size = findById(catalog.sizes, selectedValue("size"));
  const base = findById(catalog.bases, selectedValue("base"));
  const energy = findById(catalog.energies, selectedValue("energy"));
  const ice = findById(catalog.ices, selectedValue("ice"));
  const intensity = selectedValue("intensity") || "Leve";
  const unitPrice = size.price + base.price + energy.price + ice.price;
  return { id: makeId(), product: "Ethernity Mix", size, base, energy, ice, intensity, notes: els.notes.value.trim(), quantity: state.quantity, unitPrice };
}

function updateLiveTotal() {
  const item = currentCup();
  els.quantityValue.textContent = state.quantity;
  els.itemTotal.textContent = money(item.unitPrice * state.quantity);
}

function cartTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalCups = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const discount = Math.max(totalCups - 1, 0) * DISCOUNT_PER_EXTRA_CUP;
  const total = Math.max(subtotal - discount, 0);
  return { subtotal, totalCups, discount, total };
}

function renderCart() {
  const totals = cartTotals();
  els.cartCount.textContent = totals.totalCups;
  els.bottomCartCount.textContent = totals.totalCups;
  els.subtotalValue.textContent = money(totals.subtotal);
  els.discountValue.textContent = `-${money(totals.discount)}`;
  els.orderTotal.textContent = money(totals.total);
  if (!state.cart.length) {
    els.cartItems.className = "cart-items empty-state";
    els.cartItems.textContent = "Seu carrinho ainda esta vazio.";
    return;
  }
  els.cartItems.className = "cart-items";
  els.cartItems.innerHTML = state.cart.map((item) => `<article class="cart-item"><div class="cart-item-header"><div><h3>${item.product} - ${item.size.label}</h3><p>${item.base.label} | ${item.intensity} | ${item.energy.label} | ${item.ice.label}</p>${item.notes ? `<p>Obs: ${item.notes}</p>` : ""}</div><strong>${money(item.unitPrice * item.quantity)}</strong></div><div class="cart-item-actions"><div class="quantity-control"><button class="item-action" type="button" data-action="minus" data-id="${item.id}">-</button><strong>${item.quantity}</strong><button class="item-action" type="button" data-action="plus" data-id="${item.id}">+</button></div><button class="item-action" type="button" data-action="remove" data-id="${item.id}">Remover</button></div></article>`).join("");
}

function addCurrentToCart() {
  state.cart.push(currentCup());
  state.quantity = 1;
  els.notes.value = "";
  updateLiveTotal();
  renderCart();
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
  if (!data.name || !data.phone || !data.street || !data.number || !data.district) return "Preencha nome, contato, rua, numero e bairro antes de finalizar.";
  return "";
}

function buildSummary() {
  const totals = cartTotals();
  const data = deliveryData();
  const items = state.cart.map((item, index) => [`Item ${index + 1}:`, `Produto: ${item.product}`, `Tamanho: ${item.size.label}`, `Base: ${item.base.label}`, `Intensidade: ${item.intensity}`, `Energetico: ${item.energy.label}`, `Gelo: ${item.ice.label}`, `Quantidade: ${item.quantity}`, `Valor unitario: ${money(item.unitPrice)}`, `Subtotal: ${money(item.unitPrice * item.quantity)}`, item.notes ? `Observacoes: ${item.notes}` : ""].filter(Boolean).join("\n")).join("\n\n");
  return ["Ola, Adega Misterio! Segue minha ficha:", "", items, "", "Resumo:", `Subtotal: ${money(totals.subtotal)}`, `Desconto progressivo: -${money(totals.discount)}`, `Total: ${money(totals.total)}`, "", "Dados de entrega:", `Nome: ${data.name}`, `Contato: ${data.phone}`, `Endereco: ${data.street}, ${data.number} - ${data.district}`, data.complement ? `Complemento: ${data.complement}` : "", data.reference ? `Referencia: ${data.reference}` : "", data.notes ? `Obs entrega: ${data.notes}` : ""].filter(Boolean).join("\n");
}

function finish() {
  const error = validateBeforeSend();

  if (error) {
    alert(error);
    return;
  }

  const summary = encodeURIComponent(buildSummary());

  window.open(
    `https://wa.me/5516996396543?text=${summary}`,
    "_blank",
    "noopener,noreferrer"
  );
}

renderOptions();
updateLiveTotal();
renderCart();

document.querySelectorAll("[data-scroll-to]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.scrollTo}`)?.scrollIntoView({ behavior: "smooth" }));
});

document.addEventListener("change", (event) => {
  if (event.target.matches('input[type="radio"]')) updateLiveTotal();
});

els.decreaseQty.addEventListener("click", () => { state.quantity = Math.max(1, state.quantity - 1); updateLiveTotal(); });
els.increaseQty.addEventListener("click", () => { state.quantity += 1; updateLiveTotal(); });
els.addToCart.addEventListener("click", addCurrentToCart);
els.buyNow.addEventListener("click", () => { addCurrentToCart(); document.querySelector("#carrinho").scrollIntoView({ behavior: "smooth" }); });
els.clearCart.addEventListener("click", () => { state.cart = []; renderCart(); });
els.cartItems.addEventListener("click", (event) => { const button = event.target.closest("button[data-action]"); if (!button) return; changeCartItem(button.dataset.id, button.dataset.action); });
els.sendWhatsApp.addEventListener("click", finish);
