/**
 * Pre-scale cover art to output resolution in the browser (JPEG).
 * Smaller input → faster FFmpeg write + encode for static-image videos.
 */
export async function renderCoverArtJpeg(imageSource, width, height, background = 'black', customBackground = null) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (background === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  } else if (background === 'custom' && customBackground) {
    const bgImg = await loadImageSource(customBackground);
    drawCover(ctx, bgImg, width, height);
  } else {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }

  const img = await loadImageSource(imageSource);
  const scale = Math.min(width / img.width, height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode cover image'))),
      'image/jpeg',
      0.88
    );
  });

  return new Uint8Array(await blob.arrayBuffer());
}

function loadImageSource(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl = null;

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    if (source instanceof Blob || source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Unsupported image source'));
    }
  });
}

function drawCover(ctx, img, width, height) {
  const scale = Math.max(width / img.width, height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}
