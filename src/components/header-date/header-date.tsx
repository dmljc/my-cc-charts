// 头部日期
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

const WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/** 读取本地时间，格式化为中文年月日 */
export const formatLocalDateText = (date: Date = new Date()) =>
  `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

/** 读取本地时间，格式化为中文星期 */
export const formatLocalWeekText = (date: Date = new Date()) => WEEKDAY_LABELS[date.getDay()];

/** 读取本地时间，返回年月日与星期文案 */
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

const HeaderDate: React.FC<HeaderDateProps> = function HeaderDate(props) {
  const {
    width = 200,
    height = 32,
    style = {},
    className = '',
    ...otherProps
  } = props;

  const [now, setNow] = useState(() => new Date());
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  const { dateText, weekText } = useMemo(() => getLocalDateDisplay(now), [now]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => {
      window.clearInterval(timer);
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
        <span className="bizpack-header-date-text">{dateText}</span>
        <span className="bizpack-header-date-week">{weekText}</span>
      </div>
    </div>
  );
};

HeaderDate.displayName = 'HeaderDate';
export default HeaderDate;
