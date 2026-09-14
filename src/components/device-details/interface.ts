import type { LineChartSeriesItem } from './LineChartsByDevice/interface';

/** 实时指标卡片 */
export interface DeviceMetric {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  propertyId?: string;
  [key: string]: unknown;
}

/** 趋势序列（字段与折线图一致；沿用 RealtimePanel 原字段名） */
export type RoomTrendSeriesItem = LineChartSeriesItem;

/** 设备详情面板数据（字段命名与 RealtimePanel / 蓝湖稿对齐） */
export interface DeviceDetailsData {
  /** 设备 ID，对应卡片 data.id，用于趋势接口路径 */
  deviceId?: number | string;
  /** 可选：页面配置的 API 根地址；留空走同域 `/api/...` */
  apiBaseUrl?: string;
  /** 设备名称展示值，如 X12-202 */
  deviceName?: string;
  /** 设备编号 */
  deviceCode?: string;
  /** 监测区域 */
  monitorArea?: string;
  /** 管道编号 */
  pipeCode?: string;
  /** 配置流量 */
  configFlow?: string;
  metrics?: DeviceMetric[];
  deviceDisabled?: boolean;
  trendPropertyId?: string;
  trendUnit?: string;
  legendSeries?: RoomTrendSeriesItem[];
  trendSeries?: RoomTrendSeriesItem[];
  chartKey?: string;
  [key: string]: unknown;
}
