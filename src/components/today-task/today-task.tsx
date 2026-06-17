import * as React from 'react';
import '../jsx-shim';
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
  taskName?: string;
  taskArea?: string;
  inspectionDevice?: string;
  taskTime?: string;
}

type TodayTaskDetail = Pick<TodayTaskItem, 'name' | 'taskArea' | 'inspectionDevice' | 'taskTime'>;

export interface TodayTaskProps {
  title?: string;
  data?: TodayTaskItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  defaultTaskDetailVisible?: boolean;
  taskDetail?: TodayTaskItem;
  onItemClick?: (item: TodayTaskItem, index: number) => void;
  onTaskDetailClose?: () => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: TodayTaskItem[]) => void;
  };
}

const defaultData: TodayTaskItem[] = [
  { id: 1, name: '取样泵1流量计保养', level: 'urgent', levelText: '紧急' },
  { id: 2, name: '取样泵2流量计保养', level: 'normal', levelText: '一般' },
  { id: 3, name: '取样泵3流量计保养', level: 'regular', levelText: '常规' },
];

const defaultTaskDetail: TodayTaskDetail = {
  name: '暂无',
  taskArea: '暂无',
  inspectionDevice: '暂无',
  taskTime: '暂无',
};

const resolveDetailField = (value?: string) => value || '暂无';

const isRealDetailValue = (value?: string) => Boolean(value && value !== '暂无');

const hasTaskDetailData = (item: Partial<TodayTaskDetail> & Partial<TodayTaskItem>) =>
  isRealDetailValue(item.taskName) ||
  isRealDetailValue(item.taskArea) ||
  isRealDetailValue(item.inspectionDevice) ||
  isRealDetailValue(item.taskTime);

const normalizeTaskDetail = (
  item: Partial<TodayTaskDetail> & Partial<TodayTaskItem>,
): TodayTaskDetail => {
  const hasDetailData = hasTaskDetailData(item);

  return {
    name: item.taskName ?? (hasDetailData ? item.name : undefined) ?? '暂无',
    taskArea: item.taskArea ?? '暂无',
    inspectionDevice: item.inspectionDevice ?? '暂无',
    taskTime: item.taskTime ?? '暂无',
  };
};

const formatTaskDetail = (detail: TodayTaskDetail) => ({
  name: resolveDetailField(detail.name),
  taskArea: resolveDetailField(detail.taskArea),
  inspectionDevice: resolveDetailField(detail.inspectionDevice),
  taskTime: resolveDetailField(detail.taskTime),
});

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
    defaultTaskDetailVisible = false,
    taskDetail,
    onItemClick,
    onTaskDetailClose,
    ...otherProps
  } = props;
  const [items, setItems] = useState<TodayTaskItem[]>(data);
  const [visibleTaskDetail, setVisibleTaskDetail] = useState(defaultTaskDetailVisible);
  const [activeTaskDetail, setActiveTaskDetail] = useState<TodayTaskDetail>(
    taskDetail ? normalizeTaskDetail(taskDetail) : defaultTaskDetail,
  );
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    if (taskDetail) {
      setActiveTaskDetail(normalizeTaskDetail(taskDetail));
    }
  }, [taskDetail]);

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

  const closeTaskDetail = () => {
    setVisibleTaskDetail(false);

    if (onTaskDetailClose) {
      onTaskDetailClose();
    }
  };

  const detail = formatTaskDetail(activeTaskDetail);
  const detailRows = [
    { label: '任务名称', value: detail.name },
    { label: '任务区域', value: detail.taskArea },
    { label: '巡检设备', value: detail.inspectionDevice },
    { label: '任务时间', value: detail.taskTime },
  ];

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
                setActiveTaskDetail(normalizeTaskDetail(item));
                setVisibleTaskDetail(true);

                if (onItemClick) {
                  onItemClick(item, index);
                }
              }}
            >
              <span className="bizpack-today-task-icon-wrap">
                <span className="bizpack-today-task-icon" />
              </span>
              <span className="bizpack-today-task-name" title={item.name}>
                {item.name}
              </span>
              <span className="bizpack-today-task-right">
                <span className="bizpack-today-task-level">{levelText}</span>
                <span className="bizpack-today-task-row-arrow" aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
      {visibleTaskDetail ? (
        <div className="bizpack-today-task-modal" role="dialog" aria-modal="true">
          <div className="bizpack-today-task-modal-card">
            <div className="bizpack-today-task-modal-header">
              <span className="bizpack-today-task-modal-arrow" />
              <span className="bizpack-today-task-modal-title">任务详情</span>
              <button
                className="bizpack-today-task-modal-close"
                type="button"
                aria-label="关闭任务详情"
                onClick={closeTaskDetail}
              />
            </div>
            <div className="bizpack-today-task-modal-body">
              <div className="bizpack-today-task-modal-info">
                {detailRows.map((row) => (
                  <div className="bizpack-today-task-modal-line" key={row.label}>
                    <span className="bizpack-today-task-modal-label">{row.label}：</span>
                    <span className="bizpack-today-task-modal-value">{row.value}</span>
                  </div>
                ))}
              </div>
              <button
                className="bizpack-today-task-modal-status"
                type="button"
                onClick={closeTaskDetail}
              >
                标记完成
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

TodayTask.displayName = 'TodayTask';
export default TodayTask;
