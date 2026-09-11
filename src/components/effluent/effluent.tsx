// 流出物
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
import './index.scss';

/** 箭头方向，与接口字段 arrow 一致 */
export type EffluentArrow = 'up' | 'down' | 'flat' | string;
/** @deprecated 请使用 EffluentArrow */
export type EffluentTrend = EffluentArrow;

export interface EffluentItem {
  id?: string | number;
  /** 名称，接口字段 name */
  name?: string;
  /** 当前值，接口字段 value */
  value?: number | string;
  /** 阈值，接口字段 threshold */
  threshold?: number | string;
  /** 箭头方向，接口字段 arrow，取值 up/down */
  arrow?: EffluentArrow;
  [key: string]: unknown;
}

export interface EffluentProps {
  title?: string;
  data?: EffluentItem[];
  /** 名称字段名，默认 name */
  nameField?: string;
  /** 数值字段名，默认 value */
  valueField?: string;
  /** 阈值字段名，默认 threshold */
  thresholdField?: string;
  /** 箭头字段名，默认 arrow，取值 up/down */
  arrowField?: string;
  /** 数值单位后缀 */
  unit?: string;
  /** 可选；不传则由内容自适应撑开 */
  width?: number | string;
  /** 可选；不传则由内容自适应撑开 */
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: EffluentItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: EffluentItem[]) => void;
    getData?: () => EffluentItem[];
  };
}

const ArrowIcon: React.FC = function ArrowIcon() {
  return (
    <svg
      className="bizpack-effluent-arrow-icon"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 10.5V1.5M2 5.5L6 1.5L10 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const defaultData: EffluentItem[] = [
  { id: 1, name: '全排', value: 0.3, threshold: 1, arrow: 'down' },
  { id: 2, name: '特排', value: 0.285, threshold: 100, arrow: 'down' },
  { id: 3, name: '局排', value: 0.285, threshold: 10, arrow: 'down' },
  { id: 4, name: '特排', value: 1000, threshold: 100, arrow: 'up' },
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

const resolveFieldValue = (item: EffluentItem, field: string) => {
  const value = item[field];

  if (value === null || value === undefined || value === '') {
    return '';
  }

  return value;
};

const resolveArrow = (
  arrowRaw: unknown,
  valueRaw: unknown,
  thresholdRaw: unknown,
): EffluentArrow => {
  const arrow = String(arrowRaw ?? '').trim().toLowerCase();

  if (arrow === 'up' || arrow === 'down' || arrow === 'flat') {
    return arrow;
  }

  const value = Number(valueRaw);
  const threshold = Number(thresholdRaw);

  if (Number.isFinite(value) && Number.isFinite(threshold)) {
    if (value > threshold) {
      return 'up';
    }

    if (value < threshold) {
      return 'down';
    }
  }

  return 'flat';
};

/** 按 id 去重，去掉 concat 造成的重复节点（名称可重复故不用 name） */
const dedupeById = (list: EffluentItem[]): EffluentItem[] => {
  if (!Array.isArray(list) || list.length <= 1) {
    return Array.isArray(list) ? list.slice() : [];
  }
  const seen = new Set<string>();
  const result: EffluentItem[] = [];
  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      return;
    }
    const key = item.id != null ? `id:${String(item.id)}` : `idx:${index}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push({ ...item });
  });
  return result;
};

/**
 * 槽位更新：长度以已有为准，只合并 value / arrow，绝不追加
 */
const patchEffluentItems = (prev: EffluentItem[], incoming: EffluentItem[]): EffluentItem[] => {
  if (!Array.isArray(incoming) || !incoming.length) {
    return prev;
  }
  const incomingNorm = dedupeById(normalizeListData(incoming));
  if (!Array.isArray(prev) || !prev.length) {
    return incomingNorm;
  }

  const next = prev.map((item) => ({ ...item }));
  const used: Record<number, boolean> = {};

  incomingNorm.forEach((item, i) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    let idx = -1;
    if (item.id != null) {
      idx = next.findIndex((row, rowIdx) => !used[rowIdx] && row.id == item.id);
    }
    if (idx < 0 && i < next.length && !used[i]) {
      idx = i;
    }
    if (idx < 0) {
      return;
    }

    used[idx] = true;
    if (Object.prototype.hasOwnProperty.call(item, 'value')) {
      next[idx].value = item.value;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'arrow')) {
      next[idx].arrow = item.arrow;
    }
  });

  return next;
};

const Effluent: React.FC<EffluentProps> = function Effluent(props) {
  const {
    data = defaultData,
    nameField = 'name',
    valueField = 'value',
    thresholdField = 'threshold',
    arrowField = 'arrow',
    unit = '',
    width,
    height,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<EffluentItem[]>(() => {
    if (Array.isArray(data) && data !== defaultData) {
      return dedupeById(normalizeListData(data));
    }
    return defaultData;
  });
  /** 首次非默认数据建槽后锁定长度；之后只改 value */
  const structureReadyRef = React.useRef(
    Array.isArray(data) && data.length > 0 && data !== defaultData,
  );
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    if (props.dataType && props.dataType !== 'data') {
      return;
    }
    if (!Array.isArray(data)) {
      return;
    }
    if (data === defaultData) {
      setItems(defaultData);
      return;
    }

    const list = dedupeById(normalizeListData(data));
    if (!list.length) {
      structureReadyRef.current = false;
      setItems([]);
      return;
    }

    if (!structureReadyRef.current) {
      setItems(list);
      structureReadyRef.current = true;
      return;
    }

    setItems((prev) => {
      // 去重后变短：用真实列表纠正历史堆积
      if (list.length < prev.length) {
        return list;
      }
      return patchEffluentItems(prev, list);
    });
  }, [data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: EffluentItem[]) => {
          if (!Array.isArray(nextData)) {
            return;
          }
          const list = dedupeById(normalizeListData(nextData));
          if (!list.length) {
            structureReadyRef.current = false;
            setItems([]);
            return;
          }
          setItems((prev) => {
            if (!structureReadyRef.current || !prev.length) {
              structureReadyRef.current = true;
              return list;
            }
            if (list.length < prev.length) {
              return list;
            }
            // isAdd concat 的长数组也只按槽位改 value
            return patchEffluentItems(prev, list);
          });
        },
        getData: () => itemsRef.current,
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
  const safeThresholdField = thresholdField || 'threshold';
  const safeArrowField = arrowField || 'arrow';
  const rootStyle: React.CSSProperties = {
    ...(width !== undefined && width !== null && width !== '' ? { width } : {}),
    ...(height !== undefined && height !== null && height !== '' ? { height } : {}),
    ...style,
  };

  return (
    <div
      className={`bizpack-effluent ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      {items.map((item, index) => {
        const name = String(resolveFieldValue(item, safeNameField) || '-');
        const value = resolveFieldValue(item, safeValueField);
        const threshold = resolveFieldValue(item, safeThresholdField);
        const arrow = resolveArrow(
          resolveFieldValue(item, safeArrowField),
          value,
          threshold,
        );
        const tipParts = [
          name,
          value !== '' ? `值 ${value}` : '',
          threshold !== '' ? `阈值 ${threshold}` : '',
        ].filter(Boolean);

        return (
          <button
            type="button"
            key={item.id != null ? String(item.id) : `effluent-slot-${index}`}
            className="bizpack-effluent-item"
            title={tipParts.join(' / ')}
            onClick={() => {
              if (onItemClick) {
                onItemClick(item, index);
              }
            }}
          >
            <span className="bizpack-effluent-box">
              <span className="bizpack-effluent-value">
                {value !== '' ? value : '-'}
                {unit ? <span className="bizpack-effluent-unit">{unit}</span> : null}
              </span>
              <span className={`bizpack-effluent-arrow bizpack-effluent-arrow-${arrow}`}>
                <ArrowIcon />
              </span>
            </span>
            <span className="bizpack-effluent-label" title={name}>
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

Effluent.displayName = 'Effluent';
export default React.memo(Effluent);
