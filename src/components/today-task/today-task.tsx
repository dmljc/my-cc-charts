import * as React from 'react';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export type TodayTaskLevel = 'urgent' | 'normal' | 'regular' | string;

export interface TodayTaskItem {
  id?: string | number;
  name: string;
  level?: TodayTaskLevel;
  levelText?: string;
}

export interface TodayTaskProps {
  title?: string;
  data?: TodayTaskItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: TodayTaskItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: TodayTaskItem[]) => void;
  };
}

const defaultData: TodayTaskItem[] = [
  { id: 1, name: '取样泵1流量计保养', level: 'urgent', levelText: '紧急' },
  { id: 2, name: '取样泵1流量计保养', level: 'normal', levelText: '一般' },
  { id: 3, name: '取样泵1流量计保养', level: 'regular', levelText: '常规' },
];

const levelTextMap: Record<string, string> = {
  urgent: '紧急',
  normal: '一般',
  regular: '常规',
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

const TodayTask: React.FC<TodayTaskProps> = function TodayTask(props) {
  const {
    data = defaultData,
    width = 400,
    height = 171,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<TodayTaskItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: TodayTaskItem[]) => {
          if (Array.isArray(nextData)) {
            setItems(nextData);
          }
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
      className={`bizpack-today-task ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-today-task-list">
        {items.map((item, index) => {
          const level = item.level || 'regular';
          const levelText = item.levelText || levelTextMap[level] || level;

          return (
            <button
              key={item.id || index}
              type="button"
              className={`bizpack-today-task-row bizpack-today-task-row-${level}`}
              onClick={() => {
                if (onItemClick) {
                  onItemClick(item, index);
                }
              }}
            >
              <span className="bizpack-today-task-icon-wrap">
                <span className="bizpack-today-task-icon" />
              </span>
              <span className="bizpack-today-task-name" title={item.name}>{item.name}</span>
              <span className="bizpack-today-task-level">{levelText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

TodayTask.displayName = 'TodayTask';
export default TodayTask;
