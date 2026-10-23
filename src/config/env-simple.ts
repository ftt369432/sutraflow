export function getMode(): string {
  return import.meta.env.MODE || 'development';
}
