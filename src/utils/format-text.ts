export function conditionallyUnderline(
  text: string,
  condition: boolean
): string {
  return condition ? `__${text}__` : text;
}
