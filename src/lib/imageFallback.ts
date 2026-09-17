const FALLBACK_IMAGE_SRC =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iNDgwIiB2aWV3Qm94PSIwIDAgNjQwIDQ4MCI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSI0ODAiIGZpbGw9IiNmM2YzZjMiLz48cGF0aCBkPSJNMjIwIDMxNWw3NS04MiA1MiA1NCAzNS0zOCA1OCA2NkgyMjB6IiBmaWxsPSIjZDVkOWQ5Ii8+PGNpcmNsZSBjeD0iMjY4IiBjeT0iMTc2IiByPSIyOCIgZmlsbD0iI2Q1ZDlkOSIvPjx0ZXh0IHg9IjMyMCIgeT0iMzcwIiBmaWxsPSIjNTY1OTU5IiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgdW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+';

export function recoverImage(image: HTMLImageElement, preferredSource?: string) {
  image.removeAttribute('srcset');
  image.removeAttribute('sizes');

  const preferredUrl = preferredSource
    ? new URL(preferredSource, document.baseURI).href
    : undefined;

  if (preferredUrl && image.src !== preferredUrl && image.dataset.fallbackStage !== 'product') {
    image.dataset.fallbackStage = 'product';
    image.src = preferredSource!;
    return;
  }

  image.onerror = null;
  image.dataset.fallbackStage = 'placeholder';
  image.src = FALLBACK_IMAGE_SRC;
}
