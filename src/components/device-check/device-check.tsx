import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export type DeviceCheckStatus = 'normal' | 'expiring' | 'overdue';

export interface DeviceCheckItem {
  id?: string | number;
  /** 设备名称 */
  name: string;
  /** 定检状态，默认 normal */
  status?: DeviceCheckStatus;
  /** 状态文案，不传则根据 status 自动映射 */
  statusText?: string;
  /** 天数，正常/即将到期时表示剩余天数，延期时表示已延期天数 */
  days?: number;
  /** 天数展示文案，不传则根据 status + days 自动拼接 */
  daysText?: string;
  [key: string]: unknown;
}

export interface DeviceCheckProps {
  data?: DeviceCheckItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: DeviceCheckItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DeviceCheckItem[]) => void;
  };
}

const defaultData: DeviceCheckItem[] = [
  { id: 1, name: '设备1', status: 'normal', days: 50 },
  { id: 2, name: '设备1', status: 'expiring', days: 50 },
  { id: 3, name: '设备1', status: 'overdue', days: 30 },
];

const statusTextMap: Record<DeviceCheckStatus, string> = {
  normal: '正常',
  expiring: '即将到期',
  overdue: '延期',
};

const normalizeStatus = (status?: string): DeviceCheckStatus => {
  if (status === 'expiring' || status === 'overdue') {
    return status;
  }

  return 'normal';
};

const resolveDaysText = (item: DeviceCheckItem, status: DeviceCheckStatus): string => {
  if (item.daysText) {
    return item.daysText;
  }

  if (item.days === undefined || item.days === null) {
    return '-';
  }

  return status === 'overdue' ? `延期${item.days}天` : `剩余${item.days}天`;
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

const DeviceCheck: React.FC<DeviceCheckProps> = function DeviceCheck(props) {
  const {
    data = defaultData,
    width = 400,
    height = 200,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<DeviceCheckItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    setItems(data);
  }, [data]);

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

  return (
    <div
      className={`bizpack-device-check ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-device-check-list">
        {items.map((item, index) => {
          const status = normalizeStatus(item.status);
          const statusText = item.statusText || statusTextMap[status];
          const daysText = resolveDaysText(item, status);

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
              <span className="bizpack-device-check-name" title={item.name}>
                {item.name}
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
