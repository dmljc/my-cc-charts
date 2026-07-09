// 设备警告
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { DEFAULT_DEVICE_WARNING_TEST_DATA } from './test-data';
import './index.scss';

export type DeviceWarningLevel = 'urgent' | 'normal' | 'regular' | string;

export interface DeviceWarningItem {
  id?: string | number;
  name: string;
  level?: DeviceWarningLevel;
  levelText?: string;
  [key: string]: unknown;
}

export interface DeviceWarningProps {
  data?: DeviceWarningItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 警告名称字段名，默认 name */
  nameField?: string;
  /** 警告等级字段名，默认 level，取值 urgent/normal/regular */
  levelField?: string;
  /** 警告等级文案字段名，默认 levelText */
  levelTextField?: string;
  /** 无警告数据时展示的文案，默认 '正常' */
  emptyText?: string;
  onItemClick?: (item: DeviceWarningItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DeviceWarningItem[]) => void;
  };
}

const defaultData = DEFAULT_DEVICE_WARNING_TEST_DATA as DeviceWarningItem[];

const levelTextMap: Record<string, string> = {
  urgent: '紧急',
  normal: '一般',
  regular: '常规',
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

const resolveListData = (value?: DeviceWarningItem[] | null): DeviceWarningItem[] => {
  if (Array.isArray(value)) {
    return value;
  }

  return defaultData;
};

const resolveFieldValue = (item: DeviceWarningItem, field: string) => {
  const value = item[field];

  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value);
};

const DeviceWarning: React.FC<DeviceWarningProps> = function DeviceWarning(props) {
  const {
    width = 400,
    height = 200,
    style = {},
    className = '',
    nameField = 'name',
    levelField = 'level',
    levelTextField = 'levelText',
    emptyText = '正常',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<DeviceWarningItem[]>(() => resolveListData(props.data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setItems(resolveListData(props.data));
    }
  }, [props.data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DeviceWarningItem[]) => {
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

  const hasWarning = items.length > 0;
  const safeNameField = nameField || 'name';
  const safeLevelField = levelField || 'level';
  const safeLevelTextField = levelTextField || 'levelText';

  return (
    <div
      className={`bizpack-device-warning ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      {hasWarning ? (
        <div className="bizpack-device-warning-list">
          {items.map((item, index) => {
            const name = resolveFieldValue(item, safeNameField);
            const level = resolveFieldValue(item, safeLevelField) || 'regular';
            const levelText =
              resolveFieldValue(item, safeLevelTextField) || levelTextMap[level] || level;

            return (
              <button
                key={item.id != null ? String(item.id) : index}
                type="button"
                className={`bizpack-device-warning-row bizpack-device-warning-row-${level}`}
                onClick={() => {
                  if (onItemClick) {
                    onItemClick(item, index);
                  }
                }}
              >
                <span className="bizpack-device-warning-icon-wrap">
                  <span className="bizpack-device-warning-icon" />
                </span>
                <span className="bizpack-device-warning-name" title={name}>
                  {name}
                </span>
                <span className="bizpack-device-warning-level">{levelText}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bizpack-device-warning-empty">
          <span className="bizpack-device-warning-empty-bg" />
          <span className="bizpack-device-warning-empty-text">{emptyText}</span>
        </div>
      )}
    </div>
  );
};

DeviceWarning.displayName = 'DeviceWarning';
export default DeviceWarning;
