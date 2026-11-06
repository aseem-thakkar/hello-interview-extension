const KEY = 'hiContentWidth';
const DEFAULT_PX = 2400;
const DEFAULT_VALUE = `min(100%, ${DEFAULT_PX}px)`;
const FILL_VALUE = '100%';

const slider = document.getElementById('slider');
const readout = document.getElementById('readout');

function parsePx(value) {
  if (!value) return DEFAULT_PX;
  if (value.trim() === FILL_VALUE) return null;
  const match =
    /^min\(100%,\s*(\d+)px\)$/.exec(value) || /^(\d+)px$/.exec(value);
  return match ? Number(match[1]) : DEFAULT_PX;
}

function render(value) {
  const px = parsePx(value);
  if (px === null) {
    readout.textContent = 'fill screen';
    slider.value = String(slider.max);
    return;
  }
  readout.textContent = `${px} px`;
  slider.value = String(Math.min(Math.max(px, slider.min), slider.max));
}

function save(value) {
  chrome.storage.sync.set({ [KEY]: value });
  render(value);
}

chrome.storage.sync.get({ [KEY]: DEFAULT_VALUE }, (stored) => {
  render(stored[KEY]);
});

let saveTimer;
slider.addEventListener('input', () => {
  const px = Number(slider.value);
  readout.textContent = `${px} px`;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(`${px}px`), 90);
});

document.getElementById('fill').addEventListener('click', () => save(FILL_VALUE));
document.getElementById('reset').addEventListener('click', () => save(DEFAULT_VALUE));
