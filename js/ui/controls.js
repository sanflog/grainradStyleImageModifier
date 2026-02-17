(function (global) {
  const { EFFECT_ORDER, EFFECT_LABELS, EFFECT_SCHEMA, EXPORT_FORMATS } = global.ImageModifierConfig;

  function formatNumber(value) {
    return Number.isInteger(value) ? `${value}` : Number(value).toFixed(1);
  }

  function renderEffectsList(container, state, onChange) {
    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "effect-select-wrap";

    const label = document.createElement("div");
    label.textContent = "Effect";

    const list = document.createElement("div");
    list.className = "effect-radio-list";

    EFFECT_ORDER.forEach((effectId) => {
      const item = document.createElement("label");
      item.className = "effect-item";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "effect";
      radio.value = effectId;
      radio.checked = state.selectedEffect === effectId;
      radio.addEventListener("change", () => {
        if (radio.checked) {
          onChange(effectId);
        }
      });

      const text = document.createElement("span");
      text.textContent = EFFECT_LABELS[effectId];

      item.append(radio, text);
      list.appendChild(item);
    });

    wrap.append(label, list);
    container.appendChild(wrap);
  }

  function renderSettings(container, state, handlers) {
    container.innerHTML = "";

    const controls = EFFECT_SCHEMA[state.selectedEffect] ?? [];
    if (!controls.length) {
      const empty = document.createElement("div");
      empty.className = "section-title";
      empty.textContent = "No specific settings";
      container.appendChild(empty);
      return;
    }

    let section = "";
    controls.forEach((control) => {
      if (control.section !== section) {
        section = control.section;
        const title = document.createElement("div");
        title.className = "section-title";
        title.textContent = section;
        container.appendChild(title);
      }

      container.appendChild(createControl(control, state, handlers));
    });
  }

  function createControl(control, state, handlers) {
    const wrapper = document.createElement("div");
    wrapper.className = "control";
    const currentValue = state.params[state.selectedEffect][control.key];

    if (control.type === "range") {
      const row = document.createElement("div");
      row.className = "row";

      const label = document.createElement("label");
      label.textContent = control.label;

      const value = document.createElement("span");
      value.className = "value";
      value.textContent = formatNumber(currentValue);

      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "mini-reset";
      reset.textContent = "reset";
      reset.addEventListener("click", () => handlers.onControlReset(control.key));

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = control.min;
      slider.max = control.max;
      slider.step = control.step;
      slider.value = currentValue;
      slider.addEventListener("input", () => {
        const valueToSet = Number(slider.value);
        handlers.onControlChange(control.key, valueToSet);
        value.textContent = formatNumber(valueToSet);
      });

      row.append(label, value, reset);
      wrapper.append(row, slider);
      return wrapper;
    }

    if (control.type === "select") {
      const label = document.createElement("label");
      label.textContent = control.label;

      const select = document.createElement("select");
      control.options.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
      });
      select.value = currentValue;
      select.addEventListener("change", () => handlers.onControlChange(control.key, select.value));

      wrapper.append(label, select);
      return wrapper;
    }

    if (control.type === "color") {
      const label = document.createElement("label");
      label.textContent = control.label;

      const colorWrap = document.createElement("div");
      colorWrap.className = "color-wrap";

      const picker = document.createElement("input");
      picker.type = "color";
      picker.value = currentValue;

      const input = document.createElement("input");
      input.type = "text";
      input.value = currentValue;

      picker.addEventListener("input", () => {
        handlers.onControlChange(control.key, picker.value);
        input.value = picker.value;
      });

      input.addEventListener("change", () => {
        const fallback = state.defaults[state.selectedEffect][control.key];
        const next = /^#[0-9A-Fa-f]{6}$/.test(input.value) ? input.value : fallback;
        handlers.onControlChange(control.key, next);
        picker.value = next;
        input.value = next;
      });

      colorWrap.append(picker, input);
      wrapper.append(label, colorWrap);
      return wrapper;
    }

    if (control.type === "check") {
      const row = document.createElement("label");
      row.className = "check-row";

      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = Boolean(currentValue);
      check.addEventListener("change", () => handlers.onControlChange(control.key, check.checked));

      const text = document.createElement("span");
      text.textContent = control.label;

      row.append(check, text);
      wrapper.appendChild(row);
    }

    return wrapper;
  }

  function renderExportFormats(container, state, onSelect) {
    container.innerHTML = "";
    const isFileProtocol = global.location?.protocol === "file:";
    EXPORT_FORMATS.forEach((format) => {
      const isEnabled =
        format.id === "png" ||
        (format.id === "gif" && state.selectedEffect === "matrix" && !isFileProtocol);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "export-card";
      button.textContent = format.label;

      const ext = document.createElement("small");
      ext.textContent = format.ext;
      button.appendChild(ext);

      if (!isEnabled) {
        button.classList.add("disabled");
        button.disabled = true;
        if (format.id === "gif" && isFileProtocol) {
          button.title = "GIF export is not available on file://. Open via http(s).";
        }
      } else {
        button.addEventListener("click", () => onSelect(format.id));
      }

      if (state.selectedExportFormat === format.id) {
        button.classList.add("active");
      }

      container.appendChild(button);
    });
  }

  global.ImageModifierControls = {
    renderEffectsList,
    renderSettings,
    renderExportFormats
  };
})(window);
