import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement } from 'react';
import LineChartsByDevice from './LineChartsByDevice';
import sectionIconImg from './assets/section-icon.png';
import styles from './panel-styles';
import type { DeviceMetric, RoomTrendSeriesItem } from './interface';
import { formatMetric, TREND_AXIS_RANGE_MS } from './utils';

export interface RealtimePanelProps {
  deviceName?: string;
  deviceCode?: string;
  monitorArea?: string;
  pipeCode?: string;
  configFlow?: string;
  metrics: DeviceMetric[];
  deviceDisabled: boolean;
  trendPropertyId: string;
  trendUnit: string;
  legendSeries: RoomTrendSeriesItem[];
  trendSeries: RoomTrendSeriesItem[];
  chartKey: string;
  onTrendPropertyChange: (propertyId: string) => void;
  onTimePage: (range: { from: number; to: number }) => void;
  onRangeChange: (range: { from: number; to: number }) => void;
}

const RealtimePanel = ({
  deviceName = '-',
  deviceCode = '-',
  monitorArea = '-',
  pipeCode = '-',
  configFlow = '-',
  metrics,
  deviceDisabled,
  trendPropertyId,
  trendUnit,
  trendSeries,
  chartKey,
  onTrendPropertyChange,
  onTimePage,
  onRangeChange,
}: RealtimePanelProps) => {
  const infoItems = [
    { label: '设备编号', value: deviceCode },
    { label: '监测区域', value: monitorArea },
    { label: '管道编号', value: pipeCode },
    { label: '配置流量', value: configFlow },
  ];

  return (
    <div className={styles.mainPanel}>
      <div className={styles.deviceNameBar}>
        <span className={styles.deviceNameLabel}>设备名称</span>
        <span className={styles.deviceNameValue}>{deviceName}</span>
      </div>

      <div className={styles.infoRow}>
        {infoItems.map((item) => (
          <div key={item.label} className={styles.infoItem}>
            <span className={styles.infoLabel}>{item.label}</span>
            <span className={styles.infoValue}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className={styles.sectionTitle}>
        <img className={styles.sectionIcon} src={sectionIconImg} alt="" aria-hidden />
        <span className={styles.sectionText}>实时状态</span>
      </div>

      {metrics.length > 0 ? (
        <div className={styles.metricRow}>
          {metrics.map((metric) => {
            const metricActive =
              Boolean(trendPropertyId) && metric.propertyId === trendPropertyId;
            return (
              <div
                key={metric.key}
                role="button"
                tabIndex={0}
                className={`${styles.metricCard} ${
                  metricActive ? styles.metricCardActive : ''
                }`}
                onMouseDown={(event) => {
                  // 避免点击后出现浏览器/设计器焦点框
                  event.preventDefault();
                }}
                onClick={(event) => {
                  (event.currentTarget as HTMLDivElement).blur();
                  if (metric.propertyId) {
                    onTrendPropertyChange(metric.propertyId);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                  }
                  event.preventDefault();
                  if (metric.propertyId) {
                    onTrendPropertyChange(metric.propertyId);
                  }
                }}
              >
                <span className={styles.metricLabel}>{metric.label}</span>
                <span className={styles.metricMain}>
                  <span className={styles.metricValue}>{formatMetric(metric)}</span>
                  <span className={styles.metricUnit}>{metric.unit || '\u00A0'}</span>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyWrap}>
          {deviceDisabled ? '设备已关闭，暂无实时数据' : '暂无实时数据'}
        </div>
      )}

      {metrics.length > 0 ? (
        <>
          <div className={styles.trendSectionTitle}>
            <img className={styles.sectionIcon} src={sectionIconImg} alt="" aria-hidden />
            <span className={styles.sectionText}>变化趋势</span>
          </div>
          <div className={styles.trendChart}>
            <div className={styles.chartWrap}>
              <LineChartsByDevice
                key={chartKey}
                series={trendSeries}
                axisRangeMs={TREND_AXIS_RANGE_MS}
                unit={trendUnit}
                onTimePage={onTimePage}
                onRangeChange={onRangeChange}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

RealtimePanel.displayName = 'RealtimePanel';
export default RealtimePanel;
