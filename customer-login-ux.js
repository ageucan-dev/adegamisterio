(() => {
  function applyLoginUX() {
    const button = document.querySelector("#googleLogin");
    const box = button?.closest(".customer-gate-box");
    if (!button || !box || box.dataset.loginUxReady === "true") return;

    box.dataset.loginUxReady = "true";
    box.classList.add("customer-login-box");

    const title = box.querySelector("h2");
    if (title) title.textContent = "Entre para continuar";

    let description = box.querySelector(".customer-login-description");
    if (!description) {
      const existing = Array.from(box.querySelectorAll("p")).find((item) =>
        !item.classList.contains("customer-gate-status") &&
        !item.classList.contains("customer-gate-kicker")
      );

      description = existing || document.createElement("p");
      description.className = "customer-login-description";

      if (!existing && title) title.insertAdjacentElement("afterend", description);
    }

    description.textContent = "Faça login para acessar o Copão na Mão.";
  }

  window.addEventListener("load", applyLoginUX);
  document.addEventListener("click", () => setTimeout(applyLoginUX, 60), true);
  setTimeout(applyLoginUX, 300);
  setTimeout(applyLoginUX, 1000);
})();
