// Applies the width chosen in the popup to the page as a CSS variable.
// The stylesheet (content.css) uses the variable for the article/grid widths.

const KEY = 'hiContentWidth';
const DEFAULT_VALUE = 'min(100%, 2400px)';
const NARRATION_RATES = ['1x', '1.25x', '1.5x', '1.75x', '2x'];

function applyWidth(value) {
  const root = document.documentElement;
  if (!root) return;
  root.style.setProperty('--hi-content-width', value);
}

function findNarrationCard() {
  const sidebarToggle = document.querySelector(
    'button[aria-label="Show narration controls"], button[aria-label="Hide narration controls"]',
  );
  const sidebar = sidebarToggle?.closest('.sticky');
  const sidebarCard = sidebar?.querySelector('.mt-3 .chrome');
  if (sidebarCard) return sidebarCard;

  const playbackButton = document.querySelector(
    'button[aria-label="Play narration"], button[aria-label="Pause narration"]',
  );
  for (
    let container = playbackButton?.parentElement;
    container;
    container = container.parentElement
  ) {
    if (findSpeedButton(container)) return container;
  }

  return document.querySelector('.chrome.fixed.bottom-4.right-4');
}

function findNarrationPlayButton(card) {
  const labeledButton = card.querySelector(
    'button[aria-label="Play narration"], button[aria-label="Pause narration"]',
  );
  if (labeledButton) return labeledButton;

  return [...card.querySelectorAll('button')].find((button) =>
    button.classList.contains('size-[42px]'),
  );
}

function isEditableTarget(target) {
  return (
    target instanceof Element &&
    target.closest(
      'input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"])',
    ) !== null
  );
}

function findSpeedButton(card) {
  return [...card.querySelectorAll('button[role="combobox"]')].find((button) =>
    NARRATION_RATES.includes(button.textContent.trim()),
  );
}

function findSpeedOption(rate) {
  return [...document.querySelectorAll('[role="option"]')].find(
    (option) => option.textContent.trim() === rate,
  );
}

function waitForSpeedOption(rate) {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const option = findSpeedOption(rate);
      if (option) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve(option);
      }
    });
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Narration speed option "${rate}" did not appear.`));
    }, 1500);

    observer.observe(document.body, { childList: true, subtree: true });
    const option = findSpeedOption(rate);
    if (option) {
      clearTimeout(timeout);
      observer.disconnect();
      resolve(option);
    }
  });
}

function selectNarrationSpeed(button, rate) {
  const existingOption = findSpeedOption(rate);
  if (existingOption) {
    existingOption.click();
    return;
  }

  const optionPromise = waitForSpeedOption(rate);
  button.click();
  optionPromise
    .then((option) => option.click())
    .catch((error) => {
      console.error('Unable to change Hello Interview narration speed:', error);
    });
}

window.addEventListener('keydown', (event) => {
  if (
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    isEditableTarget(event.target)
  ) {
    return;
  }

  const key = event.key.toLowerCase();
  const isToggleShortcut =
    !event.shiftKey && (event.code === 'Space' || key === 'k');
  const isIncreaseSpeed =
    event.shiftKey && (event.key === '>' || event.code === 'Period');
  const isDecreaseSpeed =
    event.shiftKey && (event.key === '<' || event.code === 'Comma');

  if (!isToggleShortcut && !isIncreaseSpeed && !isDecreaseSpeed) return;

  const card = findNarrationCard();
  if (!card) return;

  if (isToggleShortcut) {
    const playButton = findNarrationPlayButton(card);
    if (!playButton) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    playButton.click();
    return;
  }

  const speedButton = findSpeedButton(card);
  if (!speedButton) return;

  const currentRate = speedButton.textContent.trim();
  const currentIndex = NARRATION_RATES.indexOf(currentRate);
  if (currentIndex === -1) return;

  const nextIndex = Math.min(
    NARRATION_RATES.length - 1,
    Math.max(0, currentIndex + (isIncreaseSpeed ? 1 : -1)),
  );
  if (nextIndex === currentIndex) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  selectNarrationSpeed(speedButton, NARRATION_RATES[nextIndex]);
}, true);

chrome.storage.sync.get({ [KEY]: DEFAULT_VALUE }, (stored) => {
  applyWidth(stored[KEY]);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[KEY]) {
    applyWidth(changes[KEY].newValue || DEFAULT_VALUE);
  }
});
