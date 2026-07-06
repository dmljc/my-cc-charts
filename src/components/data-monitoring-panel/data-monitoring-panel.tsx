import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useRef, useState } from 'react';
import { destroy, init } from '../../common/iot';
import DataMonitoringCard from '../data-monitoring-card';
import type { DataMonitoringCardData } from '../data-monitoring-card';
import { DEFAULT_DATA_MONITORING_PANEL_TEST_DATA } from './test-data';
import './index.scss';

export interface DataMonitoringPanelProps {
  /** 数据监测卡片列表 */
  data?: DataMonitoringCardData[];
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  /** 卡片之间的间距，默认 16 */
  cardGap?: number;
  /** 卡片头部高度，默认 78 */
  headerHeight?: number;
  /** 卡片指标区域高度，默认 60 */
  infoHeight?: number;
  /** 卡片折线图高度，默认 120 */
  chartHeight?: number;
  /** 是否显示横轴时间标签，默认 true */
  showXAxisLabels?: boolean;
  /** 是否自动纵向滚动，默认 false */
  autoScroll?: boolean;
  /** 自动滚动完整一轮的时长，单位秒，默认 36 */
  scrollDuration?: number;
  /** 鼠标悬停时暂停自动滚动，默认 true */
  pauseOnHover?: boolean;
  /** 是否显示滚动条，默认 true */
  showScrollbar?: boolean;
  onCardClick?: (item: DataMonitoringCardData, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DataMonitoringCardData[]) => void;
    getData: () => DataMonitoringCardData[];
  };
}

const DEFAULT_DATA = DEFAULT_DATA_MONITORING_PANEL_TEST_DATA;

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

const DataMonitoringPanel: React.FC<DataMonitoringPanelProps> = function DataMonitoringPanel(props) {
  const {
    data = DEFAULT_DATA,
    width = '100%',
    height = 640,
    className = '',
    style = {},
    cardGap = 16,
    headerHeight = 78,
    infoHeight = 60,
    chartHeight = 120,
    showXAxisLabels = true,
    autoScroll = false,
    scrollDuration = 36,
    pauseOnHover = true,
    showScrollbar = true,
    onCardClick,
    ...otherProps
  } = props;

  const [items, setItems] = useState<DataMonitoringCardData[]>(data);
  const itemsRef = useRef<DataMonitoringCardData[]>(data);
  const bizRef = useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;
  const rootDomProps = pickRootDomProps(otherProps);
  const shouldDuplicate = autoScroll && items.length > 1;
  const rootStyle: React.CSSProperties = {
    width,
    height,
    ...style,
  };
  const scrollStyle = {
    '--bizpack-data-monitoring-card-gap': `${cardGap}px`,
    '--bizpack-data-monitoring-scroll-duration': `${scrollDuration}s`,
  } as React.CSSProperties;

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DataMonitoringCardData[]) => {
          if (Array.isArray(nextData)) {
            setItems(nextData);
          }
        },
        getData: () => itemsRef.current,
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  const renderCards = (groupKey: string) => (
    <div className="bizpack-data-monitoring-panel-group">
      {items.map((item, index) => (
        <div
          key={`${groupKey}-${item.id != null ? String(item.id) : index}`}
          className="bizpack-data-monitoring-panel-item"
          onClick={() => {
            if (onCardClick) {
              onCardClick(item, index);
            }
          }}
        >
          <DataMonitoringCard
            data={item}
            width="100%"
            headerHeight={headerHeight}
            infoHeight={infoHeight}
            chartHeight={chartHeight}
            showXAxisLabels={showXAxisLabels}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`bizpack-data-monitoring-panel ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      <div
        className={`bizpack-data-monitoring-panel-scroll ${
          autoScroll ? 'bizpack-data-monitoring-panel-scroll-auto' : ''
        } ${showScrollbar ? '' : 'bizpack-data-monitoring-panel-scroll-hidden'}`}
        style={scrollStyle}
      >
        <div
          className={`bizpack-data-monitoring-panel-content ${
            shouldDuplicate ? 'bizpack-data-monitoring-panel-content-marquee' : ''
          } ${pauseOnHover ? 'bizpack-data-monitoring-panel-content-pause' : ''}`}
        >
          {renderCards('primary')}
          {shouldDuplicate ? renderCards('duplicate') : null}
        </div>
      </div>
    </div>
  );
};

DataMonitoringPanel.displayName = 'DataMonitoringPanel';
export default DataMonitoringPanel;
