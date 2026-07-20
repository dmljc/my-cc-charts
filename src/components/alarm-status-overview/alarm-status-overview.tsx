// 告警状态概览
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
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
  nameField?: string;
  statusField?: string;
  emergencyField?: string;
  severeField?: string;
  generalField?: string;
  width?: number | string;
  height?: number | string;
  itemHeight?: number | string;
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
  { id: 1, name: 'X03', status: 'normal' },
  { id: 2, name: 'X06', status: 'normal' },
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

const normalizeStatus = (status?: unknown): AlarmStatusOverviewStatus =>
  status === 'alarm' ? 'alarm' : 'normal';

const resolveFieldValue = (item: AlarmStatusOverviewData, field: string) => {
  const value = (item as Record<string, unknown>)[field];
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  return String(value);
};

/** 0 必须原样显示，不能被 || / ?? 前的空串逻辑吃掉以外的问题；空值才回退 0 */
const resolveCountDisplay = (item: AlarmStatusOverviewData, field: string) => {
  const value = (item as Record<string, unknown>)[field];
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  return value as string | number;
};

/**
 * init_data / ws_data / changeData：整表覆盖，不 concat
 * 数组原样限长；单对象包成一项；缺省用默认数据
 */
const resolveListData = (
  value?: AlarmStatusOverviewData | AlarmStatusOverviewData[] | null,
): AlarmStatusOverviewData[] => {
  if (Array.isArray(value)) {
    return normalizeListData(value);
  }
  if (value && typeof value === 'object') {
    return [value];
  }
  return defaultData;
};

const AlarmStatusOverview: React.FC<AlarmStatusOverviewProps> = function AlarmStatusOverview(props) {
  const {
    data = defaultData,
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

  const [items, setItems] = useState<AlarmStatusOverviewData[]>(() => resolveListData(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  // 与 DeviceCheck 一致：仅静态 data 跟 props；board/ws 走 changeData 整表覆盖
  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setItems(resolveListData(data));
    }
  }, [data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        // ws / board：直接覆盖，禁止与旧列表拼接
        changeData: (nextData: AlarmStatusOverviewData | AlarmStatusOverviewData[]) => {
          setItems(resolveListData(nextData));
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const emergencyVal = resolveCountDisplay(item, safeEmergencyField);
        const severeVal = resolveCountDisplay(item, safeSevereField);
        const generalVal = resolveCountDisplay(item, safeGeneralField);

        return (
          <button
            key={item.id != null ? String(item.id) : `overview-slot-${index}`}
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
                    {emergencyVal}
                  </span>
                  <span className="bizpack-alarm-status-overview-stat-label">紧急</span>
                </span>
                <span className="bizpack-alarm-status-overview-stat">
                  <span className="bizpack-alarm-status-overview-stat-value bizpack-alarm-status-overview-stat-value-severe">
                    {severeVal}
                  </span>
                  <span className="bizpack-alarm-status-overview-stat-label">严重</span>
                </span>
                <span className="bizpack-alarm-status-overview-stat">
                  <span className="bizpack-alarm-status-overview-stat-value bizpack-alarm-status-overview-stat-value-general">
                    {generalVal}
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
// 不用 memo：低代码可能复用 data 引用，memo 会导致 general 等字段不刷新
export default AlarmStatusOverview;
