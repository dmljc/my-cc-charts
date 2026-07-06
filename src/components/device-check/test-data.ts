export interface DeviceCheckTestItem {
  id: number;
  name: string;
  status: 'normal' | 'expiring' | 'overdue';
  days: number;
  [key: string]: unknown;
}

export const DEFAULT_DEVICE_CHECK_TEST_DATA: DeviceCheckTestItem[] = [
  { id: 1, name: '取样泵1定检', status: 'normal', days: 50 },
  { id: 2, name: '真空泵2定检', status: 'expiring', days: 7 },
  { id: 3, name: '电磁阀0101定检', status: 'overdue', days: 3 },
  { id: 4, name: '温度传感器T03校准', status: 'normal', days: 45 },
  { id: 5, name: '冷却水循环泵保养', status: 'expiring', days: 5 },
  { id: 6, name: '液位计L02定检', status: 'overdue', days: 12 },
  { id: 7, name: '压力表P05校准', status: 'normal', days: 60 },
  { id: 8, name: '风机F01巡检', status: 'expiring', days: 9 },
  { id: 9, name: '过滤器F02更换', status: 'overdue', days: 6 },
  { id: 10, name: '电机M03绝缘检测', status: 'normal', days: 35 },
  { id: 11, name: '排风阀V04定检', status: 'expiring', days: 4 },
  { id: 12, name: '加热器H01温控检查', status: 'overdue', days: 18 },
  { id: 13, name: '油泵OP01保养', status: 'normal', days: 28 },
  { id: 14, name: '搅拌机BL02定期保养', status: 'expiring', days: 2 },
  { id: 15, name: '压缩机C01排气检查', status: 'overdue', days: 9 },
];
