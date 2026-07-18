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

const DataMonitoringInfo: React.FC<DataMonitoringInfoProps> = function DataMonitoringInfo(props) {
  const {
    data = defaultData,
    width = 400,
    height = 60,
    style = {},
    className = '',
    valueField = 'value',
    unitField = 'unit',
    labelField = 'label',
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
      {items.map((item, index) => (
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
            <div className="bizpack-data-monitoring-info-value">
              {resolveFieldValue(item, valueField)}
              <span className="bizpack-data-monitoring-info-unit">{resolveFieldValue(item, unitField)}</span>
            </div>
            <div className="bizpack-data-monitoring-info-label">{resolveFieldValue(item, labelField)}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

DataMonitoringInfo.displayName = 'DataMonitoringInfo';
export default React.memo(DataMonitoringInfo);
