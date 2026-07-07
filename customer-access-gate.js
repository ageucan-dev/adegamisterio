import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD8gAtsn_9B-OmkJKidFFj8VUU91gG_6Vs",
  authDomain: "copao-na-mao.firebaseapp.com",
  projectId: "copao-na-mao",
  storageBucket: "copao-na-mao.firebasestorage.app",
  messagingSenderId: "122784714195",
  appId: "1:122784714195:web:9313db74fe2fa3078b7326",
  measurementId: "G-DB7HSLZ7W9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

let overlay;
let activeUser;
let redirectChecked = false;

function lockPage() {
  document.body.classList.add("access-gate-loading");
}

function unlockPage() {
  document.body.classList.remove("access-gate-loading");
  if (overlay) overlay.remove();
}

function box(html) {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "customer-gate-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<div class="customer-gate-box">${html}</div>`;
}

function status(text) {
  const el = overlay?.querySelector(".customer-gate-status");
  if (el) el.textContent = text || "";
}

function googleIcon() {
  return `
    <span class="customer-google-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.3C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.4 39.6 16.2 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.4l6.3 5.3C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
      </svg>
    </span>
  `;
}

function ageFrom(dateValue) {
  const birth = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function onlyNumbers(value, limit) {
  return String(value || "").replace(/\D/g, "").slice(0, limit);
}

function authHelpMessage(error) {
  if (!error?.code) return "Não foi possível entrar. Tente novamente.";
  if (error.code.includes("unauthorized-domain")) return "Domínio não autorizado no Firebase. Adicione este domínio em Authentication > Settings > Authorized domains.";
  if (error.code.includes("operation-not-allowed")) return "Login com Google ainda não está ativado no Firebase Authentication.";
  if (error.code.includes("network")) return "Falha de conexão. Confira a internet e tente novamente.";
  return `Erro no login: ${error.code}`;
}

function showLogin() {
  lockPage();
  box(`
    <p class="customer-gate-kicker">Acesso seguro</p>
    <h2>Entre para continuar</h2>
    <p>Use sua conta Google para acessar o Copão na Mão.</p>
    <div class="customer-gate-actions">
      <button id="googleLogin" class="customer-gate-primary customer-google-button" type="button">${googleIcon()}<span>Entrar com Google</span></button>
      <p class="customer-gate-status"></p>
    </div>
  `);
  overlay.querySelector("#googleLogin").onclick = async () => {
    try {
      status("Redirecionando para o Google...");
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error(error);
      status(authHelpMessage(error));
    }
  };
}

function showDenied() {
  lockPage();
  box(`
    <p class="customer-gate-kicker">Acesso encerrado</p>
    <h2>Não foi possível continuar</h2>
    <p>Este acesso não atende aos critérios necessários para navegar neste site.</p>
    <button id="logoutGate" class="customer-gate-danger" type="button">Sair</button>
  `);
  overlay.querySelector("#logoutGate").onclick = async () => {
    await signOut(auth);
    showLogin();
  };
}

function showRegister(user) {
  lockPage();
  box(`
    <p class="customer-gate-kicker">Cadastro obrigatório</p>
    <h2>Complete seu cadastro</h2>
    <p>Preencha seus dados para liberar o acesso.</p>
    <div class="customer-gate-user">Conta: ${user.email || "Google"}</div>
    <form id="gateForm" class="customer-register-form">
      <label>Nome completo<input id="gateName" type="text" value="${user.displayName || ""}" required></label>
      <label>Telefone<input id="gatePhone" type="tel" inputmode="numeric" required></label>
      <label>CPF<input id="gateCpf" type="text" inputmode="numeric" maxlength="14" required></label>
      <label>Data de nascimento<input id="gateBirth" type="date" required></label>
      <label class="customer-terms-label"><input id="gateTerms" type="checkbox" required><span>Confirmo que os dados informados são verdadeiros.</span></label>
      <button class="customer-gate-primary" type="submit">Enviar cadastro</button>
      <button id="changeAccount" class="customer-gate-secondary" type="button">Trocar conta</button>
      <p class="customer-gate-status"></p>
    </form>
  `);

  overlay.querySelector("#changeAccount").onclick = async () => {
    await signOut(auth);
    showLogin();
  };

  overlay.querySelector("#gateForm").onsubmit = async (event) => {
    event.preventDefault();
    const name = overlay.querySelector("#gateName").value.trim();
    const phone = onlyNumbers(overlay.querySelector("#gatePhone").value, 13);
    const cpf = onlyNumbers(overlay.querySelector("#gateCpf").value, 11);
    const birthDate = overlay.querySelector("#gateBirth").value;
    const terms = overlay.querySelector("#gateTerms").checked;
    const age = ageFrom(birthDate);

    if (name.length < 3) return status("Informe seu nome completo.");
    if (phone.length < 10) return status("Informe um telefone válido.");
    if (cpf.length !== 11) return status("Informe um CPF com 11 números.");
    if (!birthDate) return status("Informe sua data de nascimento.");
    if (!terms) return status("Confirme os dados antes de continuar.");

    const approved = age >= 18;
    try {
      status("Salvando cadastro...");
      await setDoc(doc(db, "customers", user.uid), {
        uid: user.uid,
        name,
        phone,
        cpf,
        birthDate,
        age,
        approved,
        status: approved ? "approved" : "blocked",
        email: user.email || "",
        googleName: user.displayName || "",
        provider: "google",
        termsAccepted: terms,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      if (!approved) return showDenied();
      unlockPage();
    } catch (error) {
      console.error(error);
      status("Erro ao salvar. Confira as regras do Firestore.");
    }
  };
}

async function validateUser(user) {
  activeUser = user;
  if (!user) return showLogin();
  try {
    lockPage();
    const snap = await getDoc(doc(db, "customers", user.uid));
    if (!snap.exists()) return showRegister(user);
    const data = snap.data();
    if (data.status === "blocked" || data.approved === false) return showDenied();
    if (data.status === "approved" && data.approved === true) return unlockPage();
    return showRegister(user);
  } catch (error) {
    console.error(error);
    box(`
      <p class="customer-gate-kicker">Ajuste necessário</p>
      <h2>Falha na validação</h2>
      <p>Confira se Authentication, Firestore e domínios autorizados estão corretos.</p>
      <button id="retryGate" class="customer-gate-primary" type="button">Tentar novamente</button>
      <p class="customer-gate-status">Erro ao conectar com Firebase.</p>
    `);
    overlay.querySelector("#retryGate").onclick = () => validateUser(activeUser);
  }
}

async function checkRedirect() {
  try {
    await getRedirectResult(auth);
  } catch (error) {
    console.error(error);
    showLogin();
    status(authHelpMessage(error));
  } finally {
    redirectChecked = true;
  }
}

lockPage();
checkRedirect();
onAuthStateChanged(auth, (user) => {
  if (!redirectChecked) {
    setTimeout(() => validateUser(user), 250);
    return;
  }
  validateUser(user);
});
