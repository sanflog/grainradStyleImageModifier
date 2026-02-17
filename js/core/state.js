(function (global) {
  const { EFFECT_SCHEMA, EFFECT_ORDER } = global.ImageModifierConfig;

  function createInitialState() {
    const defaults = {};
    const params = {};

    for (const id of EFFECT_ORDER) {
      defaults[id] = {};
      params[id] = {};
      const controls = EFFECT_SCHEMA[id] ?? [];
      controls.forEach((control) => {
        defaults[id][control.key] = control.value;
        params[id][control.key] = control.value;
      });
    }

    return {
      sourceImage: null,
      selectedEffect: "ascii",
      defaults,
      params,
      selectedExportFormat: "png"
    };
  }

  function resetEffectParams(state, effectId) {
    const defaults = state.defaults[effectId] ?? {};
    const params = state.params[effectId] ?? {};
    Object.keys(defaults).forEach((key) => {
      params[key] = defaults[key];
    });
  }

  global.ImageModifierState = {
    createInitialState,
    resetEffectParams
  };
})(window);
