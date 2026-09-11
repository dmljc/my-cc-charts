/** 与后端 disposalStats 字段一致 */
export interface DisposalStatisticsTestData {
  resolved: number;
  unresolved: number;
  resolutionRate: number;
  [key: string]: unknown;
}

export const DEFAULT_DISPOSAL_STATISTICS_TEST_DATA: DisposalStatisticsTestData = {
  resolved: 0,
  unresolved: 1,
  resolutionRate: 0,
};
