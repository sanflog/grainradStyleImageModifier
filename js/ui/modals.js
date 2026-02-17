(function (global) {
  function clampToViewport(element) {
    const rect = element.getBoundingClientRect();
    const left = Math.max(0, Math.min(rect.left, window.innerWidth - rect.width));
    const top = Math.max(0, Math.min(rect.top, window.innerHeight - rect.height));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

  function positionModals({ effectsModal, settingsModal, exportModal }) {
    const margin = 12;
    const right = window.innerWidth - margin;

    settingsModal.style.left = `${right - settingsModal.offsetWidth}px`;
    settingsModal.style.top = `${window.innerHeight - settingsModal.offsetHeight - margin}px`;

    effectsModal.style.left = `${right - effectsModal.offsetWidth}px`;
    effectsModal.style.top = `${window.innerHeight - settingsModal.offsetHeight - effectsModal.offsetHeight - margin - 8}px`;

    exportModal.style.left = `${right - exportModal.offsetWidth - 18}px`;
    exportModal.style.top = `${window.innerHeight - exportModal.offsetHeight - settingsModal.offsetHeight - margin - 22}px`;

    [effectsModal, settingsModal, exportModal].forEach(clampToViewport);
  }

  function makeFloatingModal(modal) {
    const header = modal.querySelector("[data-drag-handle]");
    if (!header) return;

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      const rect = modal.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      dragging = true;
      header.setPointerCapture(event.pointerId);
    });

    header.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      modal.style.left = `${event.clientX - offsetX}px`;
      modal.style.top = `${event.clientY - offsetY}px`;
      clampToViewport(modal);
    });

    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      header.releasePointerCapture(event.pointerId);
    };

    header.addEventListener("pointerup", endDrag);
    header.addEventListener("pointercancel", endDrag);

    const observer = new ResizeObserver(() => {
      clampToViewport(modal);
    });
    observer.observe(modal);
  }

  function clampAll(modals) {
    modals.forEach(clampToViewport);
  }

  global.ImageModifierModals = {
    positionModals,
    makeFloatingModal,
    clampAll
  };
})(window);
