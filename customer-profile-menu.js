import { getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const auth = getAuth(getApp());
const db = getFirestore(getApp());
const PROFILE_KEY = "copaoCustomerProfileV1";

let widget;
let currentData = null;
let scrollTimer;

function icon() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="2"/><path d="M4.8 20.2c.8-4 3.4-6 7.2-6s6.4 2 7.2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function value(text) {
  return text || "Não informado";
}

function readCachedProfile() {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === "object" ? data : null;
  } catch (error) {
    return null;
  }
}

function createWidget() {
  if (widget) return widget;
  widget = document.createElement("div");
  widget.className = "customer-profile-widget";
  widget.innerHTML = `
    <button class="customer-profile-button" type="button" aria-label="Ver perfil">${icon()}</button>
    <div class="customer-profile-panel" role="dialog" aria-label="Informações pessoais">
      <h3>Meu cadastro</h3>
      <p>Dados salvos para validação. Alterações devem ser solicitadas ao atendimento.</p>
      <div class="customer-profile-list"></div>
      <button class="customer-profile-logout" type="button">Fechar perfil</button>
    </div>
  `;
  document.body.appendChild(widget);

  widget.querySelector(".customer-profile-button").addEventListener("click", () => {
    widget.classList.toggle("is-open");
    renderData();
  });

  widget.querySelector(".customer-profile-logout").addEventListener("click", async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      await signOut(auth);
      window.location.reload();
      return;
    }
    widget.classList.remove("is-open");
  });

  document.addEventListener("click", (event) => {
    if (widget && !widget.contains(event.target)) widget.classList.remove("is-open");
  });

  return widget;
}

function renderData() {
  if (!widget) return;
  const list = widget.querySelector(".customer-profile-list");
  const data = currentData || {};
  const emailRow = data.email
    ? `<div class="customer-profile-item"><small>E-mail</small><strong>${value(data.email)}</strong></div>`
    : "";

  list.innerHTML = `
    <div class="customer-profile-item"><small>Nome</small><strong>${value(data.name)}</strong></div>
    ${emailRow}
    <div class="customer-profile-item"><small>Telefone</small><strong>${value(data.phone)}</strong></div>
    <div class="customer-profile-item"><small>Nascimento</small><strong>${value(data.birthDate)}</strong></div>
    <div class="customer-profile-item"><small>Status</small><strong>${data.approved ? "Aprovado" : "Pendente"}</strong></div>
  `;

  const action = widget.querySelector(".customer-profile-logout");
  if (action) action.textContent = auth.currentUser && !auth.currentUser.isAnonymous ? "Sair da conta" : "Fechar perfil";
}

function shouldShowAtTop() {
  return window.scrollY <= 8 && !document.body.classList.contains("access-gate-loading");
}

function updateVisibility() {
  if (!widget || !currentData?.approved) return;
  widget.classList.toggle("is-visible", shouldShowAtTop());
  if (!shouldShowAtTop()) widget.classList.remove("is-open");
}

function handleScroll() {
  if (!widget) return;
  widget.classList.remove("is-visible", "is-open");
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(updateVisibility, 180);
}

function useProfile(data) {
  if (!data || data.approved !== true) return;
  currentData = data;
  createWidget();
  renderData();
  updateVisibility();
}

async function loadCustomer(user) {
  const cached = readCachedProfile();
  if (cached?.approved) useProfile(cached);
  if (!user) return;

  try {
    const snap = await getDoc(doc(db, "customers", user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status !== "approved" || data.approved !== true) return;
    useProfile(data);
  } catch (error) {
    if (!cached?.approved) console.error(error);
  }
}

window.addEventListener("copao:customer-profile", (event) => useProfile(event.detail));
window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", updateVisibility);
onAuthStateChanged(auth, loadCustomer);
setInterval(updateVisibility, 1200);

const cached = readCachedProfile();
if (cached?.approved) useProfile(cached);
