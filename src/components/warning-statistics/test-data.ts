export interface WarningStatisticsTestItem {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

export interface WarningStatisticsTestData {
  total: number;
  items: WarningStatisticsTestItem[];
}

/** 5 档警告等级 mock：紧急 / 严重 / 一般 / 提示 / 未知 */
export const DEFAULT_WARNING_STATISTICS_TEST_DATA: WarningStatisticsTestData = {
  total: 328,
  items: [
    { name: '紧急', value: 52, color: '#C65CFF' },
    { name: '严重', value: 68, color: '#FF4B6E' },
    { name: '一般', value: 86, color: '#3B86FF' },
    { name: '提示', value: 74, color: '#FFB02E' },
    { name: '未知', value: 48, color: '#8B95A8' },
  ],
};
