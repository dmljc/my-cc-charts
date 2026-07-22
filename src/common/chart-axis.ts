/**
 * Y 轴最大值向上取整（各区间均用「比数量级小一档」的步长，保证曲线起伏更明显）：
 * - (0, 10]  → floor(value) + 1，且不超过 10（4.86→5）
 * - 其他     → step = 10^(floor(log10(value)) - 1)
 *              上限 = floor(value/step)*step + step
 *
 * 示例：
 * - 十几/几十：step=1   → 50→51，99→100
 * - 一百多：  step=10  → 105→110，156→160
 * - 一千多：  step=100 → 3500→3600
 * - 一万多：  step=1000→ 15000→16000
 *
 * 左侧刻度始终三档：0 / 中值 / 最大值
 */
export const getNiceAxisMax = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  if (value <= 10) {
    return Math.min(Math.floor(value) + 1, 10);
  }

  const exp = Math.floor(Math.log10(value));
  const step = 10 ** Math.max(exp - 1, 0);

  return Math.floor(value / step) * step + step;
};

/**
 * 生成 Y 轴三档刻度：最小值 / 中值 / 最大值
 * 例：上限 5 → [0, 2.5, 5]；上限 110 → [0, 55, 110]
 */
export const buildNiceAxisTicks = (axisMin: number, axisMax: number): number[] => {
  const min = Number.isFinite(axisMin) ? axisMin : 0;
  const max = Number.isFinite(axisMax) && axisMax > min ? axisMax : min + 1;
  const mid = parseFloat(((min + max) / 2).toPrecision(12));

  return [min, mid, max];
};
