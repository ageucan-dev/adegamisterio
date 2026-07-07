import { getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const popupFixAuth = getAuth(getApp());
const popupFixProvider = new GoogleAuthProvider();
popupFixProvider.setCustomParameters({ prompt: "select_account" });

function setGateStatus(text) {
  const el = document.querySelector(".customer-gate-status");
  if (el) el.textContent = text || "";
}

function friendlyLoginError(error) {
  if (!error?.code) return "Não foi possível entrar. Tente novamente.";
  if (error.code.includes("unauthorized-domain")) return "Domínio não autorizado no Firebase. Adicione o domínio do Codespace em Authentication > Settings > Authorized domains.";
  if (error.code.includes("operation-not-allowed")) return "Ative o provedor Google em Authentication > Método de login.";
  if (error.code.includes("popup-blocked")) return "O navegador bloqueou o pop-up. Libere pop-ups para este site e tente novamente.";
  if (error.code.includes("popup-closed-by-user")) return "Login cancelado. Toque novamente para continuar.";
  return `Erro no login: ${error.code}`;
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("#googleLogin");
  if (!button) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  try {
    setGateStatus("Abrindo login do Google...");
    await signInWithPopup(popupFixAuth, popupFixProvider);
    setGateStatus("Login realizado. Validando cadastro...");
  } catch (error) {
    console.error(error);
    setGateStatus(friendlyLoginError(error));
  }
}, true);
