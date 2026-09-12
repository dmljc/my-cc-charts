// 设备点检
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { DEFAULT_DEVICE_SPOT_CHECK_TEST_DATA } from './test-data';
import './index.scss';

/** 与后端 inspectionStats 一致 */
export interface DeviceSpotCheckStats {
  inspected?: number | string;
  overdue?: number | string;
  expiring?: number | string;
  /** @deprecated 请使用 inspected */
  checked?: number | string;
  [key: string]: unknown;
}

export interface DeviceSpotCheckData extends DeviceSpotCheckStats {
  inspectionStats?: DeviceSpotCheckStats;
}

export type DeviceSpotCheckSlotKey = 'inspected' | 'overdue' | 'expiring';

export interface DeviceSpotCheckProps {
  data?: DeviceSpotCheckData;
  inspectedField?: string;
  overdueField?: string;
  expiringField?: string;
  /** @deprecated 请使用 inspectedField */
  checkedField?: string;
  centerText?: string;
  inspectedLabel?: string;
  /** @deprecated 请使用 inspectedLabel */
  checkedLabel?: string;
  overdueLabel?: string;
  expiringLabel?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (key: DeviceSpotCheckSlotKey, value: number | string) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DeviceSpotCheckData) => void;
  };
}

const defaultData = DEFAULT_DEVICE_SPOT_CHECK_TEST_DATA as DeviceSpotCheckData;

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

const pickMetric = (
  data: DeviceSpotCheckStats,
  fields: string[],
  fallback: number | string,
) => {
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    const value = data[field];
    if (value !== null && value !== undefined && value !== '') {
      return value as number | string;
    }
  }
  return fallback;
};

const formatValue = (value: number | string) => {
  const raw = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return Number(raw).toLocaleString('en-US');
  }
  return raw || '-';
};

const unwrapStats = (value: DeviceSpotCheckData): DeviceSpotCheckStats => {
  if (value.inspectionStats && typeof value.inspectionStats === 'object') {
    return value.inspectionStats;
  }
  return value;
};

const resolveData = (value?: DeviceSpotCheckData | null): DeviceSpotCheckStats => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...defaultData, ...unwrapStats(value) };
  }
  return { ...defaultData };
};

const DeviceSpotCheck: React.FC<DeviceSpotCheckProps> = function DeviceSpotCheck(props) {
  const {
    data = defaultData,
    inspectedField = 'inspected',
    overdueField = 'overdue',
    expiringField = 'expiring',
    checkedField,
    centerText = '检',
    inspectedLabel = '已点检',
    checkedLabel,
    overdueLabel = '逾期未检',
    expiringLabel = '即将到期',
    width = 376,
    height = 216,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;

  const [metrics, setMetrics] = useState<DeviceSpotCheckStats>(() => resolveData(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setMetrics(resolveData(data));
    }
  }, [data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DeviceSpotCheckData) => {
          setMetrics(resolveData(nextData));
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeInspectedField = inspectedField || checkedField || 'inspected';
  const safeOverdueField = overdueField || 'overdue';
  const safeExpiringField = expiringField || 'expiring';
  const safeInspectedLabel = inspectedLabel || checkedLabel || '已点检';

  const inspectedValue = pickMetric(
    metrics,
    [safeInspectedField, 'inspected', 'checked'],
    defaultData.inspected,
  );
  const overdueValue = pickMetric(metrics, [safeOverdueField, 'overdue'], defaultData.overdue);
  const expiringValue = pickMetric(metrics, [safeExpiringField, 'expiring'], defaultData.expiring);

  const rootStyle: React.CSSProperties = {
    width,
    ...(height !== undefined && height !== null && height !== ''
      ? { height }
      : { aspectRatio: '816 / 432' }),
    ...style,
  };

  const renderSlot = (
    slot: DeviceSpotCheckSlotKey,
    value: number | string,
    label: string,
  ) => (
    <button
      type="button"
      className={`bizpack-device-spot-check-slot bizpack-device-spot-check-slot-${
        slot === 'inspected' ? 'checked' : slot
      }`}
      title={`${label} ${formatValue(value)}`}
      onClick={() => {
        if (onItemClick) {
          onItemClick(slot, value);
        }
      }}
    >
      <span className="bizpack-device-spot-check-value">{formatValue(value)}</span>
      <span className="bizpack-device-spot-check-label">{label}</span>
    </button>
  );

  return (
    <div
      className={`bizpack-device-spot-check ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      <div className="bizpack-device-spot-check-bg" aria-hidden="true" />
      <span className="bizpack-device-spot-check-center" aria-hidden="true">
        {centerText}
      </span>
      {renderSlot('inspected', inspectedValue, safeInspectedLabel)}
      {renderSlot('overdue', overdueValue, overdueLabel)}
      {renderSlot('expiring', expiringValue, expiringLabel)}
    </div>
  );
};

DeviceSpotCheck.displayName = 'DeviceSpotCheck';
export default DeviceSpotCheck;
