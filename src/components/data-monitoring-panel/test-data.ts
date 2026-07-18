import type { DataMonitoringCardData } from '../data-monitoring-card';
import { createDataMonitoringLineChartTestData } from '../data-monitoring-line-chart/test-data';

const metricLabels = ['流量', '流速', '压力'];
const metricUnits = ['m³/h', 'm³/h', 'pa'];

export const createDataMonitoringPanelTestData = (count = 3): DataMonitoringCardData[] => (
  Array.from({ length: count }, (_, index) => {
    const roomNo = 101 + index;
    const flow = 10 + (index % 5) * 1.2;
    const speed = 8 + (index % 4) * 0.9;
    const pressure = 1.1 + (index % 6) * 0.15;

    return {
      id: `monitoring-${roomNo}`,
      baseInfo: {
        roomValue: String(roomNo),
        deviceValue: `设备名称设备名称名称${String(253333 + index).padStart(7, '0')}`,
      },
      runtimeParameters: [flow, speed, pressure].map((value, metricIndex) => ({
        id: `${roomNo}-${metricLabels[metricIndex]}`,
        value: Number(value.toFixed(metricIndex === 2 ? 2 : 1)),
        unit: metricUnits[metricIndex],
        label: metricLabels[metricIndex],
      })),
      tritiumConcentration: createDataMonitoringLineChartTestData(10, {
        startSeconds: index * 60,
        stepSeconds: 1,
      }).map((item, pointIndex) => ({
        ...item,
        value: Number(Math.min(5, Math.max(0.5, item.value + index * 0.08 + pointIndex * 0.02)).toFixed(2)),
      })),
    };
  })
);

export const DEFAULT_DATA_MONITORING_PANEL_TEST_DATA = createDataMonitoringPanelTestData(3);
