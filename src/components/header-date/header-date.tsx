// 头部日期
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

const WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const pad2 = (value: number) => String(value).padStart(2, '0');

/** 读取本地时间，格式化为中文年月日时分秒 */
export const formatLocalDateText = (date: Date = new Date()) =>
  `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

/** 读取本地时间，格式化为中文星期 */
export const formatLocalWeekText = (date: Date = new Date()) => WEEKDAY_LABELS[date.getDay()];

/** 读取本地时间，返回年月日时分秒与星期文案 */
export const getLocalDateDisplay = (date: Date = new Date()) => ({
  dateText: formatLocalDateText(date),
  weekText: formatLocalWeekText(date),
});

export interface HeaderDateProps {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: () => void;
  };
}

interface DateDisplay {
  dateText: string;
  weekText: string;
}

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

/** 距离下一整秒的毫秒数，用于对齐秒级刷新、减少漂移 */
const getDelayToNextSecond = (now = Date.now()) => 1000 - (now % 1000);

const HeaderDate: React.FC<HeaderDateProps> = function HeaderDate(props) {
  const {
    width = 280,
    height = 32,
    style = {},
    className = '',
    ...otherProps
  } = props;

  const [display, setDisplay] = useState<DateDisplay>(() => getLocalDateDisplay());
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    let timerId: number | undefined;

    const syncDisplay = () => {
      const next = getLocalDateDisplay();
      setDisplay((prev) =>
        prev.dateText === next.dateText && prev.weekText === next.weekText ? prev : next,
      );
    };

    const scheduleNextTick = () => {
      timerId = window.setTimeout(() => {
        syncDisplay();
        scheduleNextTick();
      }, getDelayToNextSecond());
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerId !== undefined) {
          window.clearTimeout(timerId);
          timerId = undefined;
        }
        return;
      }

      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        timerId = undefined;
      }
      syncDisplay();
      scheduleNextTick();
    };

    syncDisplay();
    if (!document.hidden) {
      scheduleNextTick();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: () => {},
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  return (
    <div
      className={`bizpack-header-date ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-header-date-content">
        <span className="bizpack-header-date-text">{display.dateText}</span>
        <span className="bizpack-header-date-week">{display.weekText}</span>
      </div>
    </div>
  );
};

HeaderDate.displayName = 'HeaderDate';
export default React.memo(HeaderDate);
