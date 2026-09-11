// 设备详情
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useState } from 'react';
import { destroy, init } from '../../common/iot';
import RealtimePanel from './RealtimePanel';
import type { DeviceDetailsData, DeviceMetric, RoomTrendSeriesItem } from './interface';
import {
  createDeviceDetailsTestData,
  createMockTrendSeries,
  DEFAULT_DEVICE_DETAILS_TEST_DATA,
  getTrendUnit,
} from './test-data';
import './index.scss';

export type { DeviceDetailsData, DeviceMetric, RoomTrendSeriesItem } from './interface';

export interface DeviceDetailsProps {
  data?: DeviceDetailsData;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onTrendPropertyChange?: (propertyId: string) => void;
  onTimePage?: (range: { from: number; to: number }) => void;
  onRangeChange?: (range: { from: number; to: number }) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DeviceDetailsData) => void;
  };
}

const defaultData = DEFAULT_DEVICE_DETAILS_TEST_DATA;

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

const resolveData = (value?: DeviceDetailsData | null): DeviceDetailsData => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const merged: DeviceDetailsData = {
      ...defaultData,
      ...value,
    };
    const propertyId =
      merged.trendPropertyId ||
      (merged.metrics && merged.metrics[0] && merged.metrics[0].propertyId) ||
      'flow';

    const trendSeries =
      Array.isArray(merged.trendSeries) && merged.trendSeries.length > 0
        ? merged.trendSeries
        : createMockTrendSeries(propertyId);

    const legendSeries =
      Array.isArray(merged.legendSeries) && merged.legendSeries.length > 0
        ? merged.legendSeries
        : trendSeries.map((item) => ({
            name: item.name,
            color: item.color,
            data: [],
          }));

    return {
      ...merged,
      metrics: Array.isArray(merged.metrics) ? merged.metrics : defaultData.metrics,
      deviceDisabled: Boolean(merged.deviceDisabled),
      trendPropertyId: propertyId,
      trendUnit: merged.trendUnit || getTrendUnit(propertyId),
      legendSeries,
      trendSeries,
      chartKey: merged.chartKey || `device-details-${propertyId}`,
    };
  }
  return createDeviceDetailsTestData('flow');
};

const DeviceDetails: React.FC<DeviceDetailsProps> = function DeviceDetails(props) {
  const {
    data = defaultData,
    width = 960,
    height,
    style = {},
    className = '',
    onTrendPropertyChange,
    onTimePage,
    onRangeChange,
    ...otherProps
  } = props;

  const [panelData, setPanelData] = useState<DeviceDetailsData>(() => resolveData(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setPanelData(resolveData(data));
    }
  }, [data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DeviceDetailsData) => {
          setPanelData(resolveData(nextData));
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = (panelData.metrics || []) as DeviceMetric[];
  const trendPropertyId = String(panelData.trendPropertyId || '');
  const trendUnit = String(panelData.trendUnit || '');
  const legendSeries = (panelData.legendSeries || []) as RoomTrendSeriesItem[];
  const trendSeries = (panelData.trendSeries || []) as RoomTrendSeriesItem[];
  const chartKey = String(panelData.chartKey || `device-details-${trendPropertyId}`);
  const deviceName = String(panelData.deviceName || '-');
  const deviceCode = String(panelData.deviceCode || '-');
  const monitorArea = String(panelData.monitorArea || '-');
  const pipeCode = String(panelData.pipeCode || '-');
  const configFlow = String(panelData.configFlow || '-');

  const rootStyle: React.CSSProperties = useMemo(
    () => ({
      width,
      ...(height !== undefined && height !== null && height !== '' ? { height } : {}),
      ...style,
    }),
    [width, height, style],
  );

  const handleTrendPropertyChange = (propertyId: string) => {
    setPanelData((prev) => {
      const nextSeries =
        Array.isArray(data?.trendSeries) && data.trendSeries.length > 0 && data.trendPropertyId === propertyId
          ? data.trendSeries
          : createMockTrendSeries(propertyId);
      const matched = (prev.metrics || []).find((item) => item.propertyId === propertyId);
      return {
        ...prev,
        trendPropertyId: propertyId,
        trendUnit: matched?.unit || getTrendUnit(propertyId),
        trendSeries: nextSeries,
        legendSeries: nextSeries.map((item) => ({
          name: item.name,
          color: item.color,
          data: [],
        })),
        chartKey: `device-details-${propertyId}-${Date.now()}`,
      };
    });
    if (onTrendPropertyChange) {
      onTrendPropertyChange(propertyId);
    }
  };

  const handleTimePage = (range: { from: number; to: number }) => {
    if (onTimePage) {
      onTimePage(range);
    }
  };

  const handleRangeChange = (range: { from: number; to: number }) => {
    if (onRangeChange) {
      onRangeChange(range);
    }
  };

  return (
    <div
      className={`bizpack-device-details ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      <RealtimePanel
        deviceName={deviceName}
        deviceCode={deviceCode}
        monitorArea={monitorArea}
        pipeCode={pipeCode}
        configFlow={configFlow}
        metrics={metrics}
        deviceDisabled={Boolean(panelData.deviceDisabled)}
        trendPropertyId={trendPropertyId}
        trendUnit={trendUnit}
        legendSeries={legendSeries}
        trendSeries={trendSeries}
        chartKey={chartKey}
        onTrendPropertyChange={handleTrendPropertyChange}
        onTimePage={handleTimePage}
        onRangeChange={handleRangeChange}
      />
    </div>
  );
};

DeviceDetails.displayName = 'DeviceDetails';
export default DeviceDetails;
