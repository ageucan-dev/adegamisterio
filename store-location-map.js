(() => {
  const ADDRESS = "Rua Capitão Zeca de Paula, 798 - Franca/SP";
  const MAP_QUERY = encodeURIComponent(ADDRESS);

  function installLocationStyles() {
    if (document.querySelector("#store-location-map-style")) return;

    const style = document.createElement("style");
    style.id = "store-location-map-style";
    style.textContent = `
      .location-card {
        overflow: hidden !important;
      }

      .location-map-wrap {
        position: relative !important;
        width: 100% !important;
        height: 230px !important;
        margin-top: 16px !important;
        overflow: hidden !important;
        border: 1px solid rgba(11, 29, 58, 0.1) !important;
        border-radius: 24px !important;
        background: linear-gradient(135deg, #fff8d9, #ffffff) !important;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45) !important;
      }

      .location-map-placeholder {
        position: absolute !important;
        inset: 0 !important;
        display: grid !important;
        place-items: center !important;
        padding: 18px !important;
        color: #0b1d3a !important;
        font-size: 0.92rem !important;
        font-weight: 900 !important;
        text-align: center !important;
      }

      .location-map-wrap iframe {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        border: 0 !important;
      }

      .location-address {
        margin: 14px 0 0 !important;
        color: #0b1d3a !important;
        font-size: 0.95rem !important;
        font-weight: 900 !important;
        line-height: 1.35 !important;
      }

      .location-warning {
        margin: 12px 0 0 !important;
        padding: 13px 14px !important;
        border: 1px solid rgba(255, 122, 0, 0.28) !important;
        border-radius: 18px !important;
        background: rgba(255, 244, 204, 0.72) !important;
        color: #5c6a80 !important;
        font-size: 0.88rem !important;
        font-weight: 800 !important;
        line-height: 1.35 !important;
      }

      .location-warning strong {
        color: #0b1d3a !important;
        font-weight: 950 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function installCompactOptionStyles() {
    if (document.querySelector("#compact-option-card-style")) return;

    const style = document.createElement("style");
    style.id = "compact-option-card-style";
    style.textContent = `
      .option-grid {
        align-items: start !important;
      }

      .option-card.option-card--compact {
        min-height: 84px !important;
        padding-top: 18px !important;
        padding-bottom: 18px !important;
        justify-content: center !important;
        gap: 0 !important;
      }

      .option-card.option-card--compact span {
        margin: 0 !important;
      }

      .option-additional {
        margin-top: 6px !important;
        color: #0b1d3a !important;
        font-size: 0.95rem !important;
        font-weight: 700 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function markCompactOptionCards() {
    document.querySelectorAll(".option-card").forEach((card) => {
      const hasVisiblePrice = card.querySelector("small");
      card.classList.toggle("option-card--compact", !hasVisiblePrice);
    });
  }

  function loadMapIframe() {
    const mapWrap = document.querySelector(".location-map-wrap");
    if (!mapWrap || mapWrap.querySelector("iframe")) return;

    const iframe = document.createElement("iframe");
    iframe.title = "Mapa - Copão na Mão";
    iframe.loading = "lazy";
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
    window.setTimeout(loadMapIframe, 1200);
  }

  function init() {
    installLocationStyles();
    installCompactOptionStyles();
    installLocationMap();
    markCompactOptionCards();
    window.setTimeout(markCompactOptionCards, 300);
    window.setTimeout(markCompactOptionCards, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
