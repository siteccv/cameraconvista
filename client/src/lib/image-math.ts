export interface ImageMathResult {
  imgW: number;
  imgH: number;
  imgLeft: number;
  imgTop: number;
  overflowX: number;
  overflowY: number;
  minZoom: number;
}

export function calculateImageMath(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
  zoom: number,
  panX: number,
  panY: number,
  referenceWidth?: number,
): ImageMathResult {
  if (naturalW <= 0 || naturalH <= 0 || containerW <= 0 || containerH <= 0) {
    return { imgW: 0, imgH: 0, imgLeft: 0, imgTop: 0, overflowX: 0, overflowY: 0, minZoom: 100 };
  }

  const sizeW =
    referenceWidth && referenceWidth > 0 ? Math.max(referenceWidth, containerW) : containerW;

  const baseW = sizeW;
  const baseH = sizeW * (naturalH / naturalW);

  const minZoomX = (sizeW / baseW) * 100;
  const minZoomY = baseH < containerH ? Math.ceil((containerH / baseH) * 100) : 100;
  const minZoom = Math.max(minZoomX, minZoomY);

  const effectiveZoom = Math.max(minZoom, zoom);
  const zoomFactor = effectiveZoom / 100;
  const imgW = baseW * zoomFactor;
  const imgH = baseH * zoomFactor;

  const overflowX = Math.max(0, imgW - containerW);
  const overflowY = Math.max(0, imgH - containerH);

  const clampedPanX = overflowX > 0 ? Math.max(-100, Math.min(100, panX)) : 0;
  const clampedPanY = overflowY > 0 ? Math.max(-100, Math.min(100, panY)) : 0;

  const translateX = (clampedPanX / 100) * (overflowX / 2);
  const translateY = (clampedPanY / 100) * (overflowY / 2);

  const imgLeft = (containerW - imgW) / 2 + translateX;
  const imgTop = (containerH - imgH) / 2 + translateY;

  return { imgW, imgH, imgLeft, imgTop, overflowX, overflowY, minZoom };
}
