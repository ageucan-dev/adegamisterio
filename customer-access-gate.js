import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
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
let overlay;
let activeUser;

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

function showLogin() {
  lockPage();
  box(`
    <p class="customer-gate-kicker">Acesso seguro</p>
    <h2>Entre para continuar</h2>
    <p>Use sua conta Google para acessar o Copão na Mão.</p>
    <div class="customer-gate-actions">
      <button id="googleLogin" class="customer-gate-primary" type="button">Entrar com Google</button>
      <p class="customer-gate-status"></p>
    </div>
  `);
  overlay.querySelector("#googleLogin").onclick = async () => {
    try {
      status("Abrindo Google...");
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      status("Não foi possível entrar. Confira os domínios autorizados no Firebase.");
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

lockPage();
onAuthStateChanged(auth, validateUser);
