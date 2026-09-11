/** 与后端 inspectionStats 字段一致 */
export interface DeviceSpotCheckTestData {
  inspected: number;
  overdue: number;
  expiring: number;
  [key: string]: unknown;
}

export const DEFAULT_DEVICE_SPOT_CHECK_TEST_DATA: DeviceSpotCheckTestData = {
  inspected: 273,
  overdue: 23,
  expiring: 134,
};
