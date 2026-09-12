// 流出物
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
import { DEFAULT_EFFLUENT_LIST_TEST_DATA } from './test-data';
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
  /** 箭头方向，接口字段 arrow，取值 up/down/flat */
  arrow?: EffluentArrow;
  [key: string]: unknown;
}

/** 厂房 -> 指标列表，与接口 effluentList 一致 */
export type EffluentListMap = Record<string, EffluentItem[]>;

export interface EffluentListPayload {
  effluentList?: EffluentListMap;
  [key: string]: unknown;
}

export type EffluentDataInput = EffluentListPayload | EffluentListMap | EffluentItem[];

export interface EffluentGroupView {
  key: string;
  items: EffluentItem[];
}

export interface EffluentProps {
  /** 单卡标题；仅当 data 为数组时生效，map 模式用 key 作标题 */
  title?: string;
  /**
   * 支持三种形态：
   * 1) { effluentList: { X12: [...], X03: [...] } }
   * 2) { X12: [...], X03: [...] }
   * 3) EffluentItem[]（单卡，兼容旧绑定）
   */
  data?: EffluentDataInput;
  /** 名称字段名，默认 name */
  nameField?: string;
  /** 数值字段名，默认 value */
  valueField?: string;
  /** 阈值字段名，默认 threshold */
  thresholdField?: string;
  /** 箭头字段名，默认 arrow，取值 up/down/flat */
  arrowField?: string;
  /** 数值单位后缀 */
  unit?: string;
  /** 卡片间距 */
  gap?: number | string;
  /** 可选；不传则由内容自适应撑开 */
  width?: number | string;
  /** 可选；不传则由内容自适应撑开 */
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: EffluentItem, index: number, groupKey: string) => void;
  onCardClick?: (groupKey: string, items: EffluentItem[]) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: EffluentDataInput) => void;
    getData?: () => EffluentListMap;
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

const defaultData = DEFAULT_EFFLUENT_LIST_TEST_DATA as EffluentDataInput;

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

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** 判断对象是否为厂房 map（值为数组），而非 { effluentList } 包装 */
const isEffluentListMap = (value: unknown): value is EffluentListMap => {
  if (!isPlainObject(value) || Object.prototype.hasOwnProperty.call(value, 'effluentList')) {
    return false;
  }
  const keys = Object.keys(value);
  if (!keys.length) {
    return false;
  }
  return keys.every((key) => Array.isArray(value[key]));
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

const normalizeMap = (map: EffluentListMap): EffluentListMap => {
  const next: EffluentListMap = {};
  Object.keys(map).forEach((key) => {
    const list = map[key];
    next[key] = Array.isArray(list) ? dedupeById(normalizeListData(list)) : [];
  });
  return next;
};

/**
 * 统一解析入参：
 * - { effluentList: { X12: [] } }
 * - { X12: [] }
 * - EffluentItem[]（单卡）
 */
const resolveGroups = (
  value?: EffluentDataInput | null,
  singleTitle = '流出物',
): EffluentGroupView[] => {
  if (Array.isArray(value)) {
    return [{ key: singleTitle, items: dedupeById(normalizeListData(value)) }];
  }

  if (isPlainObject(value)) {
    if (isPlainObject(value.effluentList)) {
      const map = value.effluentList as EffluentListMap;
      return Object.entries(normalizeMap(map)).map(([key, items]) => ({ key, items }));
    }
    if (isEffluentListMap(value)) {
      return Object.entries(normalizeMap(value)).map(([key, items]) => ({ key, items }));
    }
  }

  return Object.entries(normalizeMap(DEFAULT_EFFLUENT_LIST_TEST_DATA.effluentList)).map(
    ([key, items]) => ({ key, items }),
  );
};

const groupsToMap = (groups: EffluentGroupView[]): EffluentListMap => {
  const map: EffluentListMap = {};
  groups.forEach((group) => {
    map[group.key] = group.items;
  });
  return map;
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

const patchGroups = (
  prev: EffluentGroupView[],
  incoming: EffluentGroupView[],
  structureReady: boolean,
): EffluentGroupView[] => {
  if (!incoming.length) {
    return [];
  }
  if (!structureReady || !prev.length) {
    return incoming;
  }

  const prevMap = groupsToMap(prev);
  const nextKeys = incoming.map((g) => g.key);
  // 保留旧顺序：已有 key 在前，新增 key 追加
  const orderedKeys = [
    ...prev.map((g) => g.key).filter((key) => nextKeys.indexOf(key) >= 0),
    ...nextKeys.filter((key) => !Object.prototype.hasOwnProperty.call(prevMap, key)),
  ];

  return orderedKeys.map((key) => {
    const incomingGroup = incoming.find((g) => g.key === key);
    const prevItems = prevMap[key] || [];
    const incomingItems = incomingGroup ? incomingGroup.items : [];
    if (!prevItems.length) {
      return { key, items: incomingItems };
    }
    if (incomingItems.length < prevItems.length) {
      return { key, items: incomingItems };
    }
    return { key, items: patchEffluentItems(prevItems, incomingItems) };
  });
};

const Effluent: React.FC<EffluentProps> = function Effluent(props) {
  const {
    title = '流出物',
    data = defaultData,
    nameField = 'name',
    valueField = 'value',
    thresholdField = 'threshold',
    arrowField = 'arrow',
    unit = '',
    gap = 12,
    width = 376,
    height = 144,
    style = {},
    className = '',
    onItemClick,
    onCardClick,
    ...otherProps
  } = props;
  const [groups, setGroups] = useState<EffluentGroupView[]>(() => resolveGroups(data, title));
  /** 首次非默认数据建槽后锁定结构；之后只改 value / arrow */
  const structureReadyRef = React.useRef(data !== defaultData);
  const groupsRef = React.useRef(groups);
  groupsRef.current = groups;
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    if (props.dataType && props.dataType !== 'data') {
      return;
    }
    if (data === defaultData) {
      setGroups(resolveGroups(defaultData, title));
      return;
    }

    const nextGroups = resolveGroups(data, title);
    if (!nextGroups.length) {
      structureReadyRef.current = false;
      setGroups([]);
      return;
    }

    setGroups((prev) => patchGroups(prev, nextGroups, structureReadyRef.current));
    structureReadyRef.current = true;
  }, [data, props.dataType, title]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: EffluentDataInput) => {
          const nextGroups = resolveGroups(nextData, title);
          if (!nextGroups.length) {
            structureReadyRef.current = false;
            setGroups([]);
            return;
          }
          setGroups((prev) => {
            const patched = patchGroups(prev, nextGroups, structureReadyRef.current);
            structureReadyRef.current = true;
            return patched;
          });
        },
        getData: () => groupsToMap(groupsRef.current),
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
    width,
    height,
    gap,
    ...style,
  };

  const hasMultipleCards = groups.length > 1;

  return (
    <div
      className={`bizpack-effluent ${hasMultipleCards ? 'bizpack-effluent-multi' : ''} ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      {groups.map((group) => (
        <div
          key={group.key}
          className="bizpack-effluent-card"
          role={onCardClick ? 'button' : undefined}
          tabIndex={onCardClick ? 0 : undefined}
          onClick={() => {
            if (onCardClick) {
              onCardClick(group.key, group.items);
            }
          }}
          onKeyDown={(event) => {
            if (!onCardClick) {
              return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onCardClick(group.key, group.items);
            }
          }}
        >
          <div className="bizpack-effluent-header">
            <span className="bizpack-effluent-header-icon" />
            <span className="bizpack-effluent-header-title">{group.key}</span>
          </div>
          <div className="bizpack-effluent-divider" />
          <div className="bizpack-effluent-body">
            {group.items.map((item, index) => {
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
                  key={item.id != null ? `${group.key}-${item.id}` : `${group.key}-slot-${index}`}
                  className="bizpack-effluent-item"
                  title={tipParts.join(' / ')}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (onItemClick) {
                      onItemClick(item, index, group.key);
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
        </div>
      ))}
    </div>
  );
};

Effluent.displayName = 'Effluent';
export default React.memo(Effluent);
