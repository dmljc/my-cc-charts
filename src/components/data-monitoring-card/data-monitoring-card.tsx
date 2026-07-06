import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement } from 'react';
import DataMonitoringHeader from '../data-monitoring-header';
import type { DataMonitoringHeaderData } from '../data-monitoring-header/data-monitoring-header';
import DataMonitoringInfo from '../data-monitoring-info';
import type { DataMonitoringInfoItem } from '../data-monitoring-info';
import DataMonitoringLineChart from '../data-monitoring-line-chart';
import type { DataMonitoringLineChartPoint } from '../data-monitoring-line-chart';
import './index.scss';

export interface DataMonitoringCardData {
  id?: string | number;
  header?: DataMonitoringHeaderData;
  info?: DataMonitoringInfoItem[];
  chart?: DataMonitoringLineChartPoint[];
  [key: string]: unknown;
}

export interface DataMonitoringCardProps {
  data?: DataMonitoringCardData;
  width?: number | string;
  height?: number | string;
  headerHeight?: number;
  infoHeight?: number;
  chartHeight?: number;
  showXAxisLabels?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const pickRootDomProps = (props: Record<string, unknown>) => {
  const domProps: Record<string, unknown> = {};

  Object.keys(props).forEach((key) => {
    if (
      key === 'id' ||
      key === 'role' ||
      key === 'tabIndex' ||
      key.indexOf('data-') === 0 ||
      key.indexOf('aria-') === 0
    ) {
      domProps[key] = props[key];
    }
  });

  return domProps;
};

const DataMonitoringCard: React.FC<DataMonitoringCardProps> = function DataMonitoringCard(props) {
  const {
    data,
    width = '100%',
    height,
    headerHeight = 78,
    infoHeight = 60,
    chartHeight = 120,
    showXAxisLabels = true,
    className = '',
    style = {},
    ...otherProps
  } = props;

  const rootDomProps = pickRootDomProps(otherProps);
  const rootStyle: React.CSSProperties = {
    width,
    ...(height !== undefined ? { height } : {}),
    ...style,
  };

  return (
    <div
      className={`bizpack-data-monitoring-card ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      <DataMonitoringHeader
        width="100%"
        height={headerHeight}
        data={data?.header}
        className="bizpack-data-monitoring-card-header"
      />
      <DataMonitoringInfo
        width="100%"
        height={infoHeight}
        data={data?.info}
        className="bizpack-data-monitoring-card-info"
      />
      <DataMonitoringLineChart
        width="100%"
        height={chartHeight}
        data={data?.chart}
        showXAxisLabels={showXAxisLabels}
        className="bizpack-data-monitoring-card-chart"
      />
    </div>
  );
};

DataMonitoringCard.displayName = 'DataMonitoringCard';
export default DataMonitoringCard;
