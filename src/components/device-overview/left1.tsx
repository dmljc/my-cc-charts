// 设备概览（总数 / 工作 / 闲置）
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
import { DEFAULT_LEFT1_TEST_DATA } from './test-data';
import './index.scss';

export type Left1Theme = 'orange' | 'blue' | 'green' | string;

export interface Left1Item {
  id?: string | number;
  name?: string;
  value?: number | string;
  unit?: string;
  theme?: Left1Theme;
  [key: string]: unknown;
}

/** 与后端 overviewStats 一致 */
export interface Left1ObjectData {
  totalDevices?: number | string;
  workingDevices?: number | string;
  idleDevices?: number | string;
  overviewStats?: {
    totalDevices?: number | string;
    workingDevices?: number | string;
    idleDevices?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Left1Props {
  data?: Left1Item[] | Left1ObjectData;
  nameField?: string;
  valueField?: string;
  unitField?: string;
  themeField?: string;
  unit?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: Left1Item, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: Left1Item[] | Left1ObjectData) => void;
  };
}

const SLOT_COUNT = 3;
const SLOT_THEMES: Left1Theme[] = ['orange', 'blue', 'green'];
const SLOT_DEFAULTS: Left1Item[] = [
  { id: 1, name: '设备总数', value: 0, unit: '个', theme: 'orange' },
  { id: 2, name: '工作设备', value: 0, unit: '个', theme: 'blue' },
  { id: 3, name: '闲置设备', value: 0, unit: '个', theme: 'green' },
];
const defaultData = DEFAULT_LEFT1_TEST_DATA as Left1ObjectData;

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

const resolveFieldValue = (item: Left1Item, field: string) => {
  const value = item[field];
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return value;
};

const resolveTheme = (raw: unknown, index: number): Left1Theme => {
  const text = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (text === 'orange' || text === 'total' || text === 'totaldevices' || text === 'origin') {
    return 'orange';
  }
  if (text === 'blue' || text === 'working' || text === 'workingdevices' || text === 'work') {
    return 'blue';
  }
  if (text === 'green' || text === 'idle' || text === 'idledevices') {
    return 'green';
  }
  return SLOT_THEMES[index] || 'orange';
};

const unwrapOverviewStats = (value: Left1ObjectData): Left1ObjectData => {
  if (value.overviewStats && typeof value.overviewStats === 'object') {
    return value.overviewStats as Left1ObjectData;
  }
  return value;
};

const pickMetric = (value: Left1ObjectData, primary: string, fallback: string) => {
  if (Object.prototype.hasOwnProperty.call(value, primary) && value[primary] !== undefined && value[primary] !== null && value[primary] !== '') {
    return value[primary] as number | string;
  }
  if (Object.prototype.hasOwnProperty.call(value, fallback) && value[fallback] !== undefined && value[fallback] !== null && value[fallback] !== '') {
    return value[fallback] as number | string;
  }
  return undefined;
};

const fromObjectData = (value: Left1ObjectData): Left1Item[] => {
  const stats = unwrapOverviewStats(value);
  return [
    {
      ...SLOT_DEFAULTS[0],
      value: pickMetric(stats, 'totalDevices', 'total') ?? SLOT_DEFAULTS[0].value,
    },
    {
      ...SLOT_DEFAULTS[1],
      value: pickMetric(stats, 'workingDevices', 'working') ?? SLOT_DEFAULTS[1].value,
    },
    {
      ...SLOT_DEFAULTS[2],
      value: pickMetric(stats, 'idleDevices', 'idle') ?? SLOT_DEFAULTS[2].value,
    },
  ];
};

const isOverviewObject = (value: Left1ObjectData) =>
  'overviewStats' in value ||
  'totalDevices' in value ||
  'workingDevices' in value ||
  'idleDevices' in value ||
  'total' in value ||
  'working' in value ||
  'idle' in value;

const padSlots = (list: Left1Item[]): Left1Item[] => {
  const next = list.slice(0, SLOT_COUNT);
  while (next.length < SLOT_COUNT) {
    next.push({ ...SLOT_DEFAULTS[next.length] });
  }
  return next.map((item, index) => ({
    ...SLOT_DEFAULTS[index],
    ...item,
  }));
};

const resolveListData = (value?: Left1Item[] | Left1ObjectData | null): Left1Item[] => {
  if (Array.isArray(value)) {
    return padSlots(normalizeListData(value));
  }
  if (value && typeof value === 'object') {
    if (isOverviewObject(value)) {
      return padSlots(fromObjectData(value));
    }
  }
  return padSlots(fromObjectData(defaultData));
};

const Left1: React.FC<Left1Props> = function Left1(props) {
  const {
    data = defaultData,
    nameField = 'name',
    valueField = 'value',
    unitField = 'unit',
    themeField = 'theme',
    unit = '个',
    width = 376,
    height = 188,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;

  const [items, setItems] = useState<Left1Item[]>(() => resolveListData(data));
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
        changeData: (nextData: Left1Item[] | Left1ObjectData) => {
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
  const safeUnitField = unitField || 'unit';
  const safeThemeField = themeField || 'theme';
  const slots = padSlots(items);

  const renderCard = (item: Left1Item, index: number) => {
    const name = String(resolveFieldValue(item, safeNameField) || SLOT_DEFAULTS[index].name);
    const valueRaw = resolveFieldValue(item, safeValueField);
    const value = valueRaw === '' ? SLOT_DEFAULTS[index].value : valueRaw;
    const itemUnit = String(resolveFieldValue(item, safeUnitField) || unit || '');
    const theme = resolveTheme(resolveFieldValue(item, safeThemeField), index);
    const sizeClass = index === 0 ? 'bizpack-left1-card-total' : 'bizpack-left1-card-small';

    return (
      <button
        key={item.id != null ? String(item.id) : `left1-slot-${index}`}
        type="button"
        className={`bizpack-left1-card ${sizeClass} bizpack-left1-card-${theme}`}
        title={`${name} ${value}${itemUnit}`}
        onClick={() => {
          if (onItemClick) {
            onItemClick(item, index);
          }
        }}
      >
        <span className="bizpack-left1-label" title={name}>
          {name}
        </span>
        <span className="bizpack-left1-right">
          <span className={`bizpack-left1-gauge bizpack-left1-gauge-${theme}`} aria-hidden="true" />
          <span className="bizpack-left1-metric">
            <span className="bizpack-left1-value">{value}</span>
            {itemUnit ? <span className="bizpack-left1-unit">{itemUnit}</span> : null}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div
      className={`bizpack-left1 ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      {renderCard(slots[0], 0)}
      <div className="bizpack-left1-bottom">
        {renderCard(slots[1], 1)}
        {renderCard(slots[2], 2)}
      </div>
    </div>
  );
};

Left1.displayName = 'Left1';
export default Left1;
