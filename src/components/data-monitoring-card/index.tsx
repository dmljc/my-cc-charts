// 数据监测卡片（头部信息 + 指标信息 + 趋势折线图）
import DataMonitoringCard from './data-monitoring-card';

export type {
  DataMonitoringCardData,
  DataMonitoringCardProps,
} from './data-monitoring-card';
export {
  createDataMonitoringCardTestData,
  DEFAULT_DATA_MONITORING_CARD_TEST_DATA,
} from './test-data';
export default DataMonitoringCard;
