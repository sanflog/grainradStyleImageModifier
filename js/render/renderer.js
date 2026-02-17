(function (global) {
  const { CHAR_SETS } = global.ImageModifierConfig;
  const ASCII_FONT_STACK = "\"IBM Plex Mono\", \"Noto Sans JP\", \"BIZ UDゴシック\", \"Yu Gothic UI\", \"Meiryo\", monospace";
  const WIDE_CHARSETS = new Set(["HIRAGANA", "KANJI", "JAPANESE_MIX"]);

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function brightness(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function applyBrightnessContrast(value, brightnessOffset, contrastPercent) {
  const shifted = value + brightnessOffset;
  const c = (contrastPercent - 100) / 100;
  const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));
  return clamp(factor * (shifted - 128) + 128);
}

function seededRandom(seed) {
  let current = seed >>> 0;
  return () => {
    current = (1664525 * current + 1013904223) >>> 0;
    return current / 4294967296;
  };
}

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });

    this.base = document.createElement("canvas");
    this.baseCtx = this.base.getContext("2d", { willReadFrequently: true });

    this.buffer = document.createElement("canvas");
    this.bufferCtx = this.buffer.getContext("2d", { willReadFrequently: true });

    this.sourceImage = null;
    this.matrixDrops = [];
    this.frameCount = 0;
    this.voronoiCache = null;
  }

  hasImage() {
    return Boolean(this.sourceImage);
  }

  setSourceImage(image) {
    this.sourceImage = image;
    this.fitToViewport();
    this.resetDynamicState();
  }

  fitToViewport() {
    if (!this.sourceImage) return;

    const margin = 18;
    const rightDock = document.querySelector(".right-dock");
    const dockWidth = rightDock && window.innerWidth > 760 ? rightDock.offsetWidth + 20 : 0;
    const maxWidth = Math.max(320, window.innerWidth - margin - dockWidth);
    const maxHeight = Math.max(220, window.innerHeight - margin);
    const ratio = Math.min(maxWidth / this.sourceImage.width, maxHeight / this.sourceImage.height, 1);

    const width = Math.floor(this.sourceImage.width * ratio);
    const height = Math.floor(this.sourceImage.height * ratio);

    this.canvas.width = width;
    this.canvas.height = height;
    this.base.width = width;
    this.base.height = height;
    this.buffer.width = width;
    this.buffer.height = height;
  }

  resetDynamicState() {
    this.matrixDrops = [];
    this.voronoiCache = null;
    this.frameCount = 0;
  }

  paintSource() {
    this.baseCtx.clearRect(0, 0, this.base.width, this.base.height);
    this.baseCtx.drawImage(this.sourceImage, 0, 0, this.base.width, this.base.height);
  }

  getImageData() {
    return this.baseCtx.getImageData(0, 0, this.base.width, this.base.height);
  }

  putImageData(data) {
    this.ctx.putImageData(data, 0, 0);
  }

  render(effectId, params, timestamp = 0) {
    if (!this.sourceImage) return;

    this.paintSource();
    this.frameCount += 1;

    switch (effectId) {
      case "ascii":
        this.renderAscii(params);
        break;
      case "matrix":
        this.renderMatrix(params, timestamp);
        break;
      case "dots":
        this.renderDots(params);
        break;
      case "edge":
      case "contour":
        this.renderEdge(params);
        break;
      case "threshold":
        this.renderThreshold(params);
        break;
      case "dithering":
        this.renderDithering(params);
        break;
      case "halftone":
        this.renderHalftone(params);
        break;
      case "blockify":
        this.renderBlockify(params);
        break;
      case "pixelsort":
        this.renderPixelSort(params);
        break;
      case "crosshatch":
        this.renderCrosshatch(params);
        break;
      case "wavelines":
        this.renderWaveLines(params, timestamp);
        break;
      case "noisefield":
        this.renderNoiseField(params);
        break;
      case "voronoi":
        this.renderVoronoi(params);
        break;
      case "vhs":
        this.renderVhs(params, timestamp);
        break;
      default:
        this.ctx.drawImage(this.base, 0, 0);
        break;
    }
  }

  renderAscii(params) {
    const width = this.base.width;
    const height = this.base.height;
    const imageData = this.getImageData();
    const data = imageData.data;

    const set = CHAR_SETS[params.characterSet] ?? CHAR_SETS.STANDARD;
    const isWideCharset = WIDE_CHARSETS.has(params.characterSet);
    const columns = Math.max(10, Math.floor(params.outputWidth / Math.max(0.2, params.scale)));
    const cellWidth = width / columns;
    const cellHeight = cellWidth * (1 + params.spacing);

    const bgIntensity = clamp(255 * (params.backgroundIntensity / 2), 0, 255);
    this.ctx.fillStyle = params.mode === "Monochrome" ? `rgb(${bgIntensity},${bgIntensity},${bgIntensity})` : "#06080d";
    this.ctx.fillRect(0, 0, width, height);

    const glyphAspect = isWideCharset ? 1.0 : 0.62;
    const fontSize = Math.max(8, Math.floor(Math.min(cellHeight * 1.05, cellWidth / glyphAspect)));
    this.ctx.font = `${fontSize}px ${ASCII_FONT_STACK}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    for (let y = 0; y < height; y += cellHeight) {
      for (let x = 0; x < width; x += cellWidth) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const index = (py * width + px) * 4;

        let r = data[index];
        let g = data[index + 1];
        let b = data[index + 2];

        const brShift = params.brightness;
        const contrastPercent = params.contrast + 100;
        r = applyBrightnessContrast(r, brShift, contrastPercent);
        g = applyBrightnessContrast(g, brShift, contrastPercent);
        b = applyBrightnessContrast(b, brShift, contrastPercent);

        const luma = brightness(r, g, b) / 255;
        const gammaLuma = Math.pow(luma, 1 / params.gamma);
        const mapped = clamp(gammaLuma * 255 * params.brightnessMap, 0, 255);
        const value = params.invert ? 255 - mapped : mapped;
        const idx = Math.floor((value / 255) * (set.length - 1));
        const char = set[idx];

        if (params.mode === "Monochrome") {
          this.ctx.fillStyle = `rgb(${Math.floor(value)}, ${Math.floor(value)}, ${Math.floor(value)})`;
        } else {
          this.ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        }

        this.ctx.fillText(char, x + cellWidth * 0.5, y + cellHeight * 0.5);
      }
    }
  }

  renderMatrix(params) {
    const width = this.base.width;
    const height = this.base.height;
    const cell = Math.max(6, Math.floor(params.cellSize));
    const spacing = 1 + params.spacing;
    const stepX = Math.max(4, Math.floor(cell * (0.78 + params.spacing)));
    const stepY = stepX;
    const cols = Math.ceil(width / stepX);

    if (this.matrixDrops.length !== cols) {
      this.matrixDrops = Array.from({ length: cols }, () => Math.random() * height);
    }

    const source = this.getImageData();
    const sourceData = source.data;

    this.ctx.fillStyle = `rgba(0, 0, 0, ${params.bgOpacity})`;
    this.ctx.fillRect(0, 0, width, height);

    const chars = CHAR_SETS[params.characterSet] ?? CHAR_SETS.BLOCKS;
    const color = hexToRgb(params.rainColor);

    this.ctx.font = `${Math.floor(cell)}px ${ASCII_FONT_STACK}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.shadowBlur = Math.max(0, 12 * params.glow);
    this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;

    const speed = params.speed * (params.direction === "Up" ? -1 : 1);
    const threshold = params.threshold * 255;
    const trailLength = Math.max(6, Math.floor(params.trailLength));
    const trailDrawCount = Math.min(72, trailLength);

    for (let col = 0; col < cols; col += 1) {
      const x = col * stepX + stepX * 0.5;
      const headY = this.matrixDrops[col];

      for (let trail = 0; trail < trailDrawCount; trail += 1) {
        const y = headY - trail * stepY * Math.sign(speed || 1);
        const py = ((Math.floor(y) % height) + height) % height;
        const px = Math.min(width - 1, Math.max(0, Math.floor(x)));
        const pixelIndex = (py * width + px) * 4;
        const r = sourceData[pixelIndex];
        const g = sourceData[pixelIndex + 1];
        const b = sourceData[pixelIndex + 2];
        const luma = brightness(r, g, b);
        const adjusted = applyBrightnessContrast(luma, params.brightness - 100, params.contrast);

        const tailFade = 1 - trail / trailDrawCount;
        const activeAlpha = 0.2 + (adjusted / 255) * 0.8;
        const mask = adjusted >= threshold ? 1 : 0.35;
        const alpha = Math.max(0.05, activeAlpha * tailFade * mask);
        const ch = chars[Math.floor(Math.random() * chars.length)];

        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        this.ctx.fillText(ch, x, py);
      }

      this.matrixDrops[col] += speed * (1 + Math.random() * 0.8);
      if (this.matrixDrops[col] > height + trailLength * stepY) {
        this.matrixDrops[col] = -Math.random() * trailLength * stepY;
      }
      if (this.matrixDrops[col] < -trailLength * stepY) {
        this.matrixDrops[col] = height + Math.random() * trailLength * stepY;
      }
    }

    this.ctx.shadowBlur = 0;
  }

  renderDots(params) {
    const width = this.base.width;
    const height = this.base.height;
    const data = this.getImageData().data;

    const step = Math.max(4, Math.floor(8 * params.spacing));
    const radius = Math.max(1, (step * 0.45) * params.size);

    this.ctx.fillStyle = params.invert ? "#f5f5f5" : "#05070b";
    this.ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += step) {
      const offset = params.gridType === "Offset Grid" && Math.floor(y / step) % 2 === 1 ? step * 0.5 : 0;

      for (let x = 0; x < width; x += step) {
        const px = Math.min(width - 1, Math.floor(x + offset));
        const py = Math.min(height - 1, Math.floor(y));
        const i = (py * width + px) * 4;
        const luma = brightness(data[i], data[i + 1], data[i + 2]);
        const value = params.invert ? luma : 255 - luma;
        const alpha = value / 255;
        const size = radius * alpha;

        this.ctx.fillStyle = params.invert ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;

        const drawX = x + offset;
        const drawY = y;
        if (params.shape === "Square") {
          this.ctx.fillRect(drawX - size * 0.5, drawY - size * 0.5, size, size);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(drawX, drawY, size * 0.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  renderEdge(params) {
    const width = this.base.width;
    const height = this.base.height;
    const src = this.getImageData();
    const data = src.data;
    const out = this.ctx.createImageData(width, height);

    const color = hexToRgb(params.lineColor ?? "#7dff5d");
    const threshold = params.threshold ?? 70;
    const strength = params.strength ?? 1.2;

    const gray = new Float32Array(width * height);
    for (let i = 0; i < gray.length; i += 1) {
      const p = i * 4;
      gray[i] = brightness(data[p], data[p + 1], data[p + 2]);
    }

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const idx = y * width + x;
        const gx =
          -gray[idx - width - 1] - 2 * gray[idx - 1] - gray[idx + width - 1] +
          gray[idx - width + 1] + 2 * gray[idx + 1] + gray[idx + width + 1];
        const gy =
          -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1] +
          gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];
        const mag = Math.sqrt(gx * gx + gy * gy) * strength;
        const isEdge = mag > threshold;

        const outIndex = idx * 4;
        out.data[outIndex] = isEdge ? color.r : 0;
        out.data[outIndex + 1] = isEdge ? color.g : 0;
        out.data[outIndex + 2] = isEdge ? color.b : 0;
        out.data[outIndex + 3] = 255;
      }
    }

    this.putImageData(out);
  }

  renderThreshold(params) {
    const img = this.getImageData();
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = brightness(data[i], data[i + 1], data[i + 2]);
      const c = v > params.level ? 255 : 0;
      data[i] = c;
      data[i + 1] = c;
      data[i + 2] = c;
    }
    this.putImageData(img);
  }

  renderDithering(params) {
    const img = this.getImageData();
    const data = img.data;
    const matrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];

    for (let y = 0; y < img.height; y += 1) {
      for (let x = 0; x < img.width; x += 1) {
        const i = (y * img.width + x) * 4;
        const luma = brightness(data[i], data[i + 1], data[i + 2]);
        const threshold = (matrix[y % 4][x % 4] / 16) * 255;
        const adjusted = applyBrightnessContrast(luma, 0, params.contrast);
        const color = adjusted > threshold ? 255 : 0;
        data[i] = color;
        data[i + 1] = color;
        data[i + 2] = color;
      }
    }

    this.putImageData(img);
  }

  renderHalftone(params) {
    const width = this.base.width;
    const height = this.base.height;
    const data = this.getImageData().data;
    const cell = Math.max(3, params.cell);

    this.ctx.fillStyle = "#05070c";
    this.ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        const i = (Math.min(height - 1, y) * width + Math.min(width - 1, x)) * 4;
        const luma = brightness(data[i], data[i + 1], data[i + 2]);
        const r = (1 - luma / 255) * (cell * 0.55);
        this.ctx.fillStyle = "#efefef";

        if (params.shape === "Square") {
          const size = Math.max(1, r * 1.2);
          this.ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(x, y, Math.max(0.8, r), 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  renderBlockify(params) {
    const block = Math.max(2, Math.floor(params.block));
    this.bufferCtx.imageSmoothingEnabled = false;
    this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    this.bufferCtx.drawImage(this.base, 0, 0, Math.ceil(this.base.width / block), Math.ceil(this.base.height / block));

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.buffer, 0, 0, Math.ceil(this.base.width / block), Math.ceil(this.base.height / block), 0, 0, this.base.width, this.base.height);
    this.ctx.imageSmoothingEnabled = true;
  }

  renderPixelSort(params) {
    const img = this.getImageData();
    const data = img.data;
    const width = img.width;
    const height = img.height;

    for (let y = 0; y < height; y += 1) {
      let x = 0;
      while (x < width) {
        const start = x;
        while (x < width) {
          const i = (y * width + x) * 4;
          const l = brightness(data[i], data[i + 1], data[i + 2]);
          if (l > params.threshold) break;
          x += 1;
        }

        const end = x;
        if (end - start > 1) {
          const pixels = [];
          for (let p = start; p < end; p += 1) {
            const i = (y * width + p) * 4;
            pixels.push([data[i], data[i + 1], data[i + 2], data[i + 3]]);
          }
          pixels.sort((a, b) => brightness(a[0], a[1], a[2]) - brightness(b[0], b[1], b[2]));
          for (let p = start; p < end; p += 1) {
            const i = (y * width + p) * 4;
            const value = pixels[p - start];
            data[i] = value[0];
            data[i + 1] = value[1];
            data[i + 2] = value[2];
            data[i + 3] = value[3];
          }
        }

        x += 1;
      }
    }

    this.putImageData(img);
  }

  renderCrosshatch(params) {
    const width = this.base.width;
    const height = this.base.height;
    const data = this.getImageData().data;
    const density = Math.max(4, params.density);

    this.ctx.fillStyle = "#05070c";
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.strokeStyle = "#f5f5f5";
    this.ctx.lineWidth = 1;

    for (let y = 0; y < height; y += density) {
      for (let x = 0; x < width; x += density) {
        const i = (y * width + x) * 4;
        const l = brightness(data[i], data[i + 1], data[i + 2]);

        if (l < 210) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x + density, y + density);
          this.ctx.stroke();
        }
        if (l < 150) {
          this.ctx.beginPath();
          this.ctx.moveTo(x + density, y);
          this.ctx.lineTo(x, y + density);
          this.ctx.stroke();
        }
        if (l < 90) {
          this.ctx.beginPath();
          this.ctx.moveTo(x + density * 0.5, y);
          this.ctx.lineTo(x + density * 0.5, y + density);
          this.ctx.stroke();
        }
      }
    }
  }

  renderWaveLines(params, timestamp) {
    const width = this.base.width;
    const height = this.base.height;
    const src = this.getImageData();
    const out = this.ctx.createImageData(width, height);

    const amp = params.amp;
    const freq = params.freq;
    const t = timestamp * 0.002;

    for (let y = 0; y < height; y += 1) {
      const shift = Math.sin(y * freq + t) * amp;
      for (let x = 0; x < width; x += 1) {
        const sx = Math.max(0, Math.min(width - 1, Math.floor(x + shift)));
        const srcIndex = (y * width + sx) * 4;
        const dstIndex = (y * width + x) * 4;
        out.data[dstIndex] = src.data[srcIndex];
        out.data[dstIndex + 1] = src.data[srcIndex + 1];
        out.data[dstIndex + 2] = src.data[srcIndex + 2];
        out.data[dstIndex + 3] = 255;
      }
    }

    this.putImageData(out);
  }

  renderNoiseField(params) {
    const img = this.getImageData();
    const data = img.data;

    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * params.amount * 2;
      data[i] = clamp(data[i] + n);
      data[i + 1] = clamp(data[i + 1] + n);
      data[i + 2] = clamp(data[i + 2] + n);
    }

    this.putImageData(img);
  }

  renderVoronoi(params) {
    const width = this.base.width;
    const height = this.base.height;
    const points = Math.floor(params.points);

    if (!this.voronoiCache || this.voronoiCache.points !== points || this.voronoiCache.width !== width || this.voronoiCache.height !== height) {
      const rand = seededRandom(points * 17 + width * 11 + height * 5);
      const seeds = [];
      for (let i = 0; i < points; i += 1) {
        seeds.push({ x: rand() * width, y: rand() * height });
      }
      this.voronoiCache = { seeds, points, width, height };
    }

    const seedCount = Math.min(220, this.voronoiCache.seeds.length);
    const seeds = this.voronoiCache.seeds.slice(0, seedCount);
    const src = this.getImageData();
    const out = this.ctx.createImageData(width, height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let best = 0;
        let bestDist = Number.POSITIVE_INFINITY;

        for (let i = 0; i < seeds.length; i += 1) {
          const dx = x - seeds[i].x;
          const dy = y - seeds[i].y;
          const d = dx * dx + dy * dy;
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        }

        const sx = Math.floor(seeds[best].x);
        const sy = Math.floor(seeds[best].y);
        const srcIndex = (Math.min(height - 1, sy) * width + Math.min(width - 1, sx)) * 4;
        const dstIndex = (y * width + x) * 4;
        out.data[dstIndex] = src.data[srcIndex];
        out.data[dstIndex + 1] = src.data[srcIndex + 1];
        out.data[dstIndex + 2] = src.data[srcIndex + 2];
        out.data[dstIndex + 3] = 255;
      }
    }

    this.putImageData(out);
  }

  renderVhs(params, timestamp) {
    const src = this.getImageData();
    const out = this.ctx.createImageData(src.width, src.height);
    const data = src.data;
    const shift = Math.floor(params.shift);
    const jitter = Math.floor(params.jitter * Math.sin(timestamp * 0.01));

    for (let y = 0; y < src.height; y += 1) {
      const rowOffset = ((y + jitter) % src.height + src.height) % src.height;
      for (let x = 0; x < src.width; x += 1) {
        const rX = Math.max(0, Math.min(src.width - 1, x + shift));
        const bX = Math.max(0, Math.min(src.width - 1, x - shift));
        const dstIndex = (y * src.width + x) * 4;
        const rIndex = (rowOffset * src.width + rX) * 4;
        const gIndex = (rowOffset * src.width + x) * 4;
        const bIndex = (rowOffset * src.width + bX) * 4;

        out.data[dstIndex] = data[rIndex];
        out.data[dstIndex + 1] = data[gIndex + 1];
        out.data[dstIndex + 2] = data[bIndex + 2];
        out.data[dstIndex + 3] = 255;
      }
    }

    const scan = params.scan;
    for (let y = 0; y < src.height; y += 2) {
      for (let x = 0; x < src.width; x += 1) {
        const i = (y * src.width + x) * 4;
        out.data[i] *= 1 - scan;
        out.data[i + 1] *= 1 - scan;
        out.data[i + 2] *= 1 - scan;
      }
    }

    this.putImageData(out);
  }

  exportPNG({ highQuality = false } = {}) {
    if (!highQuality) {
      return this.canvas.toDataURL("image/png");
    }

    const temp = document.createElement("canvas");
    temp.width = this.canvas.width * 2;
    temp.height = this.canvas.height * 2;
    const tctx = temp.getContext("2d");
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(this.canvas, 0, 0, temp.width, temp.height);
    return temp.toDataURL("image/png");
  }

  exportMatrixGIF(params, { frameCount = 36, delay = 50, onProgress } = {}) {
    const GIFConstructor = global.GIF;
    if (!GIFConstructor) {
      return Promise.reject(new Error("GIF encoder is not available."));
    }
    if (global.location?.protocol === "file:") {
      return Promise.reject(new Error("GIF export is blocked on file://. Use http(s) URL."));
    }

    const previousDrops = [...this.matrixDrops];
    const previousFrameCount = this.frameCount;
    this.matrixDrops = [];

    const gif = new GIFConstructor({
      workers: 1,
      quality: 8,
      width: this.canvas.width,
      height: this.canvas.height,
      workerScript: "js/vendor/gif.worker.loader.js"
    });

    return new Promise((resolve, reject) => {
      let frameIndex = 0;
      const restoreState = () => {
        this.matrixDrops = previousDrops;
        this.frameCount = previousFrameCount;
      };

      const captureNextFrame = () => {
        this.paintSource();
        this.renderMatrix(params);
        gif.addFrame(this.ctx, { copy: true, delay });
        frameIndex += 1;
        if (typeof onProgress === "function") {
          onProgress({
            phase: "capturing",
            current: frameIndex,
            total: frameCount,
            percent: frameIndex / frameCount
          });
        }

        if (frameIndex < frameCount) {
          requestAnimationFrame(captureNextFrame);
          return;
        }

        if (typeof onProgress === "function") {
          onProgress({ phase: "encoding", percent: 0 });
        }
        gif.render();
      };

      gif.on("progress", (value) => {
        if (typeof onProgress === "function") {
          onProgress({ phase: "encoding", percent: value });
        }
      });
      gif.on("finished", (blob) => {
        restoreState();
        resolve(blob);
      });
      gif.on("abort", () => {
        restoreState();
        reject(new Error("GIF encoding aborted."));
      });
      gif.on("error", (error) => {
        restoreState();
        reject(error instanceof Error ? error : new Error(String(error)));
      });

      try {
        requestAnimationFrame(captureNextFrame);
      } catch (error) {
        restoreState();
        reject(error);
      }
    });
  }
}

  global.ImageModifierRenderer = { Renderer };
})(window);

