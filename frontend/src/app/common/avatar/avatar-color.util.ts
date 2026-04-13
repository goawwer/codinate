const COLORS = ['#F4D451', '#EA5A4F', '#659962', '#844D6C', '#BA5F64', '#EB7D52', '#B7BEAE'];

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
