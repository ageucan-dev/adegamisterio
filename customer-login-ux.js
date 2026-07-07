function improveLoginModal() {
  const button = document.querySelector("#googleLogin");
  const box = button?.closest(".customer-gate-box");
  if (!button || !box) return;

  box.classList.add("customer-login-box");

  const title = box.querySelector("h2");
  if (title) title.textContent = "Entre para continuar";

  let description = box.querySelector(".customer-login-description");
  if (!description) {
    const existing = Array.from(box.querySelectorAll("p")).find((item) => !item.classList.contains("customer-gate-status") && !item.classList.contains("customer-gate-kicker"));
    description = existing || document.createElement("p");
    description.className = "customer-login-description";
    if (!existing && title) title.insertAdjacentElement("afterend", description);
  }
  description.textContent = "Faça login para acessar o Copão na Mão.";
}

const observer = new MutationObserver(improveLoginModal);
observer.observe(document.body, { childList: true, subtree: true });
improveLoginModal();
