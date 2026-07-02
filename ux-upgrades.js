(() => {
  const spellingMap = {
    "Citrico": "Cítrico",
    "Maca Verde": "Maçã Verde",
    "Medio": "Médio",
    "Energetico": "Energético",
    "Gelo de Agua de Coco": "Gelo de Água de Coco",
    "Red Bull Morango e Pessego": "Red Bull Morango e Pêssego",
    "Seu carrinho ainda esta vazio.": "Seu carrinho ainda está vazio.",
    "Observacoes": "Observações",
    "Referencia": "Referência",
    "Numero": "Número",
    "Finalizacao": "Finalização",
    "Personalizacao": "Personalização"
  };

  function fixText(value = "") {
    return spellingMap[value] || value;
  }

  function getCartQuantity() {
    try {
      if (typeof state !== "undefined" && Array.isArray(state.cart)) {
        return state.cart.reduce((total, item) => total + item.quantity, 0);
      }
    } catch (error) {
      return 0;
    }
    return 0;
  }

  function fixVisibleText() {
    document.querySelectorAll("span, small, legend, h2, p, button, label, div").forEach((node) => {
      if (node.children.length) return;
      const value = node.textContent.trim();
      if (spellingMap[value]) node.textContent = spellingMap[value];
    });
  }

  fixVisibleText();

  const observer = new MutationObserver(() => fixVisibleText());
  observer.observe(document.body, { childList: true, subtree: true });

  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.textContent = "✅ Produto adicionado";
  document.body.appendChild(toast);

  let toastTimer;
  function showCartToast() {
    clearTimeout(toastTimer);
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  ["#addToCart", "#buyNow"].forEach((selector) => {
    const button = document.querySelector(selector);
    button?.addEventListener("click", () => {
      const before = getCartQuantity();
      setTimeout(() => {
        const after = getCartQuantity();
        if (after > before) showCartToast();
      }, 30);
    }, true);
  });

  document.querySelectorAll(".custom-form fieldset").forEach((fieldset) => {
    const legend = fieldset.querySelector("legend");
    if (!legend || legend.querySelector(".step-toggle")) return;

    const label = document.createElement("span");
    label.textContent = fixText(legend.textContent.trim());

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "step-toggle";
    toggle.setAttribute("aria-label", "Abrir etapa");
    toggle.textContent = "+";

    legend.textContent = "";
    legend.append(label, toggle);

    legend.addEventListener("click", () => {
      if (!fieldset.classList.contains("is-collapsed")) return;
      fieldset.classList.remove("is-collapsed");
    });
  });

  document.querySelectorAll('.custom-form input[type="radio"]').forEach((input) => {
    input.addEventListener("change", () => {
      const fieldset = input.closest("fieldset");
      fieldset?.classList.add("is-collapsed");
    });
  });

  function safeMoney(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function label(item) {
    return fixText(item?.label || "");
  }

  function getCartItems() {
    try {
      if (typeof state !== "undefined" && Array.isArray(state.cart)) return state.cart;
    } catch (error) {
      return [];
    }
    return [];
  }

  function getFormattedWhatsAppMessage() {
    if (typeof cartTotals !== "function" || typeof deliveryData !== "function") {
      return "Olá, Adega Mistério! Quero finalizar meu pedido.";
    }

    const totals = cartTotals();
    const data = deliveryData();
    const cart = getCartItems();

    const items = cart.map((item, index) => {
      return [
        `*${index + 1}. ${item.product} - ${label(item.size)}*`,
        `• Base: ${label(item.base)}`,
        `• Intensidade: ${fixText(item.intensity)}`,
        `• Energético: ${label(item.energy)}`,
        `• Gelo: ${label(item.ice)}`,
        `• Quantidade: ${item.quantity}`,
        `• Valor unitário: ${safeMoney(item.unitPrice)}`,
        `• Subtotal: ${safeMoney(item.unitPrice * item.quantity)}`,
        item.notes ? `• Observações: ${item.notes}` : ""
      ].filter(Boolean).join("\n");
    }).join("\n\n");

    return [
      "*🍸 ADEGA MISTÉRIO | NOVO PEDIDO*",
      "_Ficha organizada para preparo e conferência._",
      "",
      "*🛒 ITENS DO CARRINHO*",
      items,
      "",
      "*💰 RESUMO DO PEDIDO*",
      `• Subtotal: ${safeMoney(totals.subtotal)}`,
      `• Desconto progressivo: -${safeMoney(totals.discount)}`,
      `• *Total: ${safeMoney(totals.total)}*`,
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

  const finishButton = document.querySelector("#sendWhatsApp");
  finishButton?.addEventListener("click", (event) => {
    if (typeof validateBeforeSend !== "function") return;

    const error = validateBeforeSend();
    if (error) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const message = encodeURIComponent(getFormattedWhatsAppMessage());
    window.open(`https://wa.me/5516996396543?text=${message}`, "_blank", "noopener,noreferrer");
  }, true);
})();
