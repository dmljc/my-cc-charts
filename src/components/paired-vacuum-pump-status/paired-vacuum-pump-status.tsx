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

export interface PairedVacuumPumpStatusData {
  switchMode?: PairedVacuumPumpMode;
  switchModeText?: string;
  abSwitchTime?: number | string;
  abSwitchTimeText?: string;
  pumps?: PairedVacuumPumpStatusItem[];
}

export interface PairedVacuumPumpStatusProps {
  title?: string;
  data?: PairedVacuumPumpStatusData | PairedVacuumPumpStatusItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onSelect?: (item: PairedVacuumPumpStatusItem, index: number) => void;
  onLocate?: (item: PairedVacuumPumpStatusItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: PairedVacuumPumpStatusData | PairedVacuumPumpStatusItem[]) => void;
  };
}

const defaultPumps: PairedVacuumPumpStatusItem[] = [
  { id: 'A', name: '真空泵A', mode: 'auto', modeText: '自动', runningHours: 12, selected: true },
  { id: 'B', name: '真空泵B', mode: 'auto', modeText: '自动', runningHours: 12 },
];

const defaultData: PairedVacuumPumpStatusData = {
  switchMode: 'auto',
  switchModeText: '自动',
  abSwitchTime: 'auto',
  abSwitchTimeText: '自动',
  pumps: defaultPumps,
};

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
  if (value === 'auto' || value === 'automatic') {
    return '自动';
  }
  if (typeof value === 'number') {
    return `${value}H`;
  }
  if (value) {
    return String(value);
  }
  return '自动';
};

const formatRunningHours = (hours?: number | string) => {
  if (hours === undefined || hours === null || hours === '') {
    return '运行时间--H';
  }
  return `运行时间${hours}H`;
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

const normalizeStatusData = (
  data?: PairedVacuumPumpStatusData | PairedVacuumPumpStatusItem[],
): PairedVacuumPumpStatusData => {
  if (!data) {
    return defaultData;
  }

  if (Array.isArray(data)) {
    const hasSelected = data.some((item) => item.selected);
    return {
      ...defaultData,
      pumps: data.map((item, index) =>
        normalizePumpItem(
          item,
          index,
          hasSelected ? undefined : { ...defaultPumps[index], selected: index === 0 },
        ),
      ),
    };
  }

  const pumps = data.pumps?.length
    ? data.pumps.map((item, index) => normalizePumpItem(item, index, defaultPumps[index]))
    : defaultPumps;

  return {
    switchMode: data.switchMode ?? defaultData.switchMode,
    switchModeText: resolveModeText(
      data.switchMode ?? defaultData.switchMode,
      data.switchModeText ?? defaultData.switchModeText,
    ),
    abSwitchTime: data.abSwitchTime ?? defaultData.abSwitchTime,
    abSwitchTimeText: resolveAbSwitchTimeText(
      data.abSwitchTime ?? defaultData.abSwitchTime,
      data.abSwitchTimeText ?? defaultData.abSwitchTimeText,
    ),
    pumps,
  };
};

const PairedVacuumPumpStatus: React.FC<PairedVacuumPumpStatusProps> = function PairedVacuumPumpStatus(
  props,
) {
  const {
    data = defaultData,
    width = 400,
    height = 116,
    style = {},
    className = '',
    onSelect,
    onLocate,
    ...otherProps
  } = props;
  const [statusData, setStatusData] = useState<PairedVacuumPumpStatusData>(() =>
    normalizeStatusData(data),
  );
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setStatusData(normalizeStatusData(data));
  }, [data]);

  const handleSelect = (item: PairedVacuumPumpStatusItem, index: number) => {
    const nextPumps = (statusData.pumps || []).map((current, currentIndex) => ({
      ...current,
      selected: currentIndex === index,
    }));

    setStatusData({
      ...statusData,
      pumps: nextPumps,
    });

    if (onSelect) {
      onSelect(nextPumps[index], index);
    }
  };

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: PairedVacuumPumpStatusData | PairedVacuumPumpStatusItem[]) => {
          setStatusData(normalizeStatusData(nextData));
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  const pumps = statusData.pumps || defaultPumps;
  const switchModeText = resolveModeText(statusData.switchMode, statusData.switchModeText);
  const abSwitchTimeText = resolveAbSwitchTimeText(
    statusData.abSwitchTime,
    statusData.abSwitchTimeText,
  );

  return (
    <div
      className={`bizpack-paired-vacuum-pump-status ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-paired-vacuum-pump-status-header">
        <div className="bizpack-paired-vacuum-pump-status-header-item">
          <span className="bizpack-paired-vacuum-pump-status-header-label">切换模式：</span>
          <span className="bizpack-paired-vacuum-pump-status-header-value">{switchModeText}</span>
        </div>
        <div className="bizpack-paired-vacuum-pump-status-header-item">
          <span className="bizpack-paired-vacuum-pump-status-header-label">A切换B时间：</span>
          <span className="bizpack-paired-vacuum-pump-status-header-value">{abSwitchTimeText}</span>
        </div>
      </div>

      <div className="bizpack-paired-vacuum-pump-status-cards">
        {pumps.map((item, index) => {
          const isSelected = !!item.selected;
          const modeText = resolveModeText(item.mode, item.modeText);
          const isManual = item.mode === 'manual' || modeText === '手动';

          return (
            <div
              key={item.id ?? index}
              className={`bizpack-paired-vacuum-pump-status-card ${
                isSelected ? 'bizpack-paired-vacuum-pump-status-card-active' : ''
              }`}
              onClick={() => handleSelect(item, index)}
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
                      onLocate(item, index);
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
  );
};

PairedVacuumPumpStatus.displayName = 'PairedVacuumPumpStatus';
export default PairedVacuumPumpStatus;
