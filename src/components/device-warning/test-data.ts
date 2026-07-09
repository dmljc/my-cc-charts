export interface DeviceWarningTestItem {
  id: number;
  name: string;
  level: 'urgent' | 'normal' | 'regular';
  [key: string]: unknown;
}

export const DEFAULT_DEVICE_WARNING_TEST_DATA: DeviceWarningTestItem[] = [
  { id: 1, name: '取样泵1流量计保养', level: 'urgent' },
  { id: 2, name: '真空泵2压力异常', level: 'urgent' },
  { id: 3, name: '电磁阀0101响应超时', level: 'normal' },
  { id: 4, name: '温度传感器T03超限', level: 'urgent' },
  { id: 5, name: '冷却水循环泵检修', level: 'regular' },
  { id: 6, name: '液位计L02校准到期', level: 'regular' },
  { id: 7, name: '压力表P05读数波动', level: 'normal' },
  { id: 8, name: '风机F01轴承异响', level: 'urgent' },
  { id: 9, name: '过滤器F02堵塞预警', level: 'normal' },
  { id: 10, name: '电机M03绝缘检测', level: 'regular' },
  { id: 11, name: '排风阀V04开度异常', level: 'normal' },
  { id: 12, name: '加热器H01温控失效', level: 'urgent' },
  { id: 13, name: '油泵OP01油位偏低', level: 'normal' },
  { id: 14, name: '搅拌机BL02定期保养', level: 'regular' },
  { id: 15, name: '压缩机C01排气温度过高', level: 'urgent' },
];
