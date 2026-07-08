(() => {
  function removeOldNotice() {
    document.querySelectorAll(".more-options-notice").forEach((notice) => notice.remove());
  }

  function hideBuilderOnProductChange() {
    const builder = document.querySelector("#personalizacao");
    if (!builder) return;

    document.addEventListener("click", (event) => {
      const button = event.target.closest(".choose-product");
      if (!button) return;
      removeOldNotice();
    }, true);
  }

  function keepNoticeRemoved() {
    if (!document.body || window.__copaoCarouselNoticeObserver) return;

    const observer = new MutationObserver(removeOldNotice);
    observer.observe(document.body, { childList: true, subtree: true });
    window.__copaoCarouselNoticeObserver = observer;
  }

  removeOldNotice();
  hideBuilderOnProductChange();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      removeOldNotice();
      keepNoticeRemoved();
    }, { once: true });
  } else {
    keepNoticeRemoved();
  }

  window.addEventListener("load", removeOldNotice);
})();
