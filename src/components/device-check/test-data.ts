export interface DeviceCheckTestItem {
  id: number;
  deviceName: string;
  remainingDaysText: string;
  status: string;
  [key: string]: unknown;
}

export const DEFAULT_DEVICE_CHECK_TEST_DATA: DeviceCheckTestItem[] = [
  { id: 1, deviceName: '取样泵', remainingDaysText: '剩余50天', status: '正常' },
  { id: 2, deviceName: '真空泵2', remainingDaysText: '剩余7天', status: '即将到期' },
  { id: 3, deviceName: '电磁阀0101', remainingDaysText: '延期3天', status: '逾期' },
  { id: 4, deviceName: '温度传感器T03', remainingDaysText: '剩余45天', status: '正常' },
  { id: 5, deviceName: '冷却水循环泵', remainingDaysText: '剩余5天', status: '即将到期' },
  { id: 6, deviceName: '液位计L02', remainingDaysText: '延期12天', status: '逾期' },
  { id: 7, deviceName: '压力表P05', remainingDaysText: '剩余60天', status: '正常' },
  { id: 8, deviceName: '风机F01', remainingDaysText: '剩余9天', status: '即将到期' },
  { id: 9, deviceName: '过滤器F02', remainingDaysText: '延期6天', status: '逾期' },
  { id: 10, deviceName: '电机M03', remainingDaysText: '剩余35天', status: '正常' },
  { id: 11, deviceName: '排风阀V04', remainingDaysText: '剩余4天', status: '即将到期' },
  { id: 12, deviceName: '加热器H01', remainingDaysText: '延期18天', status: '逾期' },
  { id: 13, deviceName: '油泵OP01', remainingDaysText: '剩余28天', status: '正常' },
  { id: 14, deviceName: '搅拌机BL02', remainingDaysText: '剩余2天', status: '即将到期' },
  { id: 15, deviceName: '压缩机C01', remainingDaysText: '延期9天', status: '逾期' },
];
