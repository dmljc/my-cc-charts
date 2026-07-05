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
  runningText?: string;
  emergency?: number | string;
  severe?: number | string;
  general?: number | string;
}

export type AlarmStatusOverviewItem = AlarmStatusOverviewData;

export interface AlarmStatusOverviewProps {
  title?: string;
  data?: AlarmStatusOverviewData | AlarmStatusOverviewData[];
  /** 设备名称对应的数据字段名，默认 'name' */
  nameField?: string;
  /** 状态对应的数据字段名，默认 'status'，normal 为正常运行，alarm 为异常告警 */
  statusField?: string;
  /** 正常运行文案对应的数据字段名，默认 'runningText' */
  runningTextField?: string;
  /** 紧急数量对应的数据字段名，默认 'emergency' */
  emergencyField?: string;
  /** 严重数量对应的数据字段名，默认 'severe' */
  severeField?: string;
  /** 一般数量对应的数据字段名，默认 'general' */
  generalField?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: AlarmStatusOverviewData) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: AlarmStatusOverviewData | AlarmStatusOverviewData[]) => void;
  };
}

const defaultData: AlarmStatusOverviewData = {
  id: 1,
  name: 'X12',
  status: 'normal',
  runningText: '正常运行',
  emergency: 3,
  severe: 2,
  general: 10,
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

const normalizeData = (
  nextData?: AlarmStatusOverviewData | AlarmStatusOverviewData[],
): AlarmStatusOverviewData => {
  if (Array.isArray(nextData)) {
    return nextData[0] || defaultData;
  }

  return nextData || defaultData;
};

const normalizeStatus = (status?: unknown): AlarmStatusOverviewStatus => {
  return status === 'alarm' ? 'alarm' : 'normal';
};

const AlarmStatusOverview: React.FC<AlarmStatusOverviewProps> = function AlarmStatusOverview(props) {
  const {
    data = defaultData,
    nameField = 'name',
    statusField = 'status',
    runningTextField = 'runningText',
    emergencyField = 'emergency',
    severeField = 'severe',
    generalField = 'general',
    width = 400,
    height = 98,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;
  const [item, setItem] = useState<AlarmStatusOverviewData>(normalizeData(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setItem(normalizeData(data));
  }, [data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: AlarmStatusOverviewData | AlarmStatusOverviewData[]) => {
          setItem(normalizeData(nextData));
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  const name = (item as any)[nameField] ?? 'X12';
  const status = normalizeStatus((item as any)[statusField]);
  const isAlarm = status === 'alarm';
  const runningText = (item as any)[runningTextField] ?? '正常运行';

  return (
    <div
      className={`bizpack-alarm-status-overview ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <button
        type="button"
        className={`bizpack-alarm-status-overview-card ${
          isAlarm
            ? 'bizpack-alarm-status-overview-card-alarm'
            : 'bizpack-alarm-status-overview-card-normal'
        }`}
        onClick={() => {
          if (onItemClick) {
            onItemClick(item);
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
        <span className="bizpack-alarm-status-overview-name" title={name}>
          {name}
        </span>
        <span className="bizpack-alarm-status-overview-arrow" aria-hidden="true" />

        {isAlarm ? (
          <span className="bizpack-alarm-status-overview-stats">
            <span className="bizpack-alarm-status-overview-stat">
              <span className="bizpack-alarm-status-overview-stat-value bizpack-alarm-status-overview-stat-value-emergency">
                {(item as any)[emergencyField] ?? 0}
              </span>
              <span className="bizpack-alarm-status-overview-stat-label">紧急</span>
            </span>
            <span className="bizpack-alarm-status-overview-stat">
              <span className="bizpack-alarm-status-overview-stat-value bizpack-alarm-status-overview-stat-value-severe">
                {(item as any)[severeField] ?? 0}
              </span>
              <span className="bizpack-alarm-status-overview-stat-label">严重</span>
            </span>
            <span className="bizpack-alarm-status-overview-stat">
              <span className="bizpack-alarm-status-overview-stat-value bizpack-alarm-status-overview-stat-value-general">
                {(item as any)[generalField] ?? 0}
              </span>
              <span className="bizpack-alarm-status-overview-stat-label">一般</span>
            </span>
          </span>
        ) : (
          <span className="bizpack-alarm-status-overview-running">
            <span className="bizpack-alarm-status-overview-running-bg" />
            <span className="bizpack-alarm-status-overview-running-text">{runningText}</span>
          </span>
        )}
      </button>
    </div>
  );
};

AlarmStatusOverview.displayName = 'AlarmStatusOverview';
export default AlarmStatusOverview;
