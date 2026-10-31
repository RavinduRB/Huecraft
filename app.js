const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const canvasWrap = document.getElementById('canvasWrap');
const dropState = document.getElementById('dropState');
const imageInput = document.getElementById('imageInput');
const cursorLens = document.getElementById('cursorLens');
const lensColor = document.getElementById('lensColor');
const lensHex = document.getElementById('lensHex');
const notes = document.getElementById('colorNotes');
const colorCount = document.getElementById('colorCount');
let imageLoaded = false;
let zoom = 1;
let pickedColors = [];
let palette = ['#E8E2D6', '#B2A38E', '#6D7467', '#263A3A', '#D07152'];

const toHex = (value) => `#${Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0').toUpperCase()}`;
const rgbToHex = (r, g, b) => `#${toHex(r).slice(1)}${toHex(g).slice(1)}${toHex(b).slice(1)}`;

function renderPalette(colors) {
  palette = colors;
  document.getElementById('paletteStrip').innerHTML = colors.map((color) => `<div class="strip-color" style="background:${color};flex:1"></div>`).join('');
  document.getElementById('paletteValues').innerHTML = colors.map((color) => `<button class="palette-value" data-color="${color}"><span class="mini-swatch" style="background:${color}"></span><code>${color}</code></button>`).join('');
}

function hexToHsl(hex) {
  const values = hex.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16) / 255);
  const [r, g, b] = values;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue;
  switch (max) {
    case r: hue = (g - b) / delta + (g < b ? 6 : 0); break;
    case g: hue = (b - r) / delta + 2; break;
    default: hue = (r - g) / delta + 4;
  }
  return [hue * 60, saturation, lightness];
}

function hslToHex(hue, saturation, lightness) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const match = lightness - chroma / 2;
  const rgb = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x]
    : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return rgbToHex(...rgb.map((value) => Math.round((value + match) * 255)));
}

function generatedColorSet(offset, saturationChange, lightnessChange) {
  const colors = pickedColors.flatMap((color) => {
    const [hue, saturation, lightness] = hexToHsl(color);
    return [
      hslToHex((hue + offset + 360) % 360, Math.max(0, Math.min(1, saturation + saturationChange)), Math.max(0.08, Math.min(0.92, lightness + lightnessChange))),
      color,
      hslToHex((hue + offset * 0.5 + 360) % 360, Math.max(0, Math.min(1, saturation + saturationChange * 0.5)), Math.max(0.08, Math.min(0.92, lightness + lightnessChange + 0.12))),
      hslToHex((hue + offset * 1.5 + 360) % 360, Math.max(0, Math.min(1, saturation + saturationChange)), Math.max(0.08, Math.min(0.92, lightness + lightnessChange - 0.14))),
      hslToHex((hue + offset * 2 + 360) % 360, Math.max(0, Math.min(1, saturation + saturationChange * 0.5)), Math.max(0.08, Math.min(0.92, lightness + lightnessChange + 0.04)))
    ];
  });
  return [...new Set(colors)].slice(0, 5);
}

function renderGeneratedPalettes() {
  const container = document.getElementById('generatedPalettes');
  const status = document.getElementById('generatedStatus');
  if (!pickedColors.length) {
    status.textContent = 'Pick a color to begin';
    container.innerHTML = '<div class="generated-empty">Your picked colors will inspire complementary, tonal and atmospheric palettes here.</div>';
    return;
  }
  const palettes = [
    ['Cool harmony', 'A calm shift around your chosen hues', generatedColorSet(-28, 0.04, 0.02)],
    ['Electric contrast', 'Opposites with a little more energy', generatedColorSet(180, 0.08, 0)],
    ['Soft atmosphere', 'Lighter, quieter versions of your picks', generatedColorSet(0, -0.12, 0.2)]
  ];
  status.textContent = `${pickedColors.length} ${pickedColors.length === 1 ? 'color' : 'colors'} shaping these palettes`;
  container.innerHTML = palettes.map(([name, description, colors]) => `
    <article class="generated-card">
      <div class="generated-card-header"><div><h3>${name}</h3><p>${description}</p></div><span>${colors.length} tones</span></div>
      <div class="generated-swatches">${colors.map((color) => `<button class="generated-swatch" data-color="${color}" style="background:${color}" aria-label="Use ${color}"></button>`).join('')}</div>
      <div class="generated-values">${colors.map((color) => `<code>${color}</code>`).join('')}</div>
    </article>
  `).join('');
}

function addColor(hex) {
  if (pickedColors.includes(hex)) return;
  pickedColors.unshift(hex);
  colorCount.textContent = pickedColors.length;
  renderGeneratedPalettes();
  const empty = notes.querySelector('.empty-note');
  if (empty) empty.remove();
  const card = document.createElement('div');
  card.className = 'color-card';
  card.innerHTML = `<div class="swatch" style="background:${hex}"></div><div class="color-meta"><code>${hex}</code><button class="remove-color" aria-label="Remove color">×</button></div>`;
  card.querySelector('.remove-color').addEventListener('click', () => {
    pickedColors = pickedColors.filter((color) => color !== hex);
    card.remove();
    colorCount.textContent = pickedColors.length;
    if (!pickedColors.length) showEmptyNote();
    renderGeneratedPalettes();
  });
  notes.prepend(card);
}

function showEmptyNote() {
  notes.innerHTML = '<div class="empty-note"><span>✦</span><p>Every color you pick will<br>appear here.</p></div>';
}

function loadImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    const ratio = Math.min(1, 1500 / image.width, 760 / image.height);
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.style.width = `${image.width * ratio}px`;
    canvas.style.height = `${image.height * ratio}px`;
    ctx.drawImage(image, 0, 0);
    imageLoaded = true;
    dropState.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('canvasHint').style.display = 'block';
    URL.revokeObjectURL(url);
    extractPalette();
  };
  image.src = url;
}

function sampleAt(event) {
  if (!imageLoaded) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - rect.left) * canvas.width / rect.width)));
  const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - rect.top) * canvas.height / rect.height)));
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  addColor(rgbToHex(r, g, b));
}

function extractPalette() {
  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const buckets = new Map();
  for (let i = 0; i < sample.length; i += 4 * Math.max(1, Math.floor(sample.length / 12000))) {
    const r = Math.min(255, Math.round(sample[i] / 32) * 32);
    const g = Math.min(255, Math.round(sample[i + 1] / 32) * 32);
    const b = Math.min(255, Math.round(sample[i + 2] / 32) * 32);
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const colors = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key]) => rgbToHex(...key.split(',').map(Number)));
  if (colors.length) renderPalette(colors);
}

async function pickFromScreen() {
  if (!window.EyeDropper) {
    window.alert('Screen picking is not supported in this browser. Use Chrome or Edge, or upload a screenshot instead.');
    return;
  }
  try {
    const result = await new window.EyeDropper().open();
    const hex = result.sRGBHex.toUpperCase();
    addColor(hex);
    await navigator.clipboard.writeText(hex);
    const button = document.getElementById('screenPicker');
    const original = button.innerHTML;
    button.innerHTML = `✓ <span>${hex} copied for Word</span>`;
    button.classList.add('picked');
    setTimeout(() => {
      button.innerHTML = original;
      button.classList.remove('picked');
    }, 1800);
  } catch (error) {
    if (error.name !== 'AbortError') {
      window.alert('The screen color could not be read. Please try again or upload a screenshot.');
    }
  }
}

imageInput.addEventListener('change', (event) => loadImage(event.target.files[0]));
canvas.addEventListener('click', sampleAt);
canvas.addEventListener('mousemove', (event) => {
  if (!imageLoaded) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * canvas.width / rect.width);
  const y = Math.floor((event.clientY - rect.top) * canvas.height / rect.height);
  const [r, g, b] = ctx.getImageData(Math.max(0, x), Math.max(0, y), 1, 1).data;
  const hex = rgbToHex(r, g, b);
  lensColor.style.background = hex;
  lensHex.textContent = hex;
  cursorLens.style.display = 'flex';
  cursorLens.style.left = `${event.clientX - canvasWrap.getBoundingClientRect().left}px`;
  cursorLens.style.top = `${event.clientY - canvasWrap.getBoundingClientRect().top}px`;
});
canvas.addEventListener('mouseleave', () => { cursorLens.style.display = 'none'; });
canvasWrap.addEventListener('dragover', (event) => { event.preventDefault(); canvasWrap.classList.add('dragging'); });
canvasWrap.addEventListener('dragleave', () => canvasWrap.classList.remove('dragging'));
canvasWrap.addEventListener('drop', (event) => { event.preventDefault(); canvasWrap.classList.remove('dragging'); loadImage(event.dataTransfer.files[0]); });
document.getElementById('screenPicker').addEventListener('click', pickFromScreen);
document.getElementById('screenPickerHint').addEventListener('click', pickFromScreen);

document.getElementById('zoomIn').addEventListener('click', () => { zoom = Math.min(2, zoom + .1); canvas.style.transform = `scale(${zoom})`; document.getElementById('zoomLabel').textContent = `${Math.round(zoom * 100)}%`; });
document.getElementById('zoomOut').addEventListener('click', () => { zoom = Math.max(.5, zoom - .1); canvas.style.transform = `scale(${zoom})`; document.getElementById('zoomLabel').textContent = `${Math.round(zoom * 100)}%`; });
document.getElementById('resetZoom').addEventListener('click', () => { zoom = 1; canvas.style.transform = 'scale(1)'; document.getElementById('zoomLabel').textContent = '100%'; });
document.getElementById('clearColors').addEventListener('click', () => { pickedColors = []; colorCount.textContent = '0'; showEmptyNote(); renderGeneratedPalettes(); });
document.getElementById('clearButton').addEventListener('click', () => { imageLoaded = false; canvas.style.display = 'none'; dropState.style.display = 'block'; imageInput.value = ''; document.getElementById('canvasHint').style.display = 'none'; });
document.getElementById('copyPalette').addEventListener('click', async () => { await navigator.clipboard.writeText(palette.join(', ')); const button = document.getElementById('copyPalette'); const original = button.innerHTML; button.innerHTML = 'Copied <span>✓</span>'; setTimeout(() => { button.innerHTML = original; }, 1300); });
document.getElementById('paletteValues').addEventListener('click', async (event) => { const button = event.target.closest('.palette-value'); if (!button) return; await navigator.clipboard.writeText(button.dataset.color); addColor(button.dataset.color); });
document.getElementById('generatedPalettes').addEventListener('click', async (event) => {
  const swatch = event.target.closest('.generated-swatch');
  if (!swatch) return;
  await navigator.clipboard.writeText(swatch.dataset.color);
  addColor(swatch.dataset.color);
});
document.addEventListener('paste', (event) => { const item = [...event.clipboardData.items].find((entry) => entry.type.startsWith('image/')); if (item) loadImage(item.getAsFile()); });
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('clearButton').click(); } });