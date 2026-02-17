(function (global) {
  const EFFECT_ORDER = [
    "ascii",
    "dithering",
    "halftone",
    "matrix",
    "dots",
    "contour",
    "pixelsort",
    "blockify",
    "threshold",
    "edge",
    "crosshatch",
    "wavelines",
    "noisefield",
    "voronoi",
    "vhs"
  ];

  const EFFECT_LABELS = {
    ascii: "ASCII",
    dithering: "Dithering",
    halftone: "Halftone",
    matrix: "Matrix Rain",
    dots: "Dots",
    contour: "Contour",
    pixelsort: "Pixel Sort",
    blockify: "Blockify",
    threshold: "Threshold",
    edge: "Edge Detection",
    crosshatch: "Crosshatch",
    wavelines: "Wave Lines",
    noisefield: "Noise Field",
    voronoi: "Voronoi",
    vhs: "VHS"
  };

  const CHAR_SETS = {
    STANDARD: " .:-=+*#%@",
    BLOCKS: " .,:;irsXA253hMHGS#9B&@",
    NUMERIC: "0123456789",
    SYMBOL: "<>/\\{}[]!?+-=~",
    HIRAGANA: "　くるしいくらいいたいしぬかなしい",
    KANJI: "　鬱彙鬱欝魑魅魍魎蠱麒麟饕餮贔屓齟齬蹉跌曖昧朦朧薔薇憂鬱慟哭煩悶懊悩逡巡躊躇矜持僥倖邂逅漆黒玲瓏驟雨晦冥艱難晦渋",
    JAPANESE_MIX: "　くるしいくらいいたいしぬかなしい・鬱彙魑魅魍魎蠱麒麟饕餮贔屓齟齬蹉跌曖昧朦朧薔薇憂鬱慟哭煩悶懊悩逡巡躊躇矜持僥倖邂逅"
  };

  const EFFECT_SCHEMA = {
    ascii: [
      { key: "scale", label: "Scale", type: "range", min: 0.4, max: 4, step: 0.1, value: 1, section: "ASCII" },
      { key: "spacing", label: "Spacing", type: "range", min: 0, max: 1, step: 0.1, value: 0.6, section: "ASCII" },
      { key: "outputWidth", label: "Output Width", type: "range", min: 64, max: 240, step: 1, value: 120, section: "ASCII" },
      { key: "characterSet", label: "Character Set", type: "select", value: "STANDARD", options: ["STANDARD", "BLOCKS", "NUMERIC", "SYMBOL", "HIRAGANA", "KANJI", "JAPANESE_MIX"], section: "ASCII" },
      { key: "brightness", label: "Brightness", type: "range", min: -100, max: 100, step: 1, value: 0, section: "Adjustments" },
      { key: "contrast", label: "Contrast", type: "range", min: -100, max: 100, step: 1, value: 0, section: "Adjustments" },
      { key: "saturation", label: "Saturation", type: "range", min: -100, max: 100, step: 1, value: 0, section: "Adjustments" },
      { key: "hueRotation", label: "Hue Rotation", type: "range", min: -180, max: 180, step: 1, value: 0, section: "Adjustments" },
      { key: "sharpness", label: "Sharpness", type: "range", min: 0, max: 4, step: 0.1, value: 0, section: "Adjustments" },
      { key: "gamma", label: "Gamma", type: "range", min: 0.3, max: 2, step: 0.1, value: 1, section: "Adjustments" },
      { key: "mode", label: "Mode", type: "select", value: "Original", options: ["Original", "Monochrome"], section: "Color" },
      { key: "backgroundIntensity", label: "Background Intensity", type: "range", min: 0, max: 2, step: 0.1, value: 1.3, section: "Color" },
      { key: "invert", label: "Invert", type: "check", value: false, section: "Processing" },
      { key: "brightnessMap", label: "Brightness Map", type: "range", min: 0.4, max: 2.2, step: 0.1, value: 1, section: "Processing" }
    ],
    matrix: [
      { key: "characterSet", label: "Character Set", type: "select", value: "BLOCKS", options: ["BLOCKS", "NUMERIC", "SYMBOL", "STANDARD"], section: "Matrix Rain" },
      { key: "cellSize", label: "Cell Size", type: "range", min: 8, max: 30, step: 1, value: 16, section: "Matrix Rain" },
      { key: "spacing", label: "Spacing", type: "range", min: 0, max: 1, step: 0.1, value: 0, section: "Matrix Rain" },
      { key: "speed", label: "Speed", type: "range", min: 0.2, max: 2, step: 0.1, value: 0.8, section: "Matrix Rain" },
      { key: "trailLength", label: "Trail Length", type: "range", min: 6, max: 50, step: 1, value: 30, section: "Matrix Rain" },
      { key: "direction", label: "Direction", type: "select", value: "Down", options: ["Down", "Up"], section: "Matrix Rain" },
      { key: "glow", label: "Glow", type: "range", min: 0, max: 2.4, step: 0.1, value: 1.4, section: "Matrix Rain" },
      { key: "bgOpacity", label: "BG Opacity", type: "range", min: 0.05, max: 0.95, step: 0.05, value: 0.4, section: "Matrix Rain" },
      { key: "brightness", label: "Brightness", type: "range", min: 40, max: 160, step: 1, value: 100, section: "Adjustments" },
      { key: "contrast", label: "Contrast", type: "range", min: 40, max: 180, step: 1, value: 100, section: "Adjustments" },
      { key: "threshold", label: "Threshold", type: "range", min: 0, max: 1, step: 0.05, value: 0.2, section: "Adjustments" },
      { key: "rainColor", label: "Rain Color", type: "color", value: "#e32400", section: "Color" }
    ],
    dots: [
      { key: "shape", label: "Shape", type: "select", value: "Circle", options: ["Circle", "Square"], section: "Dots" },
      { key: "gridType", label: "Grid Type", type: "select", value: "Square Grid", options: ["Square Grid", "Offset Grid"], section: "Dots" },
      { key: "size", label: "Size", type: "range", min: 0.4, max: 2.2, step: 0.1, value: 1.3, section: "Dots" },
      { key: "spacing", label: "Spacing", type: "range", min: 0.4, max: 2, step: 0.1, value: 1, section: "Dots" },
      { key: "invert", label: "Invert", type: "check", value: false, section: "Dots" }
    ],
    edge: [
      { key: "strength", label: "Strength", type: "range", min: 0.5, max: 3, step: 0.1, value: 1.4, section: "Edge Detection" },
      { key: "threshold", label: "Threshold", type: "range", min: 0, max: 255, step: 1, value: 70, section: "Edge Detection" },
      { key: "lineColor", label: "Line Color", type: "color", value: "#41ff1f", section: "Color" }
    ],
    threshold: [{ key: "level", label: "Threshold", type: "range", min: 0, max: 255, step: 1, value: 120, section: "Threshold" }],
    dithering: [{ key: "contrast", label: "Contrast", type: "range", min: 40, max: 190, step: 1, value: 120, section: "Dithering" }],
    halftone: [
      { key: "cell", label: "Cell Size", type: "range", min: 3, max: 16, step: 1, value: 8, section: "Halftone" },
      { key: "shape", label: "Shape", type: "select", value: "Circle", options: ["Circle", "Square"], section: "Halftone" }
    ],
    blockify: [{ key: "block", label: "Block Size", type: "range", min: 4, max: 36, step: 1, value: 12, section: "Blockify" }],
    pixelsort: [{ key: "threshold", label: "Sort Threshold", type: "range", min: 0, max: 255, step: 1, value: 115, section: "Pixel Sort" }],
    crosshatch: [{ key: "density", label: "Density", type: "range", min: 4, max: 20, step: 1, value: 9, section: "Crosshatch" }],
    wavelines: [
      { key: "amp", label: "Amplitude", type: "range", min: 1, max: 35, step: 1, value: 10, section: "Wave Lines" },
      { key: "freq", label: "Frequency", type: "range", min: 0.002, max: 0.05, step: 0.001, value: 0.012, section: "Wave Lines" }
    ],
    noisefield: [{ key: "amount", label: "Noise", type: "range", min: 0, max: 90, step: 1, value: 26, section: "Noise Field" }],
    voronoi: [{ key: "points", label: "Points", type: "range", min: 120, max: 2400, step: 20, value: 800, section: "Voronoi" }],
    contour: [],
    vhs: [
      { key: "shift", label: "RGB Shift", type: "range", min: 0, max: 20, step: 1, value: 7, section: "VHS" },
      { key: "scan", label: "Scanline", type: "range", min: 0, max: 0.9, step: 0.02, value: 0.28, section: "VHS" },
      { key: "jitter", label: "Jitter", type: "range", min: 0, max: 20, step: 1, value: 5, section: "VHS" }
    ]
  };

  const EXPORT_FORMATS = [
    { id: "png", label: "PNG", ext: ".png", enabled: true },
    { id: "gif", label: "GIF", ext: ".gif", enabled: true }
  ];

  global.ImageModifierConfig = {
    EFFECT_ORDER,
    EFFECT_LABELS,
    CHAR_SETS,
    EFFECT_SCHEMA,
    EXPORT_FORMATS
  };
})(window);
