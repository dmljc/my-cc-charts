const cleanNumber = (value: number): number => parseFloat(value.toPrecision(12));

const ceilByStep = (value: number, step: number): number => {
  const floored = Math.floor(value / step + 1e-12);
  return cleanNumber((floored + 1) * step);
};

const floorByStep = (value: number, step: number): number => {
  const floored = Math.floor(value / step + 1e-12);
  return cleanNumber(floored * step);
};

/** 向上对齐到步长，值已落在刻度上时不再多跨一档 */
const ceilToStep = (value: number, step: number): number => {
  const ceiled = Math.ceil(value / step - 1e-12);
  return cleanNumber(ceiled * step);
};

/** 按数据量程取更细步长，让 Y 轴贴近曲线而不是两端大块留白 */
const getNiceRangeStep = (span: number): number => {
  if (!Number.isFinite(span) || span <= 0) {
    return 1;
  }

  return 10 ** (Math.floor(Math.log10(span)) - 1);
};

/** 按量程选择取整步长，保证曲线起伏可见 */
export const getNiceAxisStep = (span: number): number => {
  if (!Number.isFinite(span) || span <= 0) {
    return 1;
  }

  if (span <= 1) {
    return 10 ** Math.floor(Math.log10(span));
  }

  if (span <= 10) {
    return 1;
  }

  const exp = Math.floor(Math.log10(span));
  return 10 ** Math.max(exp - 1, 0);
};

/**
 * Y 轴最大值按接口数据最大值向上取整：
 * - (0, 1]   → 按当前小数数量级步进（0.003→0.004，0.5→0.6）
 * - (1, 10]  → floor(value) + 1，且不超过 10（4.86→5）
 * - 其他     → step = 10^(floor(log10(value)) - 1)
 *              上限 = floor(value/step)*step + step
 *
 * 示例：
 * - 十几/几十：step=1   → 50→51，99→100
 * - 一百多：  step=10  → 105→110，156→160
 * - 一千多：  step=100 → 3500→3600
 * - 一万多：  step=1000→ 15000→16000
 *
 * 左侧刻度始终三档：最小值 / 中值 / 最大值
 */
export const getNiceAxisMax = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  if (value <= 1) {
    return ceilByStep(value, getNiceAxisStep(value));
  }

  if (value <= 10) {
    return Math.min(Math.floor(value) + 1, 10);
  }

  return ceilByStep(value, getNiceAxisStep(value));
};

/** 两端只留少量余量，避免曲线贴边的同时尽量放大波动 */
const AXIS_RANGE_PAD_RATIO = 0.05;

/**
 * 按当前窗口数据的最小/最大值生成 Y 轴量程：
 * - 两端各留约 5% 余量
 * - 用比量程小一档的步长取整，避免 0.01 这种粗步进把曲线压扁
 * - 上限按真实 ceil，不再额外多跨一档
 * - 全为同一值时，在该值上下各扩一档
 * - 数据全非负时，下限不落到负数
 */
export const buildNiceAxisRange = (
  dataMin: number,
  dataMax: number,
): { min: number; max: number } => {
  const hasMin = Number.isFinite(dataMin);
  const hasMax = Number.isFinite(dataMax);

  if (!hasMin && !hasMax) {
    return { min: 0, max: 1 };
  }

  const lo = hasMin ? dataMin : (hasMax ? dataMax : 0);
  const hi = hasMax ? dataMax : lo;
  const actualMin = Math.min(lo, hi);
  const actualMax = Math.max(lo, hi);
  const span = actualMax - actualMin;
  const allNonNegative = actualMin >= 0;

  if (!(span > 0)) {
    const step = getNiceRangeStep(Math.abs(actualMax) || 1);
    let min = floorByStep(actualMax - step, step);
    let max = ceilToStep(actualMax + step, step);

    if (allNonNegative && min < 0) {
      min = 0;
      max = actualMax === 0 ? step : ceilToStep(actualMax + step, step);
    }
    if (!(max > min)) {
      max = cleanNumber(min + step);
    }

    return { min, max };
  }

  const step = getNiceRangeStep(span);
  const paddedMin = actualMin - span * AXIS_RANGE_PAD_RATIO;
  const paddedMax = actualMax + span * AXIS_RANGE_PAD_RATIO;
  let min = floorByStep(paddedMin, step);
  let max = ceilToStep(paddedMax, step);

  if (allNonNegative && min < 0) {
    min = 0;
  }
  if (!(max > min)) {
    max = cleanNumber(min + step);
  }

  return { min, max };
};

/** 轴线/提示数值展示：避免 0.003 被 toFixed(2) 显示成 0 */
export const formatAxisNumber = (value: number | string | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return String(value);
  }
  if (num === 0) {
    return '0';
  }

  const abs = Math.abs(num);
  if (abs >= 100) {
    return String(Math.round(num));
  }
  if (abs >= 1) {
    return String(parseFloat(num.toFixed(2)));
  }

  return String(parseFloat(num.toPrecision(3)));
};

/**
 * 生成 Y 轴三档刻度：最小值 / 中值 / 最大值
 * 例：量程 0.21~0.26 → [0.207, 0.235, 0.263]
 */
export const buildNiceAxisTicks = (axisMin: number, axisMax: number): number[] => {
  const min = Number.isFinite(axisMin) ? axisMin : 0;
  const max = Number.isFinite(axisMax) && axisMax > min ? axisMax : min + 1;
  const mid = parseFloat(((min + max) / 2).toPrecision(12));

  return [min, mid, max];
};
