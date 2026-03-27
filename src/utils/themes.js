export const THEMES = {
  '😊': { name: 'Sunshine',  primary: '#f59e0b', secondary: '#fb923c', glow: 'rgba(245, 158, 11, 0.3)' },
  '🦊': { name: 'Forest',    primary: '#ea580c', secondary: '#a16207', glow: 'rgba(234, 88, 12, 0.3)' },
  '🐻': { name: 'Honey',     primary: '#d97706', secondary: '#b45309', glow: 'rgba(217, 119, 6, 0.3)' },
  '🦁': { name: 'Savanna',   primary: '#f97316', secondary: '#eab308', glow: 'rgba(249, 115, 22, 0.3)' },
  '🐰': { name: 'Blossom',   primary: '#f472b6', secondary: '#c084fc', glow: 'rgba(244, 114, 182, 0.3)' },
  '🐸': { name: 'Lily Pad',  primary: '#22c55e', secondary: '#14b8a6', glow: 'rgba(34, 197, 94, 0.3)' },
  '🦄': { name: 'Unicorn',   primary: '#e879f9', secondary: '#a78bfa', glow: 'rgba(232, 121, 249, 0.3)' },
  '🐼': { name: 'Bamboo',    primary: '#5ce0d8', secondary: '#a7f3d0', glow: 'rgba(92, 224, 216, 0.3)' },
  '🐶': { name: 'Puppy',     primary: '#38bdf8', secondary: '#94a3b8', glow: 'rgba(56, 189, 248, 0.3)' },
  '🐱': { name: 'Kitten',    primary: '#fb923c', secondary: '#fda4af', glow: 'rgba(251, 146, 60, 0.3)' },
  '🦋': { name: 'Garden',    primary: '#8b5cf6', secondary: '#38bdf8', glow: 'rgba(139, 92, 246, 0.3)' },
  '🌟': { name: 'Starlight', primary: '#facc15', secondary: '#1e1b4b', glow: 'rgba(250, 204, 21, 0.3)' },
  '🚀': { name: 'Space',     primary: '#3b82f6', secondary: '#7c3aed', glow: 'rgba(59, 130, 246, 0.3)' },
  '🎨': { name: 'Rainbow',   primary: '#ff6b6b', secondary: '#5ce0d8', glow: 'rgba(255, 107, 107, 0.3)' },
};

// Default theme (matches the original app colors)
const DEFAULT_THEME = { name: 'Default', primary: '#ff6b6b', secondary: '#5ce0d8', glow: 'rgba(255, 107, 107, 0.3)' };

export function getThemeForProfile(profile) {
  if (!profile) return DEFAULT_THEME;
  // Explicit theme override takes priority
  if (profile.theme && THEMES[profile.theme]) {
    return THEMES[profile.theme];
  }
  // Fall back to avatar-mapped theme
  if (profile.avatar && THEMES[profile.avatar]) {
    return THEMES[profile.avatar];
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--accent-coral', theme.primary);
  root.style.setProperty('--accent-orange', theme.primary);
  root.style.setProperty('--accent-mint', theme.secondary);
  root.style.setProperty('--theme-glow', theme.glow);
}

export function clearTheme() {
  const root = document.documentElement;
  root.style.removeProperty('--accent-coral');
  root.style.removeProperty('--accent-orange');
  root.style.removeProperty('--accent-mint');
  root.style.removeProperty('--theme-glow');
}
