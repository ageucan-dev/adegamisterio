import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
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
const CUSTOMER_PROFILE_KEY = "copaoCustomerProfileV1";

let overlay;
let activeUser;
let technicalSessionPending = false;
let restoredApprovedProfile = null;

function lockPage() {
  document.body.classList.add("access-gate-loading");
}

function unlockPage() {
  document.body.classList.remove("access-gate-loading");
  overlay?.remove();
  overlay = null;
}

function readCachedProfile() {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : null;
    if (!profile || typeof profile !== "object") return null;
    if (!String(profile.name || "").trim() || !String(profile.phone || "").trim()) return null;
    return {
      ...profile,
      approved: true,
      status: "approved",
      source: "approved_cache"
    };
  } catch (error) {
    return null;
  }
}

function cacheCustomerProfile(user, data = {}) {
  const profile = {
    uid: user?.uid || data.uid || "",
    name: String(data.name || user?.displayName || "").trim(),
    phone: String(data.phone || "").trim(),
    email: String(data.email || user?.email || "").trim(),
    birthDate: String(data.birthDate || "").trim(),
    approved: data.approved === true,
    status: data.status || (data.approved === true ? "approved" : "pending"),
    provider: data.provider || (user?.isAnonymous ? "anonymous" : "legacy"),
    updatedAt: new Date().toISOString()
  };

  try {
    window.localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    // O cadastro continua funcionando mesmo quando o navegador bloqueia o armazenamento local.
  }

  window.dispatchEvent(new CustomEvent("copao:customer-profile", { detail: profile }));
  if (profile.approved) window.dispatchEvent(new CustomEvent("copao:customer-approved", { detail: { source: profile.provider } }));
  return profile;
}

function box(html, className = "") {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "customer-gate-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<div class="customer-gate-box ${className}">${html}</div>`;
}

function status(text) {
  const element = overlay?.querySelector(".customer-gate-status");
  if (element) element.textContent = text || "";
}

function ageFrom(dateValue) {
  if (!dateValue) return -1;
  const birth = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function onlyNumbers(value, limit) {
  return String(value || "").replace(/\D/g, "").slice(0, limit);
}

function showDenied() {
  lockPage();
  box(`
    <p class="customer-gate-kicker">Acesso não permitido</p>
    <h2>Não foi possível liberar o acesso</h2>
    <p>Este serviço é exclusivo para maiores de 18 anos.</p>
    <p class="customer-age-notice">Entrega realizada somente para maiores de 18 anos. Poderá ser solicitado documento com foto no momento da entrega.</p>
  `, "customer-denied-box");
}

function showTechnicalError(error) {
  console.error(error);
  lockPage();
  const operationDisabled = String(error?.code || "").includes("operation-not-allowed");
  box(`
    <p class="customer-gate-kicker">Ajuste necessário</p>
    <h2>Não foi possível iniciar o cadastro</h2>
    <p>${operationDisabled ? "A autenticação anônima precisa estar ativada no Firebase Authentication." : "Confira sua conexão e tente novamente."}</p>
    <button id="retryGate" class="customer-gate-primary" type="button">Tentar novamente</button>
    <p class="customer-gate-status">${operationDisabled ? "Ative o provedor Anônimo no Firebase para liberar novos cadastros." : "Falha ao conectar com Firebase."}</p>
  `, "customer-error-box");
  overlay.querySelector("#retryGate").onclick = ensureTechnicalSession;
}

function showRegister(user, previousData = {}) {
  lockPage();
  box(`
    <p class="customer-gate-kicker">Cadastro obrigatório</p>
    <h2>Complete seu cadastro</h2>
    <p>Preencha os dados abaixo para validar sua idade e liberar o acesso.</p>
    <form id="gateForm" class="customer-register-form" novalidate>
      <label>Nome completo<input id="gateName" type="text" autocomplete="name" value="${String(previousData.name || user?.displayName || "").replace(/"/g, "&quot;")}" required></label>
      <label>Telefone<input id="gatePhone" type="tel" inputmode="numeric" autocomplete="tel" value="${String(previousData.phone || "").replace(/"/g, "&quot;")}" required></label>
      <label>Data de nascimento<input id="gateBirth" type="date" autocomplete="bday" value="${String(previousData.birthDate || "").replace(/"/g, "&quot;")}" required></label>
      <label class="customer-terms-label"><input id="gateAdult" type="checkbox" required><span>Confirmo que possuo 18 anos ou mais.</span></label>
      <label class="customer-terms-label"><input id="gateTerms" type="checkbox" required><span>Li e aceito os termos de uso e a política de privacidade.</span></label>
      <p class="customer-age-notice">Entrega realizada somente para maiores de 18 anos. Poderá ser solicitado documento com foto no momento da entrega.</p>
      <button class="customer-gate-primary" type="submit">Enviar cadastro</button>
      <p class="customer-gate-status"></p>
    </form>
  `, "customer-register-box");

  overlay.querySelector("#gateForm").onsubmit = async (event) => {
    event.preventDefault();

    const name = overlay.querySelector("#gateName").value.trim();
    const phone = onlyNumbers(overlay.querySelector("#gatePhone").value, 13);
    const birthDate = overlay.querySelector("#gateBirth").value;
    const adultConfirmed = overlay.querySelector("#gateAdult").checked;
    const termsAccepted = overlay.querySelector("#gateTerms").checked;
    const age = ageFrom(birthDate);

    if (name.length < 3) return status("Informe seu nome completo.");
    if (phone.length < 10) return status("Informe um telefone válido.");
    if (!birthDate || age < 0) return status("Informe sua data de nascimento.");
    if (!adultConfirmed) return status("Confirme que você possui 18 anos ou mais.");
    if (!termsAccepted) return status("Aceite os termos e a política de privacidade.");

    const approved = age >= 18;

    try {
      status("Salvando cadastro...");
      await setDoc(doc(db, "customers", user.uid), {
        uid: user.uid,
        name,
        phone,
        birthDate,
        age,
        approved,
        status: approved ? "approved" : "blocked",
        provider: user.isAnonymous ? "anonymous" : "registration",
        adultConfirmed,
        termsAccepted,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      window.dispatchEvent(new CustomEvent("copao:registration-completed", {
        detail: { approved, method: "registration" }
      }));

      if (!approved) return showDenied();
      cacheCustomerProfile(user, { name, phone, birthDate, approved: true, status: "approved", provider: "registration" });
      unlockPage();
    } catch (error) {
      console.error(error);
      status("Erro ao salvar. Confira as regras do Firestore.");
    }
  };
}

async function validateUser(user) {
  activeUser = user;

  if (!user) {
    await ensureTechnicalSession();
    return;
  }

  try {
    lockPage();
    const snap = await getDoc(doc(db, "customers", user.uid));

    if (!snap.exists()) {
      if (restoredApprovedProfile) {
        cacheCustomerProfile(null, restoredApprovedProfile);
        unlockPage();
        return;
      }
      showRegister(user);
      return;
    }

    const data = snap.data();
    if (data.status === "blocked" || data.approved === false) {
      window.dispatchEvent(new CustomEvent("copao:age-gate-stored-result", { detail: { approved: false } }));
      showDenied();
      return;
    }

    if (data.status === "approved" && data.approved === true) {
      cacheCustomerProfile(user, data);
      window.dispatchEvent(new CustomEvent("copao:age-gate-stored-result", { detail: { approved: true } }));
      unlockPage();
      return;
    }

    showRegister(user, data);
  } catch (error) {
    if (restoredApprovedProfile) {
      cacheCustomerProfile(null, restoredApprovedProfile);
      unlockPage();
      return;
    }
    showTechnicalError(error);
  }
}

async function ensureTechnicalSession() {
  if (technicalSessionPending || auth.currentUser) return;
  technicalSessionPending = true;
  lockPage();
  try {
    await signInAnonymously(auth);
  } catch (error) {
    if (restoredApprovedProfile) {
      cacheCustomerProfile(null, restoredApprovedProfile);
      unlockPage();
    } else {
      showTechnicalError(error);
    }
  } finally {
    technicalSessionPending = false;
  }
}

lockPage();
restoredApprovedProfile = readCachedProfile();
if (restoredApprovedProfile) {
  cacheCustomerProfile(null, restoredApprovedProfile);
  unlockPage();
}
onAuthStateChanged(auth, validateUser);
