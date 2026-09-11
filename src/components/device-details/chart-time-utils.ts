/**
 * 设备详情折线图共用的时间轴 / dataZoom 工具。
 */

export interface LineChartLayout {
  left: number;
  right: number;
  sliderRight: number;
  dateHeight: number;
  dataZoomTop: number;
  dataZoomHeight: number;
}

const STAGE_WIDTH = 1400;
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;
const MS_MINUTE = 60 * 1000;

/** 判定「已贴齐当前时间」的容差 */
export const NOW_PAGE_EPSILON_MS = 1000;

export function clampTimeToNow(ms: number, nowMs = Date.now()): number {
  return Math.min(ms, nowMs);
}

export function getStageScale(el: HTMLElement): number {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const type = getComputedStyle(node).containerType;
    if (type === 'size' || type === 'inline-size') {
      return node.clientWidth / STAGE_WIDTH;
    }
    node = node.parentElement;
  }
  return 1;
}

export function getLineChartLayout(scale: number): LineChartLayout {
  const dateHeight = 4 * scale;
  const sideGutter = 56 * scale;
  const extraCanvas = 20 * scale;
  const left = 32 * scale + sideGutter - extraCanvas;
  const right = 16 * scale + sideGutter - extraCanvas;
  return {
    left,
    right,
    sliderRight: right,
    dateHeight,
    dataZoomTop: dateHeight + 4 * scale,
    dataZoomHeight: Math.max(28 * scale, 24),
  };
}

export function padTimeExtent(
  extent: [number, number] | null,
  totalRangeDays: number,
  endMs = Date.now(),
): [number, number] {
  const span = Math.max(totalRangeDays, 0) * MS_DAY;
  const now = Date.now();
  const end = clampTimeToNow(extent ? extent[1] : endMs, now);
  if (span <= 0) {
    return [end, end];
  }
  return [end - span, end];
}

export function computeViewExtent(
  sliderEndMs: number,
  axisRangeMs: number,
  maxEndMs = Date.now(),
): [number, number] {
  const window = Math.max(axisRangeMs, 0);
  const end = clampTimeToNow(sliderEndMs, maxEndMs);
  return [end - window, end];
}

export function pageViewExtent(
  current: [number, number],
  direction: -1 | 1,
  axisRangeMs: number,
  bounds: [number, number],
  maxEndMs = Date.now(),
): [number, number] {
  const span = Math.max(axisRangeMs, 0);
  if (span <= 0) {
    return current;
  }
  const boundStart = Math.min(bounds[0], bounds[1]);
  const boundEnd = clampTimeToNow(Math.max(bounds[0], bounds[1]), maxEndMs);
  if (direction < 0) {
    const end = current[0];
    const start = end - span;
    if (start < boundStart) {
      return current;
    }
    return [start, end];
  }
  if (current[1] >= boundEnd - NOW_PAGE_EPSILON_MS) {
    return current;
  }
  const end = Math.min(current[1] + span, boundEnd);
  if (end <= current[1]) {
    return current;
  }
  return [end - span, end];
}

export function buildTimeAxisTicks(min: number, max: number, intervalMs = MS_MINUTE): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return [];
  }
  if (max === min || intervalMs <= 0) {
    return [min];
  }
  const ticks = [min];
  let next = Math.floor(min / intervalMs) * intervalMs + intervalMs;
  if (next <= min) {
    next += intervalMs;
  }
  while (next < max) {
    ticks.push(next);
    next += intervalMs;
  }
  ticks.push(max);
  return ticks;
}

export function computeDefaultZoom(
  extent: [number, number] | null,
  windowMs: number,
): { start: number; end: number } {
  if (!extent) {
    return { start: 0, end: 100 };
  }
  const span = extent[1] - extent[0];
  if (span <= 0) {
    return { start: 0, end: 100 };
  }
  const window = Math.min(span, Math.max(windowMs, 0));
  const start = ((extent[1] - window - extent[0]) / span) * 100;
  return { start: Math.max(0, start), end: 100 };
}

export function snapZoomWindowDays(
  startMs: number,
  endMs: number,
  extent: [number, number],
): { start: number; end: number; from: number; to: number } {
  const total = extent[1] - extent[0];
  const fallback = {
    start: 0,
    end: 100,
    from: extent[0],
    to: extent[1],
  };
  if (total <= 0) {
    return fallback;
  }
  const snapToDay = (ms: number) => extent[0] + Math.round((ms - extent[0]) / MS_DAY) * MS_DAY;
  let from = Math.min(Math.max(snapToDay(startMs), extent[0]), extent[1] - MS_DAY);
  let to = Math.min(Math.max(snapToDay(endMs), extent[0] + MS_DAY), extent[1]);
  if (to - from < MS_DAY) {
    to = from + MS_DAY;
    if (to > extent[1]) {
      to = extent[1];
      from = to - MS_DAY;
    }
  }
  return {
    start: ((from - extent[0]) / total) * 100,
    end: ((to - extent[0]) / total) * 100,
    from,
    to,
  };
}

export function formatAxisTime(value: number): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  if (hour === 0 && minute === 0 && second === 0) {
    return `${month}/${day}`;
  }
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  if (second !== 0) {
    const ss = String(second).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}`;
}

export function formatTooltipTime(value: number): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

export function formatRangeDate(value: number): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function formatRangeDuration(startMs: number, endMs: number): string {
  const span = Math.max(0, endMs - startMs);
  if (span >= MS_DAY) {
    return `${Math.max(Math.round(span / MS_DAY), 1)}天`;
  }
  if (span >= MS_HOUR) {
    return `${Math.max(Math.round(span / MS_HOUR), 1)}小时`;
  }
  if (span >= MS_MINUTE) {
    return `${Math.max(Math.round(span / MS_MINUTE), 1)}分钟`;
  }
  return `${Math.max(Math.round(span / 1000), 1)}秒`;
}

function trimDecimal(text: string): string {
  if (!text.includes('.')) {
    return text;
  }
  return text.replace(/0+$/, '').replace(/\.$/, '');
}

export function formatYAxisValue(value: number, span?: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  const abs = Math.abs(value);
  const unit = abs >= 10000 ? 10000 : abs >= 1000 ? 1000 : 0;
  if (unit) {
    const relativeSpan =
      span != null && Number.isFinite(span) && span > 0 ? Math.abs(span) / unit : 1;
    const digits = Math.min(4, Math.max(0, Math.ceil(-Math.log10(relativeSpan))));
    const suffix = unit === 10000 ? 'w' : 'k';
    return `${trimDecimal((value / unit).toFixed(digits))}${suffix}`;
  }
  if (Math.abs(value - Math.round(value)) < 1e-8) {
    return String(Math.round(value));
  }
  if (abs >= 100) {
    return trimDecimal(value.toFixed(1));
  }
  if (abs >= 1) {
    return trimDecimal(value.toFixed(2));
  }
  return trimDecimal(value.toFixed(4));
}
