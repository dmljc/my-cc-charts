import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { DEFAULT_DEVICE_CHECK_TEST_DATA } from './test-data';
import './index.scss';

export type DeviceCheckStatus = 'normal' | 'expiring' | 'overdue';

export interface DeviceCheckItem {
  id?: string | number;
  /** 设备名称 */
  name?: string;
  /** 定检状态，默认 normal */
  status?: DeviceCheckStatus;
  /** 天数，正常/即将到期时表示剩余天数，延期时表示已延期天数 */
  days?: number;
  [key: string]: unknown;
}

export interface DeviceCheckProps {
  data?: DeviceCheckItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 设备名称字段名，默认 name */
  nameField?: string;
  /** 定检状态字段名，默认 status，取值 normal/expiring/overdue */
  statusField?: string;
  /** 天数字段名，默认 days */
  daysField?: string;
  onItemClick?: (item: DeviceCheckItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DeviceCheckItem[]) => void;
  };
}

const defaultData = DEFAULT_DEVICE_CHECK_TEST_DATA as DeviceCheckItem[];

const statusTextMap: Record<DeviceCheckStatus, string> = {
  normal: '正常',
  expiring: '即将到期',
  overdue: '延期',
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

const resolveListData = (value?: DeviceCheckItem[] | null): DeviceCheckItem[] => {
  if (Array.isArray(value)) {
    return value;
  }

  return defaultData;
};

const resolveFieldValue = (item: DeviceCheckItem, field: string) => {
  const value = item[field];

  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  return value;
};

const normalizeStatus = (status?: unknown): DeviceCheckStatus => {
  if (status === 'expiring' || status === 'overdue') {
    return status;
  }

  return 'normal';
};

const resolveDaysNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return undefined;
};

const resolveDaysText = (
  item: DeviceCheckItem,
  status: DeviceCheckStatus,
  daysField: string,
): string => {
  const days = resolveDaysNumber(resolveFieldValue(item, daysField));

  if (days === undefined) {
    return '-';
  }

  return status === 'overdue' ? `延期${days}天` : `剩余${days}天`;
};

const DeviceCheck: React.FC<DeviceCheckProps> = function DeviceCheck(props) {
  const {
    data = defaultData,
    width = 400,
    height = 200,
    style = {},
    className = '',
    nameField = 'name',
    statusField = 'status',
    daysField = 'days',
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
            setItems(nextData);
          }
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  const safeNameField = nameField || 'name';
  const safeStatusField = statusField || 'status';
  const safeDaysField = daysField || 'days';

  return (
    <div
      className={`bizpack-device-check ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-device-check-list">
        {items.map((item, index) => {
          const name = resolveFieldValue(item, safeNameField);
          const displayName = name === undefined ? '' : String(name);
          const status = normalizeStatus(resolveFieldValue(item, safeStatusField));
          const statusText = statusTextMap[status];
          const daysText = resolveDaysText(item, status, safeDaysField);

          return (
            <button
              key={item.id != null ? String(item.id) : index}
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
              <span className="bizpack-device-check-name" title={displayName}>
                {displayName}
              </span>
              <span
                className={`bizpack-device-check-days ${
                  status === 'overdue' ? 'bizpack-device-check-days-overdue' : ''
                }`}
              >
                {daysText}
              </span>
              <span className="bizpack-device-check-status">
                <span className={`bizpack-device-check-status-dot bizpack-device-check-status-dot-${status}`} />
                <span className={`bizpack-device-check-status-text bizpack-device-check-status-text-${status}`}>
                  {statusText}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

DeviceCheck.displayName = 'DeviceCheck';
export default DeviceCheck;
