import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface DataMonitoringInfoItem {
  id?: string | number;
  /** 指标数值 */
  value?: string | number;
  /** 指标单位 */
  unit?: string;
  /** 指标名称 */
  label?: string;
  /** 自定义图标地址，可选 */
  icon?: string;
  [key: string]: unknown;
}

export interface DataMonitoringInfoProps {
  data?: DataMonitoringInfoItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 数值字段名，默认 value */
  valueField?: string;
  /** 单位字段名，默认 unit */
  unitField?: string;
  /** 名称字段名，默认 label */
  labelField?: string;
  /** 图标字段名，默认 icon */
  iconField?: string;
  onItemClick?: (item: DataMonitoringInfoItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DataMonitoringInfoItem[]) => void;
  };
}

const defaultData: DataMonitoringInfoItem[] = [
  { id: 1, value: '12', unit: 'm³/h', label: '流量' },
  { id: 2, value: '12', unit: 'm³/h', label: '流速' },
  { id: 3, value: '1.3', unit: 'pa', label: '压力' },
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

const resolveFieldValue = (item: DataMonitoringInfoItem, field: string) => {
  const value = item[field];

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
};

const resolveOptionalFieldValue = (item: DataMonitoringInfoItem, field: string) => {
  const value = item[field];

  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value);
};

/** 流量：脉搏波形 */
const IconFlow = () => (
  <svg className="bizpack-data-monitoring-info-icon" viewBox="0 0 16 16" aria-hidden="true">
    <polyline
      points="1,8 3.5,8 5,4 7,12 9,5 11,8 15,8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 流速：波浪线 */
const IconVelocity = () => (
  <svg className="bizpack-data-monitoring-info-icon" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M2 5.5c1.2-1.2 2.8-1.2 4 0s2.8 1.2 4 0 2.8-1.2 4 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M2 8.5c1.2-1.2 2.8-1.2 4 0s2.8 1.2 4 0 2.8-1.2 4 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M2 11.5c1.2-1.2 2.8-1.2 4 0s2.8 1.2 4 0 2.8-1.2 4 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

/** 压力：下箭头 + 波形 */
const IconPressure = () => (
  <svg className="bizpack-data-monitoring-info-icon" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M5 2.5v5.5H3.2L8 13l4.8-5H11V2.5z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 14.2c1-.8 2.2-.8 3.2 0s2.2.8 3.2 0 2.2-.8 3.2 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const DEFAULT_ICONS = [IconFlow, IconVelocity, IconPressure];

const resolveDefaultIcon = (label: string, index: number) => {
  if (label.indexOf('流量') >= 0) {
    return IconFlow;
  }
  if (label.indexOf('流速') >= 0) {
    return IconVelocity;
  }
  if (label.indexOf('压力') >= 0) {
    return IconPressure;
  }
  return DEFAULT_ICONS[index % DEFAULT_ICONS.length];
};

const DataMonitoringInfo: React.FC<DataMonitoringInfoProps> = function DataMonitoringInfo(props) {
  const {
    data = defaultData,
    width = 395,
    height = 110,
    style = {},
    className = '',
    valueField = 'value',
    unitField = 'unit',
    labelField = 'label',
    iconField = 'icon',
    onItemClick,
    ...otherProps
  } = props;

  const [items, setItems] = useState<DataMonitoringInfoItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    // 显式传空数组时保持为空，不回落到默认演示数据
    if (props.data !== undefined) {
      setItems(Array.isArray(props.data) ? props.data : []);
      return;
    }

    setItems(defaultData);
  }, [props.data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DataMonitoringInfoItem[]) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 指标数据为空时不渲染，避免占位空白条
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div
      className={`bizpack-data-monitoring-info ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      {items.map((item, index) => {
        const label = resolveFieldValue(item, labelField);
        const iconUrl = resolveOptionalFieldValue(item, iconField);
        const DefaultIcon = resolveDefaultIcon(label, index);

        return (
          <React.Fragment key={item.id != null ? String(item.id) : index}>
            {index > 0 ? <div className="bizpack-data-monitoring-info-divider" /> : null}
            <div
              className="bizpack-data-monitoring-info-item"
              onClick={() => {
                if (onItemClick) {
                  onItemClick(item, index);
                }
              }}
            >
              <div className="bizpack-data-monitoring-info-head">
                {iconUrl ? (
                  <img className="bizpack-data-monitoring-info-icon-img" src={iconUrl} alt="" />
                ) : (
                  <DefaultIcon />
                )}
                <div className="bizpack-data-monitoring-info-label">{label}</div>
              </div>
              <div className="bizpack-data-monitoring-info-value">
                <span className="bizpack-data-monitoring-info-number">{resolveFieldValue(item, valueField)}</span>
                <span className="bizpack-data-monitoring-info-unit">{resolveFieldValue(item, unitField)}</span>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

DataMonitoringInfo.displayName = 'DataMonitoringInfo';
export default React.memo(DataMonitoringInfo);
