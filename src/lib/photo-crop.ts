import type { BillCropRect } from '../../modules/bill-scanner';

type Size = { width: number; height: number };

export function getContainRect(view: Size, aspect: number): BillCropRect {
  if (view.width <= 0 || view.height <= 0 || aspect <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const viewAspect = view.width / view.height;
  const width = viewAspect > aspect ? view.height * aspect : view.width;
  const height = width / aspect;

  return {
    x: (view.width - width) / 2,
    y: (view.height - height) / 2,
    width,
    height,
  };
}

export function mapGuideToPhoto(
  guide: BillCropRect,
  view: Size,
  photo: Size,
): BillCropRect {
  const preview = getContainRect(view, photo.width / photo.height);
  if (preview.width <= 0 || preview.height <= 0) {
    return { x: 0, y: 0, width: photo.width, height: photo.height };
  }

  const scaleX = photo.width / preview.width;
  const scaleY = photo.height / preview.height;

  const x = Math.max(0, Math.min(photo.width - 1, (guide.x - preview.x) * scaleX));
  const y = Math.max(0, Math.min(photo.height - 1, (guide.y - preview.y) * scaleY));
  const width = Math.max(1, Math.min(photo.width - x, guide.width * scaleX));
  const height = Math.max(1, Math.min(photo.height - y, guide.height * scaleY));

  return { x, y, width, height };
}
