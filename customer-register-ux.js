function improveRegisterModal() {
  const form = document.querySelector("#gateForm");
  const box = form?.closest(".customer-gate-box");
  if (!form || !box) return;

  box.classList.add("customer-register-box");

  const title = box.querySelector("h2");
  if (title) title.textContent = "Complete seu cadastro";

  const userBox = box.querySelector(".customer-gate-user");
  if (userBox) userBox.textContent = userBox.textContent.replace(/^Conta:/, "E-mail:");
}

const registerObserver = new MutationObserver(improveRegisterModal);
registerObserver.observe(document.body, { childList: true, subtree: true });
improveRegisterModal();
