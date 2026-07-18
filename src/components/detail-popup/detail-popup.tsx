// 详情弹框
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
import './index.scss';

export interface DetailPopupItem {
  id?: string | number;
  /** 指标名称 */
  label?: string;
  /** 指标数值 */
  value?: string | number;
  /** 时间 */
  time?: string;
  [key: string]: unknown;
}

export interface DetailPopupProps {
  /** 弹框标题 */
  title?: string;
  /** 是否显示，默认 true */
  visible?: boolean;
  data?: DetailPopupItem[];
  /** 指标名称字段名，默认 label */
  labelField?: string;
  /** 指标数值字段名，默认 value */
  valueField?: string;
  /** 时间字段名，默认 time */
  timeField?: string;
  width?: number | string;
  /** 最小高度，内容超出时自动撑开，默认 172 */
  minHeight?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 点击关闭按钮 */
  onClose?: () => void;
  /** 点击某一行 */
  onItemClick?: (item: DetailPopupItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DetailPopupItem[]) => void;
  };
}

const defaultData: DetailPopupItem[] = [
  { id: 1, label: '伽马当量：', value: 12, time: '15:03:04' },
  { id: 2, label: '伽马吸收：', value: 12, time: '15:03:04' },
  { id: 3, label: '中子当量：', value: 12, time: '15:03:04' },
  { id: 4, label: '中子吸收：', value: 12, time: '15:03:04' },
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

const resolveListData = (value?: DetailPopupItem[] | null): DetailPopupItem[] => {
  if (Array.isArray(value)) {
    return normalizeListData(value);
  }

  return defaultData;
};

const resolveFieldValue = (item: DetailPopupItem, field: string) => {
  const value = item[field];

  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value);
};

const DetailPopup: React.FC<DetailPopupProps> = function DetailPopup(props) {
  const {
    title = '辐射物',
    visible = true,
    data = defaultData,
    labelField = 'label',
    valueField = 'value',
    timeField = 'time',
    width = 433,
    minHeight = 172,
    style = {},
    className = '',
    onClose,
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<DetailPopupItem[]>(() => resolveListData(data));
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
        changeData: (nextData: DetailPopupItem[]) => {
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

  if (!visible) {
    return null;
  }

  const safeLabelField = labelField || 'label';
  const safeValueField = valueField || 'value';
  const safeTimeField = timeField || 'time';

  return (
    <div
      className={`bizpack-detail-popup ${className}`}
      style={{ width, minHeight, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-detail-popup-panel">
        <div className="bizpack-detail-popup-header">
          <span className="bizpack-detail-popup-title" title={title}>
            {title}
          </span>
          <button
            type="button"
            className="bizpack-detail-popup-close"
            aria-label="关闭"
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
          />
        </div>

        <div className="bizpack-detail-popup-body">
          {items.map((item, index) => {
            const label = resolveFieldValue(item, safeLabelField);
            const value = resolveFieldValue(item, safeValueField);
            const time = resolveFieldValue(item, safeTimeField);

            return (
              <button
                key={item.id != null ? String(item.id) : index}
                type="button"
                className="bizpack-detail-popup-row"
                onClick={() => {
                  if (onItemClick) {
                    onItemClick(item, index);
                  }
                }}
              >
                <span className="bizpack-detail-popup-main">
                  <span className="bizpack-detail-popup-label">{label}</span>
                  <span className="bizpack-detail-popup-value">{value}</span>
                </span>
                <span className="bizpack-detail-popup-time">{time}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

DetailPopup.displayName = 'DetailPopup';
export default React.memo(DetailPopup);
