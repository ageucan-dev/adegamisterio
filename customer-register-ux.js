(() => {
  function applyRegisterUX() {
    const form = document.querySelector("#gateForm");
    const box = form?.closest(".customer-gate-box");
    if (!form || !box || box.dataset.registerUxReady === "true") return;

    box.dataset.registerUxReady = "true";
    box.classList.add("customer-register-box");

    const title = box.querySelector("h2");
    if (title) title.textContent = "Complete seu cadastro";

    const userBox = box.querySelector(".customer-gate-user");
    if (userBox) {
      userBox.textContent = userBox.textContent.replace(/^Conta:/, "E-mail:");
    }
  }

  window.addEventListener("load", applyRegisterUX);
  document.addEventListener("click", () => setTimeout(applyRegisterUX, 60), true);
  setTimeout(applyRegisterUX, 300);
  setTimeout(applyRegisterUX, 1000);
})();
