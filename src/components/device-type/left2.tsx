// 设备类型（立体柱）
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
import { DEFAULT_LEFT2_TEST_DATA } from './test-data';
import './index.scss';

export type Left2Theme = 'blue' | 'green' | string;

export interface Left2Item {
  id?: string | number;
  name?: string;
  value?: number | string;
  theme?: Left2Theme;
  [key: string]: unknown;
}

/** 与后端 deviceTypes 一致：{ "PLC 设备": 5, "QTC 设备": 4 } */
export type Left2DeviceTypesMap = Record<string, number | string>;

export interface Left2DeviceTypesPayload {
  deviceTypes?: Left2DeviceTypesMap;
  [key: string]: unknown;
}

export type Left2DataInput = Left2Item[] | Left2DeviceTypesMap | Left2DeviceTypesPayload;

export interface Left2Props {
  data?: Left2DataInput;
  nameField?: string;
  valueField?: string;
  themeField?: string;
  columns?: number;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: Left2Item, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: Left2DataInput) => void;
  };
}

const defaultData = DEFAULT_LEFT2_TEST_DATA;

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

const resolveFieldValue = (item: Left2Item, field: string) => {
  const value = item[field];
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return value;
};

const resolveTheme = (raw: unknown, index: number): Left2Theme => {
  const text = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (text === 'blue' || text === 'green') {
    return text;
  }
  const col = index % 2;
  const row = Math.floor(index / 2);
  return (row + col) % 2 === 0 ? 'blue' : 'green';
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const raw = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return Number(raw).toLocaleString('en-US');
  }
  return raw;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isDeviceTypesMap = (value: Record<string, unknown>) => {
  const keys = Object.keys(value);
  if (!keys.length) {
    return false;
  }
  // 排除包装对象字段，避免把 deviceTypes 外壳误判成 map
  if (keys.length === 1 && keys[0] === 'deviceTypes') {
    return false;
  }
  return keys.every((key) => {
    const v = value[key];
    return typeof v === 'number' || typeof v === 'string' || v === null || v === undefined;
  });
};

const fromDeviceTypesMap = (map: Left2DeviceTypesMap): Left2Item[] =>
  Object.keys(map).map((name, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const theme: Left2Theme = (row + col) % 2 === 0 ? 'blue' : 'green';
    return {
      id: index + 1,
      name,
      value: map[name],
      theme,
    };
  });

const resolveListData = (value?: Left2DataInput | null): Left2Item[] => {
  if (Array.isArray(value) && value.length) {
    return normalizeListData(value);
  }

  if (isPlainObject(value)) {
    if (isPlainObject(value.deviceTypes)) {
      return normalizeListData(fromDeviceTypesMap(value.deviceTypes as Left2DeviceTypesMap));
    }
    if (isDeviceTypesMap(value)) {
      return normalizeListData(fromDeviceTypesMap(value as Left2DeviceTypesMap));
    }
  }

  return normalizeListData(fromDeviceTypesMap(defaultData));
};

const Left2: React.FC<Left2Props> = function Left2(props) {
  const {
    data = defaultData,
    nameField = 'name',
    valueField = 'value',
    themeField = 'theme',
    columns = 2,
    width = 376,
    height = 330,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;

  const [items, setItems] = useState<Left2Item[]>(() => resolveListData(data));
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
        changeData: (nextData: Left2DataInput) => {
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
  const safeValueField = valueField || 'value';
  const safeThemeField = themeField || 'theme';
  const colCount = Number(columns) > 0 ? Number(columns) : 2;
  const lastRowStart = Math.max(0, items.length - ((items.length % colCount) || colCount));
  const rootStyle: React.CSSProperties = {
    width,
    ...(height !== undefined && height !== null && height !== '' ? { height } : {}),
    gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
    ...style,
  };

  return (
    <div
      className={`bizpack-left2 ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      {items.map((item, index) => {
        const name = String(resolveFieldValue(item, safeNameField) || '-');
        const value = formatValue(resolveFieldValue(item, safeValueField));
        const theme = resolveTheme(resolveFieldValue(item, safeThemeField), index);
        const isLastCol = index % colCount === colCount - 1;
        const isLastRow = index >= lastRowStart;
        const dividerClass = [
          !isLastCol ? 'bizpack-left2-item-divider-right' : '',
          !isLastRow ? 'bizpack-left2-item-divider-bottom' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={item.id != null ? String(item.id) : `left2-slot-${index}`}
            type="button"
            className={`bizpack-left2-item bizpack-left2-item-${theme} ${dividerClass}`.trim()}
            title={`${name} ${value}`}
            onClick={() => {
              if (onItemClick) {
                onItemClick(item, index);
              }
            }}
          >
            <span className="bizpack-left2-value">{value}</span>
            <span className={`bizpack-left2-bar bizpack-left2-bar-${theme}`} aria-hidden="true" />
            <span className="bizpack-left2-label" title={name}>
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

Left2.displayName = 'Left2';
export default Left2;
