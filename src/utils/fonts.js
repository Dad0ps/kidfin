export const FONTS = [
  { id: 'nunito', name: 'Default (Nunito)', family: "'Nunito', sans-serif" },
  { id: 'atkinson', name: 'Easy Read (Atkinson)', family: "'Atkinson Hyperlegible', sans-serif" },
  { id: 'opendyslexic', name: 'Dyslexia Friendly (OpenDyslexic)', family: "'OpenDyslexic', sans-serif" },
];

export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 16;
export const MAX_FONT_SIZE = 28;

export function applyFont(fontId) {
  const font = FONTS.find((f) => f.id === fontId);
  if (!font) return;
  document.documentElement.style.setProperty('--font', font.family);
}

export function applyFontSize(size) {
  const px = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size || DEFAULT_FONT_SIZE));
  document.documentElement.style.setProperty('font-size', `${px}px`);
}

export function clearFont() {
  document.documentElement.style.removeProperty('--font');
  document.documentElement.style.removeProperty('font-size');
}
