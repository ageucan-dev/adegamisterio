(() => {
  const ADDRESS = "Rua Capitão Zeca de Paula, 798 - Franca/SP";
  const MAP_QUERY = encodeURIComponent(ADDRESS);

  function loadMapIframe() {
    const mapWrap = document.querySelector(".location-map-wrap");
    if (!mapWrap || mapWrap.querySelector("iframe")) return;

    const iframe = document.createElement("iframe");
    iframe.title = "Mapa - Copão na Mão";
    iframe.loading = "eager";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.src = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`;

    mapWrap.appendChild(iframe);
  }

  function installLocationMap() {
    const finishCard = document.querySelector("#finalizar");
    if (!finishCard || document.querySelector("#localizacao")) return;

    const section = document.createElement("section");
    section.id = "localizacao";
    section.className = "section-card location-card";
    section.innerHTML = `
      <p class="eyebrow">Localização</p>
      <h2>Onde estamos</h2>
      <p class="location-address">📍 ${ADDRESS}</p>
      <div class="location-map-wrap" aria-label="Mapa da localização do Copão na Mão">
        <div class="location-map-placeholder">Carregando mapa...</div>
      </div>
      <p class="location-warning"><strong>Atenção:</strong> somos uma operação digital. Este endereço não é ponto físico para retirada de pedidos.</p>
    `;

    finishCard.insertAdjacentElement("afterend", section);
    loadMapIframe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installLocationMap, { once: true });
  } else {
    installLocationMap();
  }
})();