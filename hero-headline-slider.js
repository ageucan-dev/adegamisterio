(() => {
  function installHeroHeadlineSlider() {
    const title = document.querySelector(".hero h1");
    if (!title || title.dataset.sliderReady === "true") return;

    const firstMessage = title.textContent.trim() || "Receba seu copão em até 25 minutos.";
    const secondMessage = "Frete Grátis para Barretos-SP";

    title.classList.add("hero-headline-slider");
    title.dataset.sliderReady = "true";
    title.setAttribute("aria-label", `${firstMessage} ${secondMessage}`);
    title.innerHTML = `
      <span class="hero-headline-track" aria-hidden="true">
        <span class="hero-headline-slide">${firstMessage}</span>
        <span class="hero-headline-slide is-short">${secondMessage}</span>
      </span>
    `;
  }

  window.addEventListener("load", installHeroHeadlineSlider);
  installHeroHeadlineSlider();
})();
