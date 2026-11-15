// Design tokens for Project Serenity (Section 3 of the build prompt).
export const palette = {
  primary: '#4C639B',
  primaryDark: '#2F416E',
  success: '#00662F',
  teal: '#0E9B7A',
  orange: '#F28C1B',
  navy: '#16295F',
  heading: '#0A2A1F',
  body: '#555555',
  lightGreen: '#E4F5D9',
  amber: '#F5A623',
  red: '#D64545',
  green: '#2E9D5B',
  white: '#FFFFFF',
  sky: '#DCEBFA',
  border: '#E3E8F0',
  cream: '#FBF6E9',
};

export type ThemeMode = {
  dyslexia: boolean;
  highContrast: boolean;
  dark: boolean;
  fontScale: number; // 1 to 2
};

export function makeTheme(m: ThemeMode) {
  const dark = m.dark;
  const hc = m.highContrast;
  const colors = {
    ...palette,
    bgTop: dark ? '#0D1626' : m.dyslexia ? palette.cream : hc ? '#FFFFFF' : palette.sky,
    bgBottom: dark ? '#0D1626' : m.dyslexia ? palette.cream : '#FFFFFF',
    card: dark ? '#18233A' : m.dyslexia ? '#FFFDF7' : '#FFFFFF',
    heading: dark ? '#F2F5FA' : hc ? '#000000' : palette.heading,
    body: dark ? '#C9D2E3' : hc ? '#111111' : palette.body,
    primary: hc ? palette.primaryDark : dark ? '#8EA6E0' : palette.primary,
    onPrimary: dark && !hc ? '#0D1626' : '#FFFFFF',
    border: dark ? '#2A3754' : hc ? '#333333' : palette.border,
    selected: dark ? '#1F4A33' : palette.lightGreen,
    success: dark ? '#5FD08F' : palette.success,
    warnText: dark ? '#F5C26B' : '#8A5A00',
    dangerSoft: dark ? '#3A1C22' : '#FDECEC',
  };
  const fontRegular = m.dyslexia ? 'AtkinsonHyperlegible_400Regular' : 'PlusJakartaSans_400Regular';
  const fontBold = m.dyslexia ? 'AtkinsonHyperlegible_700Bold' : 'PlusJakartaSans_700Bold';
  const s = m.fontScale;
  return {
    colors,
    fonts: { regular: fontRegular, bold: fontBold },
    size: { body: 16 * s, small: 14 * s, h1: 26 * s, h2: 20 * s, h3: 17 * s },
    letterSpacing: m.dyslexia ? 0.6 : 0,
    lineHeight: m.dyslexia ? 1.7 : 1.4,
    radius: 24,
    dark,
  };
}

export type Theme = ReturnType<typeof makeTheme>;
