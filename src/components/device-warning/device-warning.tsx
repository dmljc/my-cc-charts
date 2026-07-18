// 设备警告
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
import { DEFAULT_DEVICE_WARNING_TEST_DATA } from './test-data';
import './index.scss';

export type DeviceWarningLevelColor = 'urgent' | 'normal' | 'regular' | string;

export interface DeviceWarningItem {
  id?: string | number;
  /** 规则名称 */
  ruleName?: string;
  /** 等级名称，如：紧急 / 一般 / 常规 */
  levelName?: string;
  /** 等级颜色，支持 urgent/normal/regular 或十六进制色值如 #FF0000 */
  levelColor?: DeviceWarningLevelColor;
  /** 告警时间 */
  alarmTime?: string;
  [key: string]: unknown;
}

export interface DeviceWarningProps {
  data?: DeviceWarningItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 规则名称字段名，默认 ruleName */
  ruleNameField?: string;
  /** 等级名称字段名，默认 levelName */
  levelNameField?: string;
  /** 等级颜色字段名，默认 levelColor */
  levelColorField?: string;
  /** 告警时间字段名，默认 alarmTime */
  alarmTimeField?: string;
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

const LEVEL_COLOR_MAP: Record<string, string> = {
  urgent: '#ff2f2f',
  normal: '#ffbe2f',
  regular: '#3399ff',
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
    return normalizeListData(value);
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

const resolveLevelColor = (raw?: string) => {
  if (!raw) {
    return LEVEL_COLOR_MAP.regular;
  }

  return LEVEL_COLOR_MAP[raw] || raw;
};

const DeviceWarning: React.FC<DeviceWarningProps> = function DeviceWarning(props) {
  const {
    width = 400,
    height = 200,
    style = {},
    className = '',
    ruleNameField = 'ruleName',
    levelNameField = 'levelName',
    levelColorField = 'levelColor',
    alarmTimeField = 'alarmTime',
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
            setItems(normalizeListData(nextData));
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

  const hasWarning = items.length > 0;
  const safeRuleNameField = ruleNameField || 'ruleName';
  const safeLevelNameField = levelNameField || 'levelName';
  const safeLevelColorField = levelColorField || 'levelColor';
  const safeAlarmTimeField = alarmTimeField || 'alarmTime';

  return (
    <div
      className={`bizpack-device-warning ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      {hasWarning ? (
        <div className="bizpack-device-warning-list">
          {items.map((item, index) => {
            const ruleName = resolveFieldValue(item, safeRuleNameField);
            const levelName = resolveFieldValue(item, safeLevelNameField);
            const levelColor = resolveLevelColor(resolveFieldValue(item, safeLevelColorField));
            const alarmTime = resolveFieldValue(item, safeAlarmTimeField);

            return (
              <button
                key={item.id != null ? String(item.id) : `${ruleName}-${alarmTime}-${index}`}
                type="button"
                className="bizpack-device-warning-row"
                onClick={() => {
                  if (onItemClick) {
                    onItemClick(item, index);
                  }
                }}
              >
                <span className="bizpack-device-warning-icon-wrap">
                  <span className="bizpack-device-warning-icon" />
                </span>
                <span className="bizpack-device-warning-name" title={ruleName}>
                  {ruleName}
                </span>
                <span className="bizpack-device-warning-time" title={alarmTime}>
                  {alarmTime}
                </span>
                <span className="bizpack-device-warning-level" style={{ color: levelColor }}>
                  {levelName}
                </span>
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
export default React.memo(DeviceWarning);
