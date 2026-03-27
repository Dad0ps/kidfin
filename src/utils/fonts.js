export const FONTS = [
  { id: 'nunito', name: 'Default (Nunito)', family: "'Nunito', sans-serif" },
  { id: 'atkinson', name: 'Easy Read (Atkinson)', family: "'Atkinson Hyperlegible', sans-serif" },
  { id: 'opendyslexic', name: 'Dyslexia Friendly (OpenDyslexic)', family: "'OpenDyslexic', sans-serif" },
];

export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 16;
export const MAX_FONT_SIZE = 28;

const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox');

export function applyFont(fontId) {
  const font = FONTS.find((f) => f.id === fontId);
  if (!font) return;
  document.documentElement.style.setProperty('--font', font.family);
}

export function applyFontSize(size) {
  const px = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size || DEFAULT_FONT_SIZE));
  const scale = px / DEFAULT_FONT_SIZE;

  if (isFirefox) {
    // Firefox doesn't support CSS zoom — use MozTransform on body
    document.body.style.MozTransform = `scale(${scale})`;
    document.body.style.MozTransformOrigin = 'top center';
    document.body.style.minHeight = `${100 / scale}vh`;
  } else {
    document.body.style.zoom = scale;
  }
}

export function clearFont() {
  document.documentElement.style.removeProperty('--font');
  document.body.style.zoom = '';
  document.body.style.MozTransform = '';
  document.body.style.MozTransformOrigin = '';
  document.body.style.minHeight = '';
}
