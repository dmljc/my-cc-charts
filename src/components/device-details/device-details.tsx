// 设备详情
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { destroy, init } from '../../common/iot';
import RealtimePanel from './RealtimePanel';
import type { DeviceDetailsData, DeviceMetric, RoomTrendSeriesItem } from './interface';
import {
  listDeviceTrend,
  resolveTrendDeviceId,
  toTrendChartSeries,
  TREND_SLIDER_RANGE_MS,
} from './trend-api';
import './index.scss';

export type { DeviceDetailsData, DeviceMetric, RoomTrendSeriesItem } from './interface';

export interface DeviceDetailsProps {
  data?: DeviceDetailsData;
  /** 趋势接口根地址（页面配置）；留空则走同域 `/api/...` */
  apiBaseUrl?: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onClose?: () => void;
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

const EMPTY_DATA: DeviceDetailsData = {
  deviceName: '',
  deviceCode: '',
  monitorArea: '',
  pipeCode: '',
  configFlow: '',
  metrics: [],
  deviceDisabled: false,
  trendPropertyId: '',
  trendUnit: '',
  legendSeries: [],
  trendSeries: [],
  chartKey: 'device-details-empty',
};

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

const emptyLegend = (series: RoomTrendSeriesItem[]): RoomTrendSeriesItem[] =>
  series.map((item) => ({
    name: item.name,
    color: item.color,
    data: [],
  }));

const resolveData = (
  value?: DeviceDetailsData | null,
  apiBaseUrlProp?: string,
): DeviceDetailsData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...EMPTY_DATA, apiBaseUrl: apiBaseUrlProp?.trim() || '' };
  }

  const metrics = Array.isArray(value.metrics) ? value.metrics : [];
  const propertyId = String(
    value.trendPropertyId ||
      (metrics[0] && metrics[0].propertyId) ||
      '',
  ).trim();
  const deviceId = resolveTrendDeviceId(value.deviceId);
  const matched = metrics.find((item) => item.propertyId === propertyId);
  const trendSeries = Array.isArray(value.trendSeries) ? value.trendSeries : [];
  const legendSeries =
    Array.isArray(value.legendSeries) && value.legendSeries.length > 0
      ? value.legendSeries
      : emptyLegend(trendSeries);

  const apiBaseUrl =
    (value.apiBaseUrl != null && String(value.apiBaseUrl).trim()) ||
    (apiBaseUrlProp != null && String(apiBaseUrlProp).trim()) ||
    '';

  return {
    ...value,
    deviceId: deviceId != null ? deviceId : value.deviceId,
    apiBaseUrl,
    metrics,
    deviceDisabled: Boolean(value.deviceDisabled),
    trendPropertyId: propertyId,
    trendUnit: value.trendUnit || matched?.unit || '',
    legendSeries,
    trendSeries,
    chartKey:
      value.chartKey ||
      `device-details-${deviceId != null ? deviceId : 'na'}-${propertyId || 'empty'}`,
  };
};

const DeviceDetails: React.FC<DeviceDetailsProps> = function DeviceDetails(props) {
  const {
    data,
    apiBaseUrl: apiBaseUrlProp,
    title = '设备详情',
    width = 884,
    height = 643,
    style = {},
    className = '',
    onClose,
    onTrendPropertyChange,
    onTimePage,
    onRangeChange,
    ...otherProps
  } = props;

  const [panelData, setPanelData] = useState<DeviceDetailsData>(() =>
    resolveData(data, apiBaseUrlProp),
  );
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;
  const panelDataRef = useRef(panelData);
  panelDataRef.current = panelData;
  const fetchSeqRef = useRef(0);
  const rangeRef = useRef<{ from: number; to: number }>({
    from: Date.now() - TREND_SLIDER_RANGE_MS,
    to: Date.now(),
  });

  const fetchTrend = useCallback(
    async (options?: {
      deviceId?: unknown;
      propertyId?: string;
      seriesName?: string;
      apiBaseUrl?: string;
      range?: { from: number; to: number };
    }) => {
      const current = panelDataRef.current;
      const deviceId = resolveTrendDeviceId(
        options && options.deviceId !== undefined ? options.deviceId : current.deviceId,
      );
      const propertyId = String(
        (options && options.propertyId) || current.trendPropertyId || '',
      ).trim();
      if (deviceId == null || !propertyId) {
        setPanelData((prev) => ({
          ...prev,
          trendSeries: [],
          legendSeries: [],
        }));
        return;
      }

      const range = (options && options.range) || rangeRef.current;
      rangeRef.current = range;
      const seriesName =
        (options && options.seriesName) || String(current.deviceName || '设备');
      const apiBaseUrl =
        (options && options.apiBaseUrl) || (current.apiBaseUrl as string | undefined);
      const seq = (fetchSeqRef.current += 1);

      try {
        const raw = await listDeviceTrend({
          deviceId,
          propertyId,
          from: range.from,
          to: range.to,
          apiBaseUrl,
        });
        if (seq !== fetchSeqRef.current) {
          return;
        }
        const nextSeries = toTrendChartSeries(raw, { range, seriesName });
        setPanelData((prev) => ({
          ...prev,
          trendPropertyId: propertyId,
          trendSeries: nextSeries,
          legendSeries: emptyLegend(nextSeries),
          chartKey: `device-details-${deviceId}-${propertyId}`,
        }));
      } catch (err) {
        if (seq !== fetchSeqRef.current) {
          return;
        }
        // eslint-disable-next-line no-console
        console.warn('[DeviceDetails] trend 请求失败', err);
        setPanelData((prev) => ({
          ...prev,
          trendPropertyId: propertyId,
          trendSeries: [],
          legendSeries: [],
          chartKey: `device-details-${deviceId}-${propertyId}`,
        }));
      }
    },
    [],
  );

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      const next = resolveData(data, apiBaseUrlProp);
      panelDataRef.current = next;
      setPanelData(next);
      const deviceId = resolveTrendDeviceId(next.deviceId);
      const propertyId = String(next.trendPropertyId || '').trim();
      if (deviceId != null && propertyId) {
        const to = Date.now();
        const from = to - TREND_SLIDER_RANGE_MS;
        rangeRef.current = { from, to };
        void fetchTrend({
          deviceId,
          propertyId,
          seriesName: String(next.deviceName || '设备'),
          apiBaseUrl: next.apiBaseUrl as string | undefined,
          range: { from, to },
        });
      } else {
        setPanelData((prev) => ({
          ...prev,
          trendSeries: [],
          legendSeries: [],
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, apiBaseUrlProp, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DeviceDetailsData) => {
          setPanelData(resolveData(nextData, apiBaseUrlProp));
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
  const chartKey = String(panelData.chartKey || `device-details-${trendPropertyId || 'empty'}`);
  const deviceName = String(panelData.deviceName || '-');
  const deviceCode = String(panelData.deviceCode || '-');
  const monitorArea = String(panelData.monitorArea || '-');
  const pipeCode = String(panelData.pipeCode || '-');
  const configFlow = String(panelData.configFlow || '-');

  const rootStyle: React.CSSProperties = useMemo(
    () => ({
      width,
      height,
      ...style,
    }),
    [width, height, style],
  );

  const handleTrendPropertyChange = (propertyId: string) => {
    const matched = (panelData.metrics || []).find((item) => item.propertyId === propertyId);
    setPanelData((prev) => ({
      ...prev,
      trendPropertyId: propertyId,
      trendUnit: matched?.unit || '',
      trendSeries: [],
      legendSeries: [],
    }));
    void fetchTrend({ propertyId, range: rangeRef.current });
    if (onTrendPropertyChange) {
      onTrendPropertyChange(propertyId);
    }
  };

  const handleTimePage = (range: { from: number; to: number }) => {
    rangeRef.current = range;
    void fetchTrend({ range });
    if (onTimePage) {
      onTimePage(range);
    }
  };

  const handleRangeChange = (range: { from: number; to: number }) => {
    rangeRef.current = range;
    void fetchTrend({ range });
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
        title={title}
        onClose={onClose}
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
