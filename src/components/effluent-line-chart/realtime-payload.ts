import type {
  VariableYStepChartPayload,
  VariableYStepSeriesItem,
} from '../variable-y-step-line-chart';

const DEFAULT_MAX_POINTS = 15 * 60;

/** 从 changeData / props.data 中解析可用载荷 */
export const resolveIncomingData = (nextData: unknown): VariableYStepChartPayload | any[] | null => {
  if (nextData == null) {
    return null;
  }

  if (Array.isArray(nextData)) {
    return nextData;
  }

  if (typeof nextData === 'object') {
    const payload = nextData as VariableYStepChartPayload & { data?: unknown };

    if (Array.isArray(payload.series) && Array.isArray(payload.xAxis)) {
      return payload;
    }

    if (payload.data && typeof payload.data === 'object') {
      const nested = payload.data as VariableYStepChartPayload;

      if (Array.isArray(nested.series) && Array.isArray(nested.xAxis)) {
        return nested;
      }

      if (Array.isArray(payload.data)) {
        return payload.data;
      }
    }
  }

  return null;
};

const asPayloadObject = (value: unknown): VariableYStepChartPayload =>
  Object.prototype.toString.call(value) === '[object Object]'
    ? (value as VariableYStepChartPayload)
    : {};

const asPayloadArray = <T,>(value: unknown): T[] =>
  Object.prototype.toString.call(value) === '[object Array]' ? (value as T[]) : [];

/** 合并用：按 topic → data → init_data 取系列值，空数组可作 fallback */
const pickMergeSeriesValues = (
  seriesItem: VariableYStepSeriesItem | undefined,
  topic?: string,
): Array<number | null> => {
  if (!seriesItem || typeof seriesItem !== 'object') {
    return [];
  }

  const keys = topic ? [topic, 'data', 'init_data'] : ['data', 'init_data'];
  let fallback: Array<number | null> | null = null;

  for (let i = 0; i < keys.length; i += 1) {
    const arr = seriesItem[keys[i]];
    if (!Array.isArray(arr)) {
      continue;
    }
    if (arr.length) {
      return arr as Array<number | null>;
    }
    if (fallback == null) {
      fallback = arr as Array<number | null>;
    }
  }

  return fallback || [];
};

const resolveMergeTopic = (
  incoming: VariableYStepChartPayload,
  previous: VariableYStepChartPayload,
): string | undefined => {
  const nextTopic = typeof incoming.topic === 'string' && incoming.topic.trim()
    ? incoming.topic.trim()
    : '';
  const prevTopic = typeof previous.topic === 'string' && previous.topic.trim()
    ? previous.topic.trim()
    : '';
  return nextTopic || prevTopic || undefined;
};

/** 将 xAxis / series 裁到最近 maxPoints 个点，供 init_data 与增量拼接后使用 */
const trimRealtimePayload = (
  qtc: VariableYStepChartPayload | null | undefined,
  maxPoints: number,
): VariableYStepChartPayload => {
  const source = asPayloadObject(qtc);
  const xAxis = asPayloadArray<string>(source.xAxis);
  const limit = Number(maxPoints) > 0 ? Number(maxPoints) : DEFAULT_MAX_POINTS;
  const start = xAxis.length > limit ? xAxis.length - limit : 0;
  const trimmedX = start > 0 ? xAxis.slice(start) : xAxis.slice();
  const len = trimmedX.length;
  const topic =
    typeof source.topic === 'string' && source.topic.trim() !== ''
      ? source.topic.trim()
      : undefined;

  return {
    ...source,
    xAxis: trimmedX,
    legend: asPayloadArray<VariableYStepSeriesItem>(source.series)
      .map((item) => (item && item.name != null ? String(item.name) : ''))
      .filter(Boolean),
    series: asPayloadArray<VariableYStepSeriesItem>(source.series).map((item) => {
      if (!item || typeof item !== 'object') {
        return item;
      }
      const next = { ...item };
      const values = pickMergeSeriesValues(item, topic);
      const aligned = values.length > start ? values.slice(start) : values.slice();
      const synced = aligned.length > len ? aligned.slice(-len) : aligned;
      if (Array.isArray(item.data) || topic === 'data' || !topic) {
        next.data = synced;
      }
      if (Array.isArray(item.init_data) || topic === 'init_data') {
        next.init_data = synced.slice();
      }
      if (!Array.isArray(next.data) && !Array.isArray(next.init_data)) {
        next.data = synced;
      }
      return next;
    }),
  };
};

/**
 * 合并 ws_data / changeData 的 QTC 载荷：
 * - 短横轴（≤5）且系列名有交集：append 后裁窗
 * - 整窗快照 / 系列名不重叠：直接替换后裁窗
 * - 无横轴：保留已有窗口
 */
export const mergeRealtimePayload = (
  prevQtc: VariableYStepChartPayload | null | undefined,
  incomingQtc: VariableYStepChartPayload,
  maxPoints: number,
): VariableYStepChartPayload => {
  const prev = asPayloadObject(prevQtc);
  const next = asPayloadObject(incomingQtc);
  const nextX = asPayloadArray<string>(next.xAxis);
  if (!nextX.length) {
    return trimRealtimePayload(prev, maxPoints);
  }

  const prevX = asPayloadArray<string>(prev.xAxis);
  const nextSeries = asPayloadArray<VariableYStepSeriesItem>(next.series);
  const topic = resolveMergeTopic(next, prev);

  const incomingValueLens = nextSeries.map((item) => pickMergeSeriesValues(item, topic).length);
  const maxIncomingVals = incomingValueLens.length
    ? Math.max.apply(null, incomingValueLens)
    : 0;

  const isIncremental =
    prevX.length > 0 &&
    nextX.length <= 5 &&
    maxIncomingVals > 0 &&
    maxIncomingVals <= nextX.length;

  const prevNames = new Set(
    asPayloadArray<VariableYStepSeriesItem>(prev.series)
      .map((item) => (item && item.name != null ? String(item.name) : ''))
      .filter(Boolean),
  );
  const hasNameOverlap = nextSeries.some(
    (item) => item && item.name != null && prevNames.has(String(item.name)),
  );

  if (!isIncremental || !hasNameOverlap) {
    return trimRealtimePayload({
      ...prev,
      ...next,
      topic: topic || next.topic || prev.topic,
      xAxis: nextX,
      series: nextSeries.map((item) =>
        item && typeof item === 'object' ? { ...item } : item,
      ),
    }, maxPoints);
  }

  const mergedX = prevX.concat(nextX);
  const seriesMap = new Map<string, VariableYStepSeriesItem>();

  asPayloadArray<VariableYStepSeriesItem>(prev.series).forEach((item, i) => {
    seriesMap.set(item && item.name != null ? String(item.name) : `s_${i}`, { ...item });
  });

  nextSeries.forEach((item, i) => {
    const name = item && item.name != null ? String(item.name) : `s_${i}`;
    const prevItem = seriesMap.get(name);
    const addPts = pickMergeSeriesValues(item, topic);
    if (!prevItem) {
      const seeded: VariableYStepSeriesItem = item && typeof item === 'object' ? { ...item } : { name };
      const pts = addPts.slice();
      seeded.data = pts;
      seeded.init_data = pts.slice();
      seriesMap.set(name, seeded);
      return;
    }
    const mergedPts = pickMergeSeriesValues(prevItem, topic).concat(addPts);
    const merged = { ...prevItem, ...item };
    merged.data = mergedPts;
    merged.init_data = mergedPts.slice();
    seriesMap.set(name, merged);
  });

  return trimRealtimePayload({
    ...prev,
    ...next,
    topic: topic || next.topic || prev.topic,
    xAxis: mergedX,
    series: Array.from(seriesMap.values()),
  }, maxPoints);
};
