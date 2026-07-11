(() => {
  const checks = [];

  function add(name, passed, detail = "") {
    checks.push({ name, passed: !!passed, detail });
  }

  function exists(selector) {
    return document.querySelector(selector);
  }

  function count(selector) {
    return document.querySelectorAll(selector).length;
  }

  function textIncludes(value) {
    return document.body?.textContent?.includes(value);
  }

  add("Hero existe", exists("#inicio"));
  add("Produtos existe", exists("#produto"));
  add("Personalização existe", exists("#personalizacao"));
  add("Carrinho existe", exists("#carrinho"));
  add("Finalizar existe", exists("#finalizar"));

  add("Botão Montar meu copo da hero aponta para Produtos", exists('#inicio a[href="#produto"]'));
  add("Botão Ver carrinho da hero aponta para Carrinho", exists('#inicio a[href="#carrinho"]'));
  add("Existem botões Montar copo dos produtos", count(".choose-product") >= 2, `${count(".choose-product")} encontrados`);
  add("Existem dots do carrossel", count("[data-carousel-dot]") >= 2, `${count("[data-carousel-dot]")} encontrados`);

  add("Nome Ether Mix aparece", textIncludes("Ether Mix"));
  add("Nome Ballan Mix aparece", textIncludes("Ballan Mix"));
  add("Nome antigo Ethernity Mix não aparece", !textIncludes("Ethernity Mix"));
  add("Nome antigo Gold Mix não aparece", !textIncludes("Gold Mix"));

  add("Campo tamanho existe", exists("#sizeOptions"));
  add("Campo base existe", exists("#baseOptions"));
  add("Campo energético existe", exists("#energyOptions"));
  add("Campo gelo existe", exists("#iceOptions"));
  add("Botão adicionar ao carrinho existe", exists("#addToCart"));
  add("Botão adicionar e finalizar existe", exists("#buyNow"));

  add("Barra inferior existe", exists(".bottom-bar"));
  add("Total inferior existe", exists("#bottomTotalValue"));
  add("Link inferior do carrinho existe", exists('.bottom-cart-link[href="#carrinho"]'));
  add("Link inferior finalizar existe", exists('.bottom-finish-link[href="#finalizar"]'));

  add("Função cartTotals disponível", typeof window.cartTotals === "function");
  add("Função validateBeforeSend disponível", typeof window.validateBeforeSend === "function");
  add("Função renderCart disponível", typeof window.renderCart === "function");
  add("Estado global disponível", !!window.state && Array.isArray(window.state.cart));
  add("Catálogo global disponível", !!window.products && !!window.products["ethernity-mix"] && !!window.products["mix-gold"]);
  add("Catálogo usa Ether Mix", window.products?.["ethernity-mix"]?.name === "Ether Mix");
  add("Catálogo usa Ballan Mix", window.products?.["mix-gold"]?.name === "Ballan Mix");

  const failed = checks.filter((item) => !item.passed);
  const passed = checks.filter((item) => item.passed);

  console.table(checks.map((item) => ({
    status: item.passed ? "✅ OK" : "❌ FALHOU",
    teste: item.name,
    detalhe: item.detail
  })));

  if (failed.length) {
    console.warn(`QA Smoke Check: ${failed.length} falha(s), ${passed.length} ok.`);
    return false;
  }

  console.info(`QA Smoke Check: tudo certo — ${passed.length} testes ok.`);
  return true;
})();