// 告警状态概览
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export type AlarmStatusOverviewStatus = 'normal' | 'alarm';

export interface AlarmStatusOverviewData {
  id?: string | number;
  name?: string;
  status?: AlarmStatusOverviewStatus;
  emergency?: number | string;
  severe?: number | string;
  general?: number | string;
  [key: string]: unknown;
}

export type AlarmStatusOverviewItem = AlarmStatusOverviewData;

const RUNNING_TEXT = '正常运行';

export interface AlarmStatusOverviewProps {
  title?: string;
  data?: AlarmStatusOverviewData | AlarmStatusOverviewData[];
  /** 设备名称对应的数据字段名，默认 'name' */
  nameField?: string;
  /** 状态对应的数据字段名，默认 'status'，normal 为正常运行，alarm 为异常告警 */
  statusField?: string;
  /** 紧急数量对应的数据字段名，默认 'emergency' */
  emergencyField?: string;
  /** 严重数量对应的数据字段名，默认 'severe' */
  severeField?: string;
  /** 一般数量对应的数据字段名，默认 'general' */
  generalField?: string;
  width?: number | string;
  /** 列表容器高度，超出后滚动，默认 'auto' */
  height?: number | string;
  /** 单张卡片高度，默认 98 */
  itemHeight?: number | string;
  /** 卡片间距，默认 12 */
  gap?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: AlarmStatusOverviewData, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: AlarmStatusOverviewData | AlarmStatusOverviewData[]) => void;
  };
}

const defaultData: AlarmStatusOverviewData[] = [
  {
    id: 1,
    name: 'X03',
    status: 'normal',
  },
  {
    id: 2,
    name: 'X06',
    status: 'normal',
  },
  {
    id: 3,
    name: 'X12',
    status: 'alarm',
    emergency: 3,
    severe: 2,
    general: 10,
  },
];

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

const normalizeList = (
  nextData?: AlarmStatusOverviewData | AlarmStatusOverviewData[] | null,
): AlarmStatusOverviewData[] => {
  if (Array.isArray(nextData)) {
    return nextData;
  }

  if (nextData && typeof nextData === 'object') {
    return [nextData];
  }

  return defaultData;
};

const normalizeStatus = (status?: unknown): AlarmStatusOverviewStatus => {
  return status === 'alarm' ? 'alarm' : 'normal';
};

const resolveFieldValue = (item: AlarmStatusOverviewData, field: string) => {
  const value = (item as Record<string, unknown>)[field];

  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  return String(value);
};

const AlarmStatusOverview: React.FC<AlarmStatusOverviewProps> = function AlarmStatusOverview(props) {
  const {
    data,
    nameField = 'name',
    statusField = 'status',
    emergencyField = 'emergency',
    severeField = 'severe',
    generalField = 'general',
    width = 400,
    height = 'auto',
    itemHeight = 98,
    gap = 12,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<AlarmStatusOverviewData[]>(() => normalizeList(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setItems(normalizeList(data));
    }
  }, [data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: AlarmStatusOverviewData | AlarmStatusOverviewData[]) => {
          setItems(normalizeList(nextData));
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
  const safeEmergencyField = emergencyField || 'emergency';
  const safeSevereField = severeField || 'severe';
  const safeGeneralField = generalField || 'general';

  return (
    <div
      className={`bizpack-alarm-status-overview ${className}`}
      style={{ width, height, gap, ...style }}
      {...rootDomProps}
    >
      {items.map((item, index) => {
        const displayName = resolveFieldValue(item, safeNameField) ?? '';
        const status = normalizeStatus((item as Record<string, unknown>)[safeStatusField]);
        const isAlarm = status === 'alarm';

        return (
          <button
            key={item.id != null ? String(item.id) : index}
            type="button"
            className={`bizpack-alarm-status-overview-card ${
              isAlarm
                ? 'bizpack-alarm-status-overview-card-alarm'
                : 'bizpack-alarm-status-overview-card-normal'
            }`}
            style={{ height: itemHeight }}
            onClick={() => {
              if (onItemClick) {
                onItemClick(item, index);
              }
            }}
          >
            <span
              className={`bizpack-alarm-status-overview-dot ${
                isAlarm
                  ? 'bizpack-alarm-status-overview-dot-alarm'
                  : 'bizpack-alarm-status-overview-dot-normal'
              }`}
            />
            <span className="bizpack-alarm-status-overview-name" title={displayName}>
              {displayName}
            </span>
            <span className="bizpack-alarm-status-overview-arrow" aria-hidden="true" />

            {isAlarm ? (
              <span className="bizpack-alarm-status-overview-stats">
                <span className="bizpack-alarm-status-overview-stat">
                  <span className="bizpack-alarm-status-overview-stat-value bizpack-alarm-status-overview-stat-value-emergency">
                    {(item as Record<string, unknown>)[safeEmergencyField] ?? 0}
                  </span>
                  <span className="bizpack-alarm-status-overview-stat-label">紧急</span>
                </span>
                <span className="bizpack-alarm-status-overview-stat">
                  <span className="bizpack-alarm-status-overview-stat-value bizpack-alarm-status-overview-stat-value-severe">
                    {(item as Record<string, unknown>)[safeSevereField] ?? 0}
                  </span>
                  <span className="bizpack-alarm-status-overview-stat-label">严重</span>
                </span>
                <span className="bizpack-alarm-status-overview-stat">
                  <span className="bizpack-alarm-status-overview-stat-value bizpack-alarm-status-overview-stat-value-general">
                    {(item as Record<string, unknown>)[safeGeneralField] ?? 0}
                  </span>
                  <span className="bizpack-alarm-status-overview-stat-label">一般</span>
                </span>
              </span>
            ) : (
              <span className="bizpack-alarm-status-overview-running">
                <span className="bizpack-alarm-status-overview-running-bg" />
                <span className="bizpack-alarm-status-overview-running-text">{RUNNING_TEXT}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

AlarmStatusOverview.displayName = 'AlarmStatusOverview';
export default AlarmStatusOverview;
