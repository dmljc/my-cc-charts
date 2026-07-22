import { createDataMonitoringPanelTestData } from '../data-monitoring-panel/test-data';

/** 卡片轮播演示数据：9 台设备 → 5 个轮播页（每页 2 台，末页 1 台） */
export const createDataMonitoringCardTestData = (count = 9) => createDataMonitoringPanelTestData(count);

export const DEFAULT_DATA_MONITORING_CARD_TEST_DATA = createDataMonitoringCardTestData(9);
