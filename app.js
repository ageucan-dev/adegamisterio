const ageGate = document.querySelector("#ageGate");
const siteContent = document.querySelector("#siteContent");
const confirmAge = document.querySelector("#confirmAge");
const denyAge = document.querySelector("#denyAge");
const whatsappButton = document.querySelector("#whatsappButton");

const AGE_CONFIRMED_KEY = "adega-misterio-age-confirmed";

function unlockSite() {
  ageGate.classList.add("is-hidden");
  siteContent.classList.remove("is-blurred");
}

function lockSite() {
  siteContent.classList.add("is-blurred");
  ageGate.classList.remove("is-hidden");
}

if (localStorage.getItem(AGE_CONFIRMED_KEY) === "true") {
  unlockSite();
} else {
  lockSite();
}

confirmAge.addEventListener("click", () => {
  localStorage.setItem(AGE_CONFIRMED_KEY, "true");
  unlockSite();
});

denyAge.addEventListener("click", () => {
  document.body.innerHTML = `
    <main class="app-shell">
      <section class="section-card contact-card">
        <p class="eyebrow">Acesso encerrado</p>
        <h1>Conteúdo indisponível.</h1>
        <p>Este ambiente é destinado exclusivamente a pessoas maiores de idade.</p>
      </section>
    </main>
  `;
});

whatsappButton.addEventListener("click", () => {
  alert("Atendimento disponível apenas pelos canais oficiais da Adega Mistério, com confirmação de maioridade.");
});
