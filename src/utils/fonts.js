export const FONTS = [
  { id: 'nunito', name: 'Default (Nunito)', family: "'Nunito', sans-serif" },
  { id: 'atkinson', name: 'Easy Read (Atkinson)', family: "'Atkinson Hyperlegible', sans-serif" },
  { id: 'opendyslexic', name: 'Dyslexia Friendly (OpenDyslexic)', family: "'OpenDyslexic', sans-serif" },
];

export function applyFont(fontId) {
  const font = FONTS.find((f) => f.id === fontId);
  if (!font) return;
  document.documentElement.style.setProperty('--font', font.family);
}

export function clearFont() {
  document.documentElement.style.removeProperty('--font');
}
