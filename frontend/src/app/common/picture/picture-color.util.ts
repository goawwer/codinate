const COLORS = [
  '#3F6FB5',
  '#5B74A6',
  '#5E8B7E',
  '#6D8A55',
  '#A66A43',
  '#B05D55',
  '#9B5E75',
  '#7A638F',
  '#4E8C92',
  '#6F7D8A',
  '#8B6F47',
];

export function avatarLetters(name: string, surname: string): string {
  const parts = `${name} ${surname}`.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase() || '?';
}

export function avatarColor(letters: string): string {
  const a = letters[0]?.codePointAt(0) ?? 65;
  const b = letters[1]?.codePointAt(0) ?? 48;
  return COLORS[(a + b) % COLORS.length];
}
