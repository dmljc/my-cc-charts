export interface Left1OverviewStats {
  totalDevices: number;
  workingDevices: number;
  idleDevices: number;
  [key: string]: unknown;
}

/** 与后端 overviewStats 字段一致 */
export const DEFAULT_LEFT1_TEST_DATA: Left1OverviewStats = {
  totalDevices: 1388,
  workingDevices: 98,
  idleDevices: 48,
};
