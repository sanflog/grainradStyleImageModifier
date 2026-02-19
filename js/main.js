(function () {
  const { createInitialState, resetEffectParams } = window.ImageModifierState;
  const { renderEffectsList, renderSettings, renderExportFormats } = window.ImageModifierControls;
  const { bindDropZone, loadImageFromFile } = window.ImageModifierFile;
  const { Renderer } = window.ImageModifierRenderer;

  const stage = document.getElementById("stage");
  const canvas = document.getElementById("previewCanvas");
  const dropOverlay = document.getElementById("dropOverlay");
  const fileInput = document.getElementById("fileInput");

  const effectsModal = document.getElementById("effectsModal");
  const settingsModal = document.getElementById("settingsModal");
  const exportModal = document.getElementById("exportModal");
  const rightDock = document.getElementById("rightDock");
  const dockOverlay = document.getElementById("dockOverlay");
  const exportBackdrop = document.getElementById("exportBackdrop");

  const effectsList = document.getElementById("effectsList");
  const settingsBody = document.getElementById("settingsBody");
  const resetBtn = document.getElementById("resetBtn");
  const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");

  const openExportBtn = document.getElementById("openExportBtn");
  const openExportDockBtn = document.getElementById("openExportDockBtn");
  const openDockBtn = document.getElementById("openDockBtn");
  const closeDockBtn = document.getElementById("closeDockBtn");
  const closeExportBtn = document.getElementById("closeExportBtn");
  const confirmExportBtn = document.getElementById("confirmExportBtn");
  const exportFormats = document.getElementById("exportFormats");
  const exportStatus = document.getElementById("exportStatus");
  const highQualityToggle = document.getElementById("highQualityToggle");

  const state = createInitialState();
  const renderer = new Renderer(canvas);

  let renderQueued = false;
  const mobileDockQuery = window.matchMedia("(max-width: 760px)");

  function isMobileDock() {
    return mobileDockQuery.matches;
  }

  function openDock() {
    rightDock.classList.add("is-open");
    dockOverlay.classList.add("is-open");
  }

  function closeDock() {
    rightDock.classList.remove("is-open");
    dockOverlay.classList.remove("is-open");
  }

  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame((time) => {
      renderQueued = false;
      renderer.render(state.selectedEffect, state.params[state.selectedEffect], time);
    });
  }

  function syncExportButtonLabel() {
    confirmExportBtn.textContent = state.selectedExportFormat === "gif" ? "Export GIF" : "Export PNG";
  }

  function openExportModal() {
    exportModal.classList.remove("hidden");
    exportBackdrop.classList.remove("hidden");
    setExportStatus("");
    syncExportButtonLabel();
  }

  function closeExportModal() {
    exportModal.classList.add("hidden");
    exportBackdrop.classList.add("hidden");
    setExportStatus("");
  }

  function renderPanels() {
    renderEffectsList(effectsList, state, (effectId) => {
      state.selectedEffect = effectId;
      if (state.selectedEffect !== "matrix" && state.selectedExportFormat === "gif") {
        state.selectedExportFormat = "png";
      }
      renderPanels();
      requestRender();
    });

    renderSettings(settingsBody, state, {
      onControlChange: (key, value) => {
        state.params[state.selectedEffect][key] = value;
        requestRender();
      },
      onControlReset: (key) => {
        state.params[state.selectedEffect][key] = state.defaults[state.selectedEffect][key];
        renderPanels();
        requestRender();
      }
    });

    renderExportFormats(exportFormats, state, (formatId) => {
      state.selectedExportFormat = formatId;
      renderPanels();
    });

    syncExportButtonLabel();
  }

  async function applyFile(file) {
    try {
      const image = await loadImageFromFile(file);
      state.sourceImage = image;
      renderer.setSourceImage(image);
      stage.classList.add("has-image");
      requestRender();
    } catch (error) {
      console.error(error);
    }
  }

  function downloadDataURL(dataURL, fileName) {
    const anchor = document.createElement("a");
    anchor.href = dataURL;
    anchor.download = fileName;
    anchor.click();
  }

  function setExportStatus(message) {
    exportStatus.textContent = message;
  }

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await applyFile(file);
    }
    fileInput.value = "";
  });

  function openImportPicker() {
    fileInput.click();
  }

  dropOverlay.addEventListener("click", openImportPicker);
  dropOverlay.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openImportPicker();
    }
  });

  bindDropZone(stage, {
    onDragStateChange: (isOver) => {
      stage.classList.toggle("dragover", isOver);
    },
    onDropFile: async (file) => {
      await applyFile(file);
    }
  });

  resetBtn.addEventListener("click", () => {
    resetEffectParams(state, state.selectedEffect);
    renderPanels();
    requestRender();
  });

  toggleSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.toggle("modal-minimized");
    const minimized = settingsModal.classList.contains("modal-minimized");
    toggleSettingsBtn.textContent = minimized ? "Max" : "Min";
  });

  openExportBtn.addEventListener("click", openExportModal);

  openExportDockBtn.addEventListener("click", openExportModal);

  closeExportBtn.addEventListener("click", closeExportModal);

  openDockBtn.addEventListener("click", () => {
    openDock();
  });

  closeDockBtn.addEventListener("click", () => {
    closeDock();
  });

  dockOverlay.addEventListener("click", () => {
    closeDock();
  });

  exportBackdrop.addEventListener("click", closeExportModal);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !exportModal.classList.contains("hidden")) {
      closeExportModal();
    }
  });

  confirmExportBtn.addEventListener("click", () => {
    if (!renderer.hasImage()) {
      return;
    }

    if (state.selectedExportFormat === "png") {
      setExportStatus("PNG export ready.");
      const dataUrl = renderer.exportPNG({ highQuality: highQualityToggle.checked });
      downloadDataURL(dataUrl, `export-${Date.now()}.png`);
      return;
    }

    if (state.selectedExportFormat === "gif" && state.selectedEffect === "matrix") {
      confirmExportBtn.disabled = true;
      const originalText = confirmExportBtn.textContent;
      confirmExportBtn.textContent = "Encoding...";
      setExportStatus("Preparing frames... 0%");

      renderer
        .exportMatrixGIF(state.params.matrix, {
          frameCount: 36,
          delay: 50,
          onProgress: (progress) => {
            if (progress.phase === "capturing") {
              const percent = Math.round(progress.percent * 100);
              setExportStatus(`Capturing frames ${progress.current}/${progress.total} (${percent}%)`);
              return;
            }
            if (progress.phase === "encoding") {
              const percent = Math.round(progress.percent * 100);
              setExportStatus(`Encoding GIF... ${percent}%`);
            }
          }
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          downloadDataURL(url, `export-${Date.now()}.gif`);
          setTimeout(() => URL.revokeObjectURL(url), 3000);
          setExportStatus("GIF export completed.");
        })
        .catch((error) => {
          console.error(error);
          setExportStatus(error?.message || "GIF export failed.");
        })
        .finally(() => {
          confirmExportBtn.disabled = false;
          confirmExportBtn.textContent = originalText;
          requestRender();
        });
    }
  });

  window.addEventListener("resize", () => {
    if (state.sourceImage) {
      renderer.fitToViewport();
      requestRender();
    }
    if (!isMobileDock()) {
      closeDock();
    }
  });

  function animationLoop(time) {
    if (renderer.hasImage() && state.selectedEffect === "matrix") {
      renderer.render("matrix", state.params.matrix, time);
    }
    requestAnimationFrame(animationLoop);
  }

  renderPanels();
  requestAnimationFrame(animationLoop);
})();
