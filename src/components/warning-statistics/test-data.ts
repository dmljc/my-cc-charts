/** 与后端 alarmStats 字段一致 */
export interface WarningStatisticsTestItem {
  levelName: string;
  count: number;
  levelColor?: string;
  [key: string]: unknown;
}

export interface WarningStatisticsTestData {
  total: number;
  levels: WarningStatisticsTestItem[];
}

/** 4 档警告等级 mock：紧急 / 严重 / 注意 / 一般 */
export const DEFAULT_WARNING_STATISTICS_TEST_DATA: WarningStatisticsTestData = {
  total: 1,
  levels: [
    { levelName: '紧急', count: 1, levelColor: '#FA8C16' },
    { levelName: '严重', count: 0, levelColor: '#FADB14' },
    { levelName: '注意', count: 0, levelColor: '#52C41A' },
    { levelName: '一般', count: 0, levelColor: '#13C2C2' },
  ],
};
