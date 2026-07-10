/**
 * IIoT API → 自定义组件 ViewModel 适配层
 *
 * 对照文档：工业物联平台(IIoT) 25.9.0.SPC002 API 参考
 * 用途：将快照 / 历史 / 表记录等接口响应，转换为组件可直接 changeData 的展示结构。
 *
 * 说明：
 * - 本文件只做数据结构转换，不发起网络请求
 * - 业务枚举（告警等级、定检状态等）需与后端表字段约定对齐
 */

// ---------------------------------------------------------------------------
// IIoT 原始响应类型（按文档精简）
// ---------------------------------------------------------------------------

export interface IiotProperty {
  value?: unknown;
  time?: string;
}

/** 快照 properties：兼容 { value, time } 与裸值两种形态 */
export type IiotPropertyMap = Record<string, IiotProperty | unknown>;

export interface IiotSnapshotResponse {
  properties?: IiotPropertyMap;
  components?: Record<string, unknown>;
}

export interface IiotBatchThingSnapshot {
  thing_id?: string;
  thing_name?: string;
  properties?: IiotPropertyMap;
  components?: Record<string, unknown>;
}

export interface IiotBatchSnapshotResponse {
  things?: IiotBatchThingSnapshot[];
}

export interface IiotPropertyValues {
  property_path?: string;
  function?: string;
  values?: Array<unknown>;
}

export interface IiotTimeSeriesData {
  timestamps?: Array<number | string>;
  property_values?: IiotPropertyValues[];
}

export interface IiotTimeSeriesResponse {
  thing_id?: string;
  interval?: string;
  data?: IiotTimeSeriesData;
  page_info?: { next_marker?: string };
}

export interface IiotTableRecordsResponse {
  count?: number;
  columns?: string[];
  values?: unknown[][];
  thing_names?: unknown;
}

// ---------------------------------------------------------------------------
// 组件 ViewModel 类型（与 src/components 对齐的精简版）
// ---------------------------------------------------------------------------

export interface AlarmStatusOverviewData {
  id?: string | number;
  name?: string;
  status?: 'normal' | 'alarm' | string;
  runningText?: string;
  emergency?: number | string;
  severe?: number | string;
  general?: number | string;
}

export interface DataMonitoringHeaderData {
  roomValue?: string;
  deviceValue?: string;
  [key: string]: unknown;
}

export interface DataMonitoringInfoItem {
  id?: string | number;
  value?: string | number;
  unit?: string;
  label?: string;
  [key: string]: unknown;
}

export interface DataMonitoringLineChartPoint {
  label?: string | number;
  value?: number;
  [key: string]: unknown;
}

export interface DataMonitoringCardData {
  id?: string | number;
  header?: DataMonitoringHeaderData;
  info?: DataMonitoringInfoItem[];
  chart?: DataMonitoringLineChartPoint[];
  [key: string]: unknown;
}

export interface DetailPopupItem {
  id?: string | number;
  label?: string;
  value?: string | number;
  time?: string;
  [key: string]: unknown;
}

export interface DeviceCheckItem {
  id?: string | number;
  name?: string;
  status?: 'normal' | 'expiring' | 'overdue' | string;
  days?: number;
  [key: string]: unknown;
}

export interface DeviceWarningItem {
  id?: string | number;
  name: string;
  level?: 'urgent' | 'normal' | 'regular' | string;
  [key: string]: unknown;
}

export interface EffluentItem {
  id?: string | number;
  label: string;
  value?: number | string;
  trend?: 'up' | 'down' | 'flat' | string;
}

export interface OperationLogItem {
  id?: string | number;
  action?: string;
  name?: string;
  time?: string;
  [key: string]: unknown;
}

export interface VariableYStepFlatPoint {
  label?: string;
  type?: string;
  value?: number;
  time?: number | string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// 通用工具
// ---------------------------------------------------------------------------

/** 从快照属性中取出 value（兼容裸值与 { value, time }） */
export function pickPropertyValue(raw: IiotProperty | unknown): unknown {
  if (raw != null && typeof raw === 'object' && 'value' in (raw as object)) {
    return (raw as IiotProperty).value;
  }
  return raw;
}

/** 从快照属性中取出 time */
export function pickPropertyTime(raw: IiotProperty | unknown): string | undefined {
  if (raw != null && typeof raw === 'object' && 'time' in (raw as object)) {
    return (raw as IiotProperty).time;
  }
  return undefined;
}

export function formatTimestampLabel(
  ts: number | string,
  options?: { locale?: string; hour12?: boolean },
): string {
  const ms = typeof ts === 'string' ? Number(ts) : ts;
  if (!Number.isFinite(ms)) return String(ts);
  const date = new Date(ms);
  return date.toLocaleTimeString(options?.locale ?? 'zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: options?.hour12 ?? false,
  });
}

/** 表记录 columns + values[][] → 对象数组 */
export function adaptTableRecordsToObjects(
  response: IiotTableRecordsResponse,
): Record<string, unknown>[] {
  const columns = response.columns ?? [];
  const rows = response.values ?? [];
  return rows.map((row, rowIndex) => {
    const item: Record<string, unknown> = { id: rowIndex + 1 };
    columns.forEach((col, colIndex) => {
      item[col] = row[colIndex];
    });
    return item;
  });
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function asDisplay(value: unknown): string | number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' || typeof value === 'number') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// 快照 → 详情弹框 / 指标 / 头部
// ---------------------------------------------------------------------------

export interface SnapshotMetricMapping {
  /** 属性 ID（properties 的 key） */
  propertyId: string;
  /** 展示名称 */
  label: string;
  /** 单位（模型侧配置，快照不含 unit） */
  unit?: string;
  id?: string | number;
}

/** 快照 → 详情弹框列表 */
export function adaptSnapshotToDetailPopup(
  snapshot: IiotSnapshotResponse,
  mappings: SnapshotMetricMapping[],
): DetailPopupItem[] {
  const props = snapshot.properties ?? {};
  return mappings.map((m, index) => {
    const raw = props[m.propertyId];
    return {
      id: m.id ?? index + 1,
      label: m.label,
      value: asDisplay(pickPropertyValue(raw)),
      time: pickPropertyTime(raw),
    };
  });
}

/** 快照 → 数据监测指标信息 */
export function adaptSnapshotToMonitoringInfo(
  snapshot: IiotSnapshotResponse,
  mappings: SnapshotMetricMapping[],
): DataMonitoringInfoItem[] {
  const props = snapshot.properties ?? {};
  return mappings.map((m, index) => {
    const raw = props[m.propertyId];
    return {
      id: m.id ?? index + 1,
      label: m.label,
      unit: m.unit,
      value: asDisplay(pickPropertyValue(raw)),
    };
  });
}

export interface SnapshotHeaderMapping {
  roomPropertyId?: string;
  devicePropertyId?: string;
  /** 若设备名不在快照属性中，可直接传入 */
  deviceValueFallback?: string;
  roomValueFallback?: string;
}

/** 快照 → 数据监测头部 */
export function adaptSnapshotToMonitoringHeader(
  snapshot: IiotSnapshotResponse,
  mapping: SnapshotHeaderMapping = {},
): DataMonitoringHeaderData {
  const props = snapshot.properties ?? {};
  const roomRaw = mapping.roomPropertyId ? props[mapping.roomPropertyId] : undefined;
  const deviceRaw = mapping.devicePropertyId ? props[mapping.devicePropertyId] : undefined;
  return {
    roomValue: String(
      asDisplay(pickPropertyValue(roomRaw)) ?? mapping.roomValueFallback ?? '',
    ),
    deviceValue: String(
      asDisplay(pickPropertyValue(deviceRaw)) ?? mapping.deviceValueFallback ?? '',
    ),
  };
}

// ---------------------------------------------------------------------------
// 历史 / 聚合 → 折线点 / flat 多系列
// ---------------------------------------------------------------------------

export interface HistoryToPointsOptions {
  /** 取哪条 property_path；不传则取第一条 */
  propertyPath?: string;
  /** 时间标签格式化 */
  formatLabel?: (ts: number | string, index: number) => string;
  /** 是否过滤 null/undefined */
  skipNull?: boolean;
}

/** 属性历史/聚合 → 单系列折线点 [{ label, value }] */
export function adaptHistoryToLinePoints(
  response: IiotTimeSeriesResponse,
  options: HistoryToPointsOptions = {},
): DataMonitoringLineChartPoint[] {
  const timestamps = response.data?.timestamps ?? [];
  const seriesList = response.data?.property_values ?? [];
  if (!timestamps.length || !seriesList.length) return [];

  const target =
    (options.propertyPath
      ? seriesList.find((s) => s.property_path === options.propertyPath)
      : seriesList[0]) ?? seriesList[0];

  const values = target.values ?? [];
  const formatLabel = options.formatLabel ?? ((ts) => formatTimestampLabel(ts));
  const skipNull = options.skipNull ?? true;

  const points: DataMonitoringLineChartPoint[] = [];
  timestamps.forEach((ts, index) => {
    const raw = values[index];
    if (skipNull && (raw == null || raw === '')) return;
    const num = asNumber(raw);
    if (num == null && skipNull) return;
    points.push({
      label: formatLabel(ts, index),
      value: num ?? 0,
      time: ts,
    });
  });
  return points;
}

export interface HistoryToFlatOptions {
  /** property_path → 系列展示名；不传则用 property_path 本身 */
  seriesNameMap?: Record<string, string>;
  formatLabel?: (ts: number | string, index: number) => string;
  skipNull?: boolean;
}

/**
 * 属性历史/聚合 → 可变Y轴折线 flat 数据
 * [{ label, type, value, time }]
 */
export function adaptHistoryToVariableYFlat(
  response: IiotTimeSeriesResponse,
  options: HistoryToFlatOptions = {},
): VariableYStepFlatPoint[] {
  const timestamps = response.data?.timestamps ?? [];
  const seriesList = response.data?.property_values ?? [];
  if (!timestamps.length || !seriesList.length) return [];

  const formatLabel = options.formatLabel ?? ((ts) => formatTimestampLabel(ts));
  const skipNull = options.skipNull ?? true;
  const nameMap = options.seriesNameMap ?? {};
  const result: VariableYStepFlatPoint[] = [];

  seriesList.forEach((series) => {
    const path = series.property_path ?? 'unknown';
    const type = nameMap[path] ?? path;
    const values = series.values ?? [];
    timestamps.forEach((ts, index) => {
      const raw = values[index];
      if (skipNull && (raw == null || raw === '')) return;
      const num = asNumber(raw);
      if (num == null && skipNull) return;
      result.push({
        label: formatLabel(ts, index),
        type,
        value: num ?? 0,
        time: ts,
      });
    });
  });

  return result;
}

// ---------------------------------------------------------------------------
// 批量快照 + 历史 → 数据监测卡片
// ---------------------------------------------------------------------------

export interface MonitoringCardBuildConfig {
  thingId: string;
  /** 卡片 id，默认 thingId */
  id?: string | number;
  header: SnapshotHeaderMapping;
  infoMappings: SnapshotMetricMapping[];
  /** 该设备对应的历史响应（可选，无则 chart 为空） */
  history?: IiotTimeSeriesResponse;
  historyOptions?: HistoryToPointsOptions;
}

/** 单个物实例快照 + 历史 → 一张监测卡片 */
export function adaptSnapshotAndHistoryToCard(
  snapshot: IiotSnapshotResponse,
  config: MonitoringCardBuildConfig,
): DataMonitoringCardData {
  return {
    id: config.id ?? config.thingId,
    header: adaptSnapshotToMonitoringHeader(snapshot, config.header),
    info: adaptSnapshotToMonitoringInfo(snapshot, config.infoMappings),
    chart: config.history
      ? adaptHistoryToLinePoints(config.history, config.historyOptions)
      : [],
  };
}

/**
 * 批量快照 → 多张监测卡片（chart 需另行按 thing 填入 historyMap）
 */
export function adaptBatchSnapshotToCards(
  batch: IiotBatchSnapshotResponse,
  configs: MonitoringCardBuildConfig[],
  historyMap?: Record<string, IiotTimeSeriesResponse>,
): DataMonitoringCardData[] {
  const thingMap = new Map(
    (batch.things ?? []).map((t) => [t.thing_id ?? '', t] as const),
  );

  return configs
    .map((config) => {
      const thing = thingMap.get(config.thingId);
      if (!thing) return null;
      const snapshot: IiotSnapshotResponse = {
        properties: thing.properties,
        components: thing.components,
      };
      const headerFallback: SnapshotHeaderMapping = {
        ...config.header,
        deviceValueFallback:
          config.header.deviceValueFallback ?? thing.thing_name ?? config.thingId,
      };
      return adaptSnapshotAndHistoryToCard(snapshot, {
        ...config,
        header: headerFallback,
        history: config.history ?? historyMap?.[config.thingId],
      });
    })
    .filter(Boolean) as DataMonitoringCardData[];
}

// ---------------------------------------------------------------------------
// 表记录 → 业务列表组件
// ---------------------------------------------------------------------------

export interface TableFieldMapping {
  /** 表字段 → 组件字段 */
  id?: string;
  name?: string;
  status?: string;
  days?: string;
  level?: string;
  action?: string;
  time?: string;
  label?: string;
  value?: string;
  trend?: string;
  runningText?: string;
  emergency?: string;
  severe?: string;
  general?: string;
}

function mapRow(
  row: Record<string, unknown>,
  mapping: TableFieldMapping,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  (Object.keys(mapping) as Array<keyof TableFieldMapping>).forEach((viewKey) => {
    const col = mapping[viewKey];
    if (col && col in row) {
      out[viewKey] = row[col];
    }
  });
  return out;
}

/** 表记录 → 操作日志 */
export function adaptTableToOperationLog(
  response: IiotTableRecordsResponse,
  mapping: TableFieldMapping = {
    action: 'action',
    name: 'name',
    time: 'time',
    id: 'id',
  },
): OperationLogItem[] {
  return adaptTableRecordsToObjects(response).map((row) => {
    const m = mapRow(row, mapping);
    return {
      id: (m.id as string | number) ?? row.id,
      action: m.action as string | undefined,
      name: m.name as string | undefined,
      time: m.time as string | undefined,
    };
  });
}

/** 表记录 → 设备警告 */
export function adaptTableToDeviceWarning(
  response: IiotTableRecordsResponse,
  mapping: TableFieldMapping = {
    name: 'name',
    level: 'level',
    id: 'id',
  },
): DeviceWarningItem[] {
  return adaptTableRecordsToObjects(response).map((row) => {
    const m = mapRow(row, mapping);
    return {
      id: (m.id as string | number) ?? row.id,
      name: String(m.name ?? ''),
      level: m.level as DeviceWarningItem['level'],
    };
  });
}

/** 表记录 → 设备定检 */
export function adaptTableToDeviceCheck(
  response: IiotTableRecordsResponse,
  mapping: TableFieldMapping = {
    name: 'name',
    status: 'status',
    days: 'days',
    id: 'id',
  },
): DeviceCheckItem[] {
  return adaptTableRecordsToObjects(response).map((row) => {
    const m = mapRow(row, mapping);
    return {
      id: (m.id as string | number) ?? row.id,
      name: m.name as string | undefined,
      status: m.status as DeviceCheckItem['status'],
      days: asNumber(m.days),
    };
  });
}

/**
 * 表记录 → 告警状态概览
 * 约定：表中已有汇总字段，或仅一行汇总记录
 */
export function adaptTableToAlarmStatusOverview(
  response: IiotTableRecordsResponse,
  mapping: TableFieldMapping = {
    name: 'name',
    status: 'status',
    runningText: 'runningText',
    emergency: 'emergency',
    severe: 'severe',
    general: 'general',
    id: 'id',
  },
): AlarmStatusOverviewData | AlarmStatusOverviewData[] {
  const list = adaptTableRecordsToObjects(response).map((row) => {
    const m = mapRow(row, mapping);
    return {
      id: (m.id as string | number) ?? row.id,
      name: m.name as string | undefined,
      status: m.status as AlarmStatusOverviewData['status'],
      runningText: m.runningText as string | undefined,
      emergency: m.emergency as number | string | undefined,
      severe: m.severe as number | string | undefined,
      general: m.general as number | string | undefined,
    };
  });
  return list.length === 1 ? list[0] : list;
}

export interface EffluentMappingItem {
  propertyId: string;
  label: string;
  id?: string | number;
  /** 可选：上一周期值，用于计算 trend */
  previousValue?: number;
}

/**
 * 快照 → 流出物
 * trend：若提供 previousValue 则自动计算，否则为 flat
 */
export function adaptSnapshotToEffluent(
  snapshot: IiotSnapshotResponse,
  mappings: EffluentMappingItem[],
): EffluentItem[] {
  const props = snapshot.properties ?? {};
  return mappings.map((m, index) => {
    const raw = props[m.propertyId];
    const value = asDisplay(pickPropertyValue(raw));
    const current = asNumber(value);
    let trend: EffluentItem['trend'] = 'flat';
    if (current != null && m.previousValue != null) {
      if (current > m.previousValue) trend = 'up';
      else if (current < m.previousValue) trend = 'down';
      else trend = 'flat';
    }
    return {
      id: m.id ?? index + 1,
      label: m.label,
      value: value ?? 0,
      trend,
    };
  });
}

// ---------------------------------------------------------------------------
// 使用示例（注释，供对接时参考）
// ---------------------------------------------------------------------------

/*
import {
  adaptBatchSnapshotToCards,
  adaptHistoryToLinePoints,
  adaptHistoryToVariableYFlat,
  adaptSnapshotToDetailPopup,
  adaptSnapshotToEffluent,
  adaptTableToDeviceCheck,
  adaptTableToDeviceWarning,
  adaptTableToOperationLog,
  adaptTableToAlarmStatusOverview,
} from '../common/iiot-adapters';

// 1) 折线
const points = adaptHistoryToLinePoints(historyRes, {
  propertyPath: '/flow_rate',
});

// 2) 多系列可变 Y 轴
const flat = adaptHistoryToVariableYFlat(historyRes, {
  seriesNameMap: {
    '/gamma': '伽马当量',
    '/neutron': '中子当量',
  },
});

// 3) 监测面板
const cards = adaptBatchSnapshotToCards(batchSnapshotRes, [
  {
    thingId: 'device-101',
    header: { roomPropertyId: 'room_no', devicePropertyId: 'device_name' },
    infoMappings: [
      { propertyId: 'flow', label: '流量', unit: 'm³/h' },
      { propertyId: 'speed', label: '流速', unit: 'm³/h' },
      { propertyId: 'pressure', label: '压力', unit: 'pa' },
    ],
  },
], { 'device-101': historyRes });

// 4) 表记录业务列表（字段名按实际表调整）
const logs = adaptTableToOperationLog(tableRes, {
  action: 'op_content',
  name: 'operator',
  time: 'op_time',
});
*/
