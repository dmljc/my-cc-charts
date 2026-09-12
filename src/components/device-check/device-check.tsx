import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
import { DEFAULT_DEVICE_CHECK_TEST_DATA } from './test-data';
import './index.scss';

export type DeviceCheckStatusTone = 'normal' | 'expiring' | 'overdue';
/** @deprecated 请使用 DeviceCheckStatusTone，status 字段现为接口文案 */
export type DeviceCheckStatus = DeviceCheckStatusTone;

export interface DeviceCheckItem {
  id?: string | number;
  /** 设备名称 */
  deviceName?: string;
  /** 剩余/延期天数文案，如：剩余50天、延期3天 */
  remainingDaysText?: string;
  /** 定检状态文案，如：正常、即将到期、延期 */
  status?: string;
  [key: string]: unknown;
}

export interface DeviceCheckProps {
  data?: DeviceCheckItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 设备名称字段名，默认 deviceName */
  deviceNameField?: string;
  /** 天数文案字段名，默认 remainingDaysText */
  remainingDaysTextField?: string;
  /** 状态字段名，默认 status */
  statusField?: string;
  /** 无定检数据时展示的文案，默认 '正常' */
  emptyText?: string;
  onItemClick?: (item: DeviceCheckItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DeviceCheckItem[]) => void;
  };
}

const defaultData = DEFAULT_DEVICE_CHECK_TEST_DATA as DeviceCheckItem[];

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

const resolveListData = (value?: DeviceCheckItem[] | null): DeviceCheckItem[] => {
  if (Array.isArray(value)) {
    return normalizeListData(value);
  }

  return defaultData;
};

const resolveFieldValue = (item: DeviceCheckItem, field: string) => {
  const value = item[field];

  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value);
};

/** 根据状态文案推断样式色调 */
const resolveStatusTone = (statusText: string): DeviceCheckStatusTone => {
  const text = statusText.trim();

  if (
    text === 'overdue' ||
    text.indexOf('逾期') >= 0 ||
    text.indexOf('延期') >= 0
  ) {
    return 'overdue';
  }

  if (
    text === 'expiring' ||
    text.indexOf('即将到期') >= 0 ||
    text.indexOf('临期') >= 0
  ) {
    return 'expiring';
  }

  return 'normal';
};

const DeviceCheck: React.FC<DeviceCheckProps> = function DeviceCheck(props) {
  const {
    data = defaultData,
    width = 400,
    height = 200,
    style = {},
    className = '',
    deviceNameField = 'deviceName',
    remainingDaysTextField = 'remainingDaysText',
    statusField = 'status',
    emptyText = '正常',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<DeviceCheckItem[]>(() => resolveListData(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setItems(resolveListData(data));
    }
  }, [data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DeviceCheckItem[]) => {
          if (Array.isArray(nextData)) {
            setItems(normalizeListData(nextData));
          }
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasItems = items.length > 0;
  const safeDeviceNameField = deviceNameField || 'deviceName';
  const safeRemainingDaysTextField = remainingDaysTextField || 'remainingDaysText';
  const safeStatusField = statusField || 'status';

  return (
    <div
      className={`bizpack-device-check ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      {hasItems ? (
        <div className="bizpack-device-check-list">
          {items.map((item, index) => {
            const deviceName = resolveFieldValue(item, safeDeviceNameField);
            const remainingDaysText = resolveFieldValue(item, safeRemainingDaysTextField);
            const statusText = resolveFieldValue(item, safeStatusField);
            const tone = resolveStatusTone(statusText || remainingDaysText);

            return (
              <button
                key={item.id != null ? String(item.id) : `${deviceName}-${index}`}
                type="button"
                className="bizpack-device-check-row"
                onClick={() => {
                  if (onItemClick) {
                    onItemClick(item, index);
                  }
                }}
              >
                <span className="bizpack-device-check-icon-wrap">
                  <span className="bizpack-device-check-icon" />
                </span>
                <span className="bizpack-device-check-name" title={deviceName}>
                  {deviceName}
                </span>
                <span
                  className={`bizpack-device-check-days ${
                    tone === 'overdue' ? 'bizpack-device-check-days-overdue' : ''
                  }`}
                  title={remainingDaysText}
                >
                  {remainingDaysText || '-'}
                </span>
                <span className="bizpack-device-check-status">
                  <span
                    className={`bizpack-device-check-status-dot bizpack-device-check-status-dot-${tone}`}
                  />
                  <span
                    className={`bizpack-device-check-status-text bizpack-device-check-status-text-${tone}`}
                  >
                    {statusText}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bizpack-device-check-empty">
          <span className="bizpack-device-check-empty-bg" />
          <span className="bizpack-device-check-empty-text">{emptyText}</span>
        </div>
      )}
    </div>
  );
};

DeviceCheck.displayName = 'DeviceCheck';
export default React.memo(DeviceCheck);
