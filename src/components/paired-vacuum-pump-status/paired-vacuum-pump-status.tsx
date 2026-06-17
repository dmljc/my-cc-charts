import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export type PairedVacuumPumpMode = 'auto' | 'manual' | string;

export interface PairedVacuumPumpStatusItem {
  id?: string | number;
  name: string;
  mode?: PairedVacuumPumpMode;
  modeText?: string;
  runningHours?: number | string;
  selected?: boolean;
}

/** 一组成对真空泵的完整数据：包含切换模式、A切换B时间、以及两个泵 */
export interface PairedVacuumPumpGroup {
  switchMode?: PairedVacuumPumpMode;
  switchModeText?: string;
  abSwitchTime?: number | string;
  abSwitchTimeText?: string;
  pumps?: PairedVacuumPumpStatusItem[];
}

/** data 为对象时的包装格式 */
export interface PairedVacuumPumpStatusData {
  groups?: PairedVacuumPumpGroup[];
}

/** data 接受的联合类型 */
type PairedVacuumPumpDataInput =
  | PairedVacuumPumpGroup[]
  | PairedVacuumPumpStatusItem[]
  | PairedVacuumPumpStatusData;

export interface PairedVacuumPumpStatusProps {
  title?: string;
  data?: PairedVacuumPumpDataInput;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onSelect?: (item: PairedVacuumPumpStatusItem, index: number, groupIndex?: number) => void;
  onLocate?: (item: PairedVacuumPumpStatusItem, index: number, groupIndex?: number) => void;
  [key: string]: unknown;
}

interface NormalizedGroup {
  switchModeText: string;
  abSwitchTimeText: string;
  pumps: PairedVacuumPumpStatusItem[];
}

interface BizRef {
  chart: {
    changeData: (nextData: PairedVacuumPumpDataInput) => void;
  };
}

const defaultPumps: PairedVacuumPumpStatusItem[] = [
  { id: 'A', name: '真空泵A', mode: 'auto', modeText: '自动', runningHours: 12, selected: true },
  { id: 'B', name: '真空泵B', mode: 'auto', modeText: '自动', runningHours: 12 },
];

const defaultGroup: NormalizedGroup = {
  switchModeText: '自动',
  abSwitchTimeText: '300ms',
  pumps: defaultPumps,
};

const defaultGroups: NormalizedGroup[] = [defaultGroup];

const modeTextMap: Record<string, string> = {
  auto: '自动',
  manual: '手动',
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

const resolveModeText = (mode?: PairedVacuumPumpMode, modeText?: string) =>
  modeText || (mode ? modeTextMap[mode] : undefined) || '自动';

const resolveAbSwitchTimeText = (value?: number | string, text?: string) => {
  if (text) {
    return text;
  }
  if (typeof value === 'number') {
    return `${value}ms`;
  }
  if (value) {
    return String(value);
  }
  return '--';
};

const formatRunningHours = (hours?: number | string) => {
  if (hours === undefined || hours === null || hours === '') {
    return '运行时间--H';
  }
  return `运行时间${hours}H`;
};

/** 根据一组泵的 id 动态生成切换时间标签，如 "A切换B时间"、"C切换D时间" */
const getSwitchTimeLabel = (pumps: PairedVacuumPumpStatusItem[]): string => {
  const a = pumps[0]?.id ?? '';
  const b = pumps[1]?.id ?? '';
  if (a && b) return `${a}切换${b}时间`;
  if (a) return `${a}切换时间`;
  return '切换时间';
};

const normalizePumpItem = (
  item: Partial<PairedVacuumPumpStatusItem>,
  index: number,
  fallback?: PairedVacuumPumpStatusItem,
): PairedVacuumPumpStatusItem => ({
  id: item.id ?? fallback?.id ?? index,
  name: item.name || fallback?.name || `真空泵${index === 0 ? 'A' : 'B'}`,
  mode: item.mode ?? fallback?.mode ?? 'auto',
  modeText: resolveModeText(item.mode ?? fallback?.mode, item.modeText ?? fallback?.modeText),
  runningHours: item.runningHours ?? fallback?.runningHours ?? 0,
  selected: item.selected ?? fallback?.selected ?? index === 0,
});

/** 将一组 pumps 标准化 */
const normalizePumps = (pumps?: PairedVacuumPumpStatusItem[]): PairedVacuumPumpStatusItem[] =>
  pumps?.length
    ? pumps.map((item, index) => normalizePumpItem(item, index, defaultPumps[index]))
    : [...defaultPumps];

/** 将单个 group 标准化为 NormalizedGroup */
const normalizeGroup = (group: PairedVacuumPumpGroup): NormalizedGroup => ({
  switchModeText: resolveModeText(group.switchMode, group.switchModeText),
  abSwitchTimeText: resolveAbSwitchTimeText(group.abSwitchTime, group.abSwitchTimeText),
  pumps: normalizePumps(group.pumps),
});

/** 判断数组元素是否为 PairedVacuumPumpGroup（有 pumps 字段） */
const isGroupArray = (
  arr: PairedVacuumPumpGroup[] | PairedVacuumPumpStatusItem[],
): arr is PairedVacuumPumpGroup[] =>
  arr.length > 0 && 'pumps' in arr[0];

/**
 * 将所有输入格式统一标准化为 NormalizedGroup[]
 * - undefined/null → [defaultGroup]
 * - PairedVacuumPumpGroup[] → 直接标准化每组
 * - PairedVacuumPumpStatusItem[]（旧格式）→ 包装为单 group，header 用默认值
 * - { groups: [...] } → 标准化每组
 * - 旧扁平对象 { switchMode, abSwitchTime, pumps } → 向后兼容，包装为单 group
 */
const normalizeStatusData = (data?: PairedVacuumPumpDataInput): NormalizedGroup[] => {
  if (!data) {
    return defaultGroups;
  }

  if (Array.isArray(data)) {
    if (isGroupArray(data)) {
      // PairedVacuumPumpGroup[] — 推荐格式
      return data.map(normalizeGroup);
    }
    // PairedVacuumPumpStatusItem[] — 旧格式，包装为单 group
    const hasSelected = data.some((item) => item.selected);
    return [
      {
        switchModeText: defaultGroup.switchModeText,
        abSwitchTimeText: defaultGroup.abSwitchTimeText,
        pumps: data.map((item, index) =>
          normalizePumpItem(
            item,
            index,
            hasSelected ? undefined : { ...defaultPumps[index], selected: index === 0 },
          ),
        ),
      },
    ];
  }

  // { groups: [...] }
  if (data.groups && data.groups.length > 0) {
    return data.groups.map(normalizeGroup);
  }

  // 旧扁平对象 { switchMode, abSwitchTime, pumps } — 向后兼容
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ('pumps' in data && !('groups' in data)) {
    const legacy = data as any;
    return [
      {
        switchModeText: resolveModeText(legacy.switchMode, legacy.switchModeText),
        abSwitchTimeText: resolveAbSwitchTimeText(legacy.abSwitchTime, legacy.abSwitchTimeText),
        pumps: normalizePumps(legacy.pumps),
      },
    ];
  }

  return defaultGroups;
};

const PairedVacuumPumpStatus: React.FC<PairedVacuumPumpStatusProps> = function PairedVacuumPumpStatus(
  props,
) {
  const {
    data,
    width = 400,
    height = 116,
    style = {},
    className = '',
    onSelect,
    onLocate,
    ...otherProps
  } = props;
  const [groups, setGroups] = useState<NormalizedGroup[]>(() => normalizeStatusData(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setGroups(normalizeStatusData(data));
  }, [data]);

  const handleSelect = (pumpIndex: number, groupIndex: number) => {
    setGroups((prev) =>
      prev.map((g, gi) => {
        if (gi !== groupIndex) return g;
        return {
          ...g,
          pumps: (g.pumps || []).map((p, pi) => ({
            ...p,
            selected: pi === pumpIndex,
          })),
        };
      }),
    );

    if (onSelect) {
      const target = groups[groupIndex]?.pumps?.[pumpIndex];
      if (target) {
        onSelect(target, pumpIndex, groupIndex);
      }
    }
  };

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: PairedVacuumPumpDataInput) => {
          setGroups(normalizeStatusData(nextData));
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  return (
    <div
      className={`bizpack-paired-vacuum-pump-status ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-paired-vacuum-pump-status-groups">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="bizpack-paired-vacuum-pump-status-group">
            <div className="bizpack-paired-vacuum-pump-status-group-header">
              <div className="bizpack-paired-vacuum-pump-status-header-item">
                <span className="bizpack-paired-vacuum-pump-status-header-label">切换模式：</span>
                <span className="bizpack-paired-vacuum-pump-status-header-value">
                  {group.switchModeText}
                </span>
              </div>
              <div className="bizpack-paired-vacuum-pump-status-header-item">
                <span className="bizpack-paired-vacuum-pump-status-header-label">
                  {getSwitchTimeLabel(group.pumps)}：
                </span>
                <span className="bizpack-paired-vacuum-pump-status-header-value">
                  {group.abSwitchTimeText}
                </span>
              </div>
            </div>

            <div className="bizpack-paired-vacuum-pump-status-cards">
              {group.pumps.map((item, pumpIndex) => {
                const isSelected = !!item.selected;
                const modeText = resolveModeText(item.mode, item.modeText);
                const isManual = item.mode === 'manual' || modeText === '手动';

                return (
                  <div
                    key={item.id ?? pumpIndex}
                    className={`bizpack-paired-vacuum-pump-status-card ${
                      isSelected ? 'bizpack-paired-vacuum-pump-status-card-active' : ''
                    }`}
                    onClick={() => handleSelect(pumpIndex, groupIndex)}
                  >
                    <div className="bizpack-paired-vacuum-pump-status-card-head">
                      <div className="bizpack-paired-vacuum-pump-status-card-title">
                        <span className="bizpack-paired-vacuum-pump-status-card-name">{item.name}</span>
                        <span
                          className={`bizpack-paired-vacuum-pump-status-card-mode ${
                            isManual ? 'bizpack-paired-vacuum-pump-status-card-mode-manual' : ''
                          }`}
                        >
                          {modeText}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="bizpack-paired-vacuum-pump-status-card-locate"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onLocate) {
                            onLocate(item, pumpIndex, groupIndex);
                          }
                        }}
                      >
                        <span className="bizpack-paired-vacuum-pump-status-card-locate-icon" />
                      </button>
                    </div>

                    <span className="bizpack-paired-vacuum-pump-status-card-divider" />

                    <div className="bizpack-paired-vacuum-pump-status-card-body">
                      <span className="bizpack-paired-vacuum-pump-status-card-clock" />
                      <span className="bizpack-paired-vacuum-pump-status-card-runtime">
                        {formatRunningHours(item.runningHours)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

PairedVacuumPumpStatus.displayName = 'PairedVacuumPumpStatus';
export default PairedVacuumPumpStatus;
