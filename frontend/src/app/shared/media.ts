export function resolveMediaUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.replace(/^\/+/, ''), document.baseURI).href;
}

export function fallbackImage(event: Event): void {
  const image = event.target as HTMLImageElement;
  const fallback = resolveMediaUrl('ProdutoSemImagem.webp');
  if (image.src !== fallback) image.src = fallback;
}
