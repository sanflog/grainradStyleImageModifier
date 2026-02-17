(function (global) {
  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("画像ファイルを指定してください。"));
        return;
      }

      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("画像の読み込みに失敗しました。"));
      };
      image.src = url;
    });
  }

  function bindDropZone(element, handlers) {
    const stop = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach((name) => {
      element.addEventListener(name, stop);
    });

    ["dragenter", "dragover"].forEach((name) => {
      element.addEventListener(name, () => handlers.onDragStateChange?.(true));
    });

    ["dragleave", "drop"].forEach((name) => {
      element.addEventListener(name, () => handlers.onDragStateChange?.(false));
    });

    element.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        handlers.onDropFile?.(file);
      }
    });
  }

  global.ImageModifierFile = {
    loadImageFromFile,
    bindDropZone
  };
})(window);
