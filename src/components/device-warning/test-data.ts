export interface DeviceWarningTestItem {
  id: number;
  ruleName: string;
  levelName: string;
  levelColor: string;
  alarmTime: string;
  [key: string]: unknown;
}

export const DEFAULT_DEVICE_WARNING_TEST_DATA: DeviceWarningTestItem[] = [
  {
    id: 1,
    ruleName: '取样泵1流量计保养',
    levelName: '紧急',
    levelColor: '#FF0000',
    alarmTime: '2026-07-06 14:12:12',
  },
  {
    id: 2,
    ruleName: '真空泵2压力异常',
    levelName: '紧急',
    levelColor: '#FF0000',
    alarmTime: '2026-07-06 13:48:05',
  },
  {
    id: 3,
    ruleName: '电磁阀0101响应超时',
    levelName: '一般',
    levelColor: '#FFBE2F',
    alarmTime: '2026-07-06 12:30:21',
  },
  {
    id: 4,
    ruleName: '温度传感器T03超限',
    levelName: '紧急',
    levelColor: '#FF0000',
    alarmTime: '2026-07-06 11:15:44',
  },
  {
    id: 5,
    ruleName: '冷却水循环泵检修',
    levelName: '常规',
    levelColor: '#3399FF',
    alarmTime: '2026-07-06 10:05:08',
  },
  {
    id: 6,
    ruleName: '液位计L02校准到期',
    levelName: '常规',
    levelColor: '#3399FF',
    alarmTime: '2026-07-06 09:47:32',
  },
  {
    id: 7,
    ruleName: '压力表P05读数波动',
    levelName: '一般',
    levelColor: '#FFBE2F',
    alarmTime: '2026-07-06 08:23:15',
  },
  {
    id: 8,
    ruleName: '风机F01轴承异响',
    levelName: '紧急',
    levelColor: '#FF0000',
    alarmTime: '2026-07-05 22:16:30',
  },
  {
    id: 9,
    ruleName: '过滤器F02堵塞预警',
    levelName: '一般',
    levelColor: '#FFBE2F',
    alarmTime: '2026-07-05 20:07:55',
  },
  {
    id: 10,
    ruleName: '电机M03绝缘检测',
    levelName: '常规',
    levelColor: '#3399FF',
    alarmTime: '2026-07-05 18:33:27',
  },
  {
    id: 11,
    ruleName: '排风阀V04开度异常',
    levelName: '一般',
    levelColor: '#FFBE2F',
    alarmTime: '2026-07-05 16:09:36',
  },
  {
    id: 12,
    ruleName: '加热器H01温控失效',
    levelName: '紧急',
    levelColor: '#FF0000',
    alarmTime: '2026-07-05 14:42:03',
  },
  {
    id: 13,
    ruleName: '油泵OP01油位偏低',
    levelName: '一般',
    levelColor: '#FFBE2F',
    alarmTime: '2026-07-05 12:30:21',
  },
  {
    id: 14,
    ruleName: '搅拌机BL02定期保养',
    levelName: '常规',
    levelColor: '#3399FF',
    alarmTime: '2026-07-05 10:05:08',
  },
  {
    id: 15,
    ruleName: '压缩机C01排气温度过高',
    levelName: '紧急',
    levelColor: '#FF0000',
    alarmTime: '2026-07-05 08:23:15',
  },
];
