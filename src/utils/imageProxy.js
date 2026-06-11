export function proxyImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}
