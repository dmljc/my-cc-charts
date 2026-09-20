import type { RoomTrendSeriesItem } from './interface';

/** 与 iPad 一致：初始拉取 1 天 */
export const TREND_SLIDER_RANGE_MS = 24 * 60 * 60 * 1000;

const SERIES_COLORS = ['#3BA7FF', '#F0C040', '#6BC7A6', '#EE8C45', '#8B5FD3'];

export interface DeviceTrendQuery {
  deviceId: number;
  propertyId: string;
  from: number;
  to: number;
  /** 页面配置的 API 根地址；留空则走同域 `/api/...` */
  apiBaseUrl?: string;
}

export interface DeviceTrendPoint {
  time: number;
  value: number;
}

const normalizeApiBaseUrl = (value?: string | null): string => {
  if (value == null) {
    return '';
  }
  return String(value).trim().replace(/\/+$/, '');
};

const unwrapApiData = (json: unknown): unknown => {
  if (!json || typeof json !== 'object') {
    return json;
  }
  const body = json as Record<string, unknown>;
  if ('code' in body) {
    const code = Number(body.code);
    if (code === 200 || code === 0) {
      return 'data' in body ? body.data : undefined;
    }
    throw new Error(String(body.message || body.msg || '请求失败'));
  }
  return 'data' in body ? body.data : body;
};

/**
 * GET `{apiBase}/api/iiot/tablet/device/{deviceId}/trend?propertyId=&from=&to=`
 * apiBase 来自页面配置（卡片 deviceDetailsApiBaseUrl / 详情 apiBaseUrl）；
 * 留空则请求当前页同域 `/api/...`。
 */
export async function listDeviceTrend(query: DeviceTrendQuery): Promise<unknown> {
  const { deviceId, propertyId, from, to, apiBaseUrl } = query;
  const params = new URLSearchParams({
    propertyId: String(propertyId),
    from: String(from),
    to: String(to),
  });
  const base = normalizeApiBaseUrl(apiBaseUrl);
  const path = `/api/iiot/tablet/device/${deviceId}/trend?${params.toString()}`;
  const url = base ? `${base}${path}` : path;

  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`trend 请求失败: HTTP ${response.status}`);
  }

  const json = await response.json();
  return unwrapApiData(json);
}

const toTrendTime = (raw: unknown): number => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 0 && raw < 1e12 ? raw * 1000 : raw;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return Number.NaN;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric > 0 && numeric < 1e12 ? numeric * 1000 : numeric;
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }
  return Number.NaN;
};

const parseTrendPoint = (item: unknown): DeviceTrendPoint | null => {
  if (Array.isArray(item) && item.length >= 2) {
    const time = toTrendTime(item[0]);
    const value = Number(item[1]);
    if (Number.isFinite(time) && Number.isFinite(value)) {
      return { time, value };
    }
    return null;
  }
  if (!item || typeof item !== 'object') {
    return null;
  }
  const record = item as Record<string, unknown>;
  const time = toTrendTime(
    record.time ?? record.timestamp ?? record.ts ?? record.dataTime ?? record.t ?? record.x,
  );
  const value = Number(record.value ?? record.y ?? record.val ?? record.v);
  if (!Number.isFinite(time) || !Number.isFinite(value)) {
    return null;
  }
  return { time, value };
};

const parseTrendPointList = (list: unknown[]): DeviceTrendPoint[] => {
  const direct = list
    .map(parseTrendPoint)
    .filter((item): item is DeviceTrendPoint => item !== null);
  if (direct.length) {
    return direct;
  }
  const nested: DeviceTrendPoint[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const child = record.points ?? record.data ?? record.values ?? record.list;
    if (Array.isArray(child)) {
      nested.push(...parseTrendPointList(child));
    }
  }
  return nested;
};

const getTrendColor = (index: number): string =>
  SERIES_COLORS[index % SERIES_COLORS.length] || '#3BA7FF';

const toSegmentSeriesName = (
  item: Record<string, unknown>,
  index: number,
  fallbackName: string,
): string => {
  const room = String(item.room ?? item.roomName ?? '').trim();
  if (room) {
    return room.indexOf('房间') === 0 ? room : `房间${room}`;
  }
  const deviceName = String(item.deviceName ?? item.deviceCode ?? '').trim();
  if (deviceName) {
    return deviceName;
  }
  if (fallbackName) {
    return fallbackName;
  }
  return `分段${index + 1}`;
};

/**
 * 对齐 iPad：优先 data.segments[].points；兼容 series / 点数组。
 */
export function toTrendChartSeries(
  data: unknown,
  options?: {
    range?: { from: number; to: number };
    seriesName?: string;
  },
): RoomTrendSeriesItem[] {
  const range = options && options.range;
  const seriesName = (options && options.seriesName) || '设备';
  const filterRange = (points: DeviceTrendPoint[]) => {
    if (!range) {
      return points;
    }
    return points.filter((point) => point.time >= range.from && point.time <= range.to);
  };

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.segments) && record.segments.length > 0) {
      const colorByName = new Map<string, string>();
      return record.segments
        .map((row, index) => {
          const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
          const name = toSegmentSeriesName(item, index, seriesName);
          let color = colorByName.get(name);
          if (!color) {
            color = getTrendColor(colorByName.size);
            colorByName.set(name, color);
          }
          const rawPoints = Array.isArray(item.points) ? item.points : [];
          const points = filterRange(
            parseTrendPointList(rawPoints).sort((a, b) => a.time - b.time),
          );
          return { name, color, data: points };
        })
        .filter((item) => item.data.length > 0);
    }

    if (Array.isArray(record.series) && record.series.length > 0) {
      const colorByName = new Map<string, string>();
      return record.series
        .map((row, index) => {
          const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
          const name =
            String(item.deviceName ?? item.name ?? '').trim() ||
            String(item.deviceCode ?? '').trim() ||
            seriesName ||
            `设备${index + 1}`;
          let color = colorByName.get(name);
          if (!color) {
            color = getTrendColor(colorByName.size);
            colorByName.set(name, color);
          }
          const rawPoints = Array.isArray(item.points)
            ? item.points
            : Array.isArray(item.data)
              ? item.data
              : [];
          const points = filterRange(
            parseTrendPointList(rawPoints).sort((a, b) => a.time - b.time),
          );
          return { name, color, data: points };
        })
        .filter((item) => item.data.length > 0);
    }
  }

  let points: DeviceTrendPoint[] = [];
  if (Array.isArray(data)) {
    points = parseTrendPointList(data);
  } else if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const nested = record.list ?? record.points ?? record.data ?? record.values;
    if (Array.isArray(nested)) {
      points = parseTrendPointList(nested);
    }
  }

  points = filterRange(points.sort((a, b) => a.time - b.time));
  if (!points.length) {
    return [];
  }
  return [{ name: seriesName, color: SERIES_COLORS[0], data: points }];
}

export function resolveTrendDeviceId(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    const numeric = Number(text);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
  }
  return undefined;
}
