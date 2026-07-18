/** 折线/时序默认滑动窗口上限，防止 WebSocket 长时间推送导致内存膨胀 */
export const MAX_CHART_POINTS = 1000;

/** 日志/告警等列表默认上限 */
export const MAX_LIST_ITEMS = 200;

/** 超过该点数时关闭折线 symbol，降低图元与绘制开销 */
export const CHART_SYMBOL_POINT_THRESHOLD = 80;

/**
 * 保留数组末尾最多 max 条；未超限时返回原引用，避免无意义拷贝。
 */
export function sliceWindow<T>(list: T[] | null | undefined, max: number): T[] {
  if (!Array.isArray(list)) {
    return [];
  }

  if (list.length <= max) {
    return list;
  }

  return list.slice(-max);
}

/**
 * 将 changeData / props 传入的列表裁剪到上限后再写入 state。
 */
export function normalizeListData<T>(
  list: T[] | null | undefined,
  max: number = MAX_LIST_ITEMS,
): T[] {
  return sliceWindow(list, max);
}
