import * as React from 'react';
import '../jsx-shim';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import DataMonitoringHeader from '../data-monitoring-header';
import type { DataMonitoringHeaderData } from '../data-monitoring-header/data-monitoring-header';
import DataMonitoringInfo from '../data-monitoring-info';
import type { DataMonitoringInfoItem } from '../data-monitoring-info';
import DataMonitoringLineChart from '../data-monitoring-line-chart';
import type { DataMonitoringLineChartPoint } from '../data-monitoring-line-chart';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface DataMonitoringCardData {
  id?: string | number;
  baseInfo?: DataMonitoringHeaderData;
  runtimeParameters?: DataMonitoringInfoItem[];
  tritiumConcentration?: DataMonitoringLineChartPoint[];
  /** @deprecated 请使用 baseInfo */
  header?: DataMonitoringHeaderData;
  /** @deprecated 请使用 runtimeParameters */
  info?: DataMonitoringInfoItem[];
  /** @deprecated 请使用 tritiumConcentration */
  chart?: DataMonitoringLineChartPoint[];
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DataMonitoringCardData | DataMonitoringCardData[]) => void;
    getData: () => DataMonitoringCardData | DataMonitoringCardData[] | undefined;
  };
}

export interface DataMonitoringCardProps {
  data?: DataMonitoringCardData | DataMonitoringCardData[];
  width?: number | string;
  height?: number | string;
  headerHeight?: number;
  infoHeight?: number;
  chartHeight?: number;
  cardGap?: number;
  pauseOnHover?: boolean;
  showLatestValue?: boolean;
  /** 是否挂载完整 ECharts；列表模式仅对当前页（及切页中的上一页）挂载。 */
  mountChart?: boolean;
  /** 轮播每页显示的设备数，默认 2。 */
  devicesPerPage?: number;
  /** 轮播页面停留时间（毫秒），默认 5000。 */
  carouselInterval?: number;
  /** 轮播页面切换动画时长（毫秒），默认 400。 */
  carouselTransitionDuration?: number;
  /** 是否循环轮播，默认 true。 */
  carouselLoop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

/** 双设备轮播下容纳 150px 趋势图与分页器的默认高度。 */
const DEFAULT_LIST_HEIGHT = 700;
/** 与数据监测趋势折线图统一：最近 15 分钟（1 秒 1 点 ≈ 900） */
const LIST_CHART_MAX_POINTS = 15 * 60;

const resolveNumber = (value: unknown, fallback: number) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
};

const resolveBoolean = (value: unknown, fallback: boolean) => {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return fallback;
};

const normalizeCardData = (card?: DataMonitoringCardData): DataMonitoringCardData | undefined => {
  if (!card) {
    return card;
  }
  const baseInfo = card.baseInfo ?? card.header;
  const runtimeParameters = card.runtimeParameters ?? card.info;
  const tritiumConcentration = card.tritiumConcentration ?? card.chart;
  if (
    baseInfo === card.baseInfo
    && runtimeParameters === card.runtimeParameters
    && tritiumConcentration === card.tritiumConcentration
  ) {
    return card;
  }
  return { ...card, baseInfo, runtimeParameters, tritiumConcentration };
};

const pickRootDomProps = (props: Record<string, unknown>) => {
  const domProps: Record<string, unknown> = {};
  Object.keys(props).forEach((key) => {
    if (key === 'id' || key === 'role' || key === 'tabIndex' || key.indexOf('data-') === 0 || key.indexOf('aria-') === 0) {
      domProps[key] = props[key];
    }
  });
  return domProps;
};

const getChartData = (card?: DataMonitoringCardData) => {
  const points = card?.tritiumConcentration ?? card?.chart;
  if (!Array.isArray(points)) {
    return [];
  }
  return points.length > LIST_CHART_MAX_POINTS ? points.slice(-LIST_CHART_MAX_POINTS) : points;
};

interface CardContentProps {
  data?: DataMonitoringCardData;
  headerHeight: number;
  infoHeight: number;
  chartHeight: number;
  showLatestValue: boolean;
  mountChart: boolean;
}

const CardContent: React.FC<CardContentProps> = function CardContent({
  data,
  headerHeight,
  infoHeight,
  chartHeight,
  showLatestValue,
  mountChart,
}) {
  const card = normalizeCardData(data);
  const info = card?.runtimeParameters ?? card?.info;
  const chartData = getChartData(card);
  const hasChartData = chartData.length > 0;

  return (
    <React.Fragment>
      <DataMonitoringHeader
        width="100%"
        height={headerHeight}
        data={card?.baseInfo}
        className="bizpack-data-monitoring-card-header"
      />
      {Array.isArray(info) && info.length > 0 ? (
        <DataMonitoringInfo
          width="100%"
          height={infoHeight}
          data={info}
          className="bizpack-data-monitoring-card-info"
        />
      ) : null}
      {hasChartData && mountChart ? (
        <DataMonitoringLineChart
          width="100%"
          height={chartHeight}
          data={chartData}
          maxPoints={LIST_CHART_MAX_POINTS}
          showXAxisLabels={false}
          showLatestValue={showLatestValue}
          className="bizpack-data-monitoring-card-chart"
        />
      ) : hasChartData ? (
        <div
          className="bizpack-data-monitoring-card-chart bizpack-data-monitoring-card-chart-placeholder"
          style={{ height: chartHeight }}
          aria-hidden="true"
        />
      ) : null}
    </React.Fragment>
  );
};

const DataMonitoringCard: React.FC<DataMonitoringCardProps> = function DataMonitoringCard(props) {
  const {
    data,
    width = '100%',
    height,
    headerHeight = 78,
    infoHeight = 60,
    chartHeight = 150,
    cardGap = 16,
    pauseOnHover = true,
    showLatestValue = true,
    mountChart = true,
    devicesPerPage = 2,
    carouselInterval = 5000,
    carouselTransitionDuration = 400,
    carouselLoop = true,
    className = '',
    style = {},
    ...otherProps
  } = props;
  const [sourceData, setSourceData] = useState(data);
  const sourceDataRef = useRef(sourceData);
  const bizRef = useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;
  const items = Array.isArray(sourceData) ? sourceData : null;
  const isListMode = !!items && items.length > 1;
  const singleData = Array.isArray(sourceData)
    ? (sourceData.length === 1 ? sourceData[0] : undefined)
    : sourceData;
  const resolvedHeaderHeight = resolveNumber(headerHeight, 78);
  const resolvedInfoHeight = resolveNumber(infoHeight, 60);
  const resolvedChartHeight = resolveNumber(chartHeight, 150);
  const resolvedHeight = resolveNumber(height, DEFAULT_LIST_HEIGHT);
  const resolvedPauseOnHover = resolveBoolean(pauseOnHover, true);
  const resolvedShowLatestValue = resolveBoolean(showLatestValue, true);
  const resolvedMountChart = resolveBoolean(mountChart, true);
  const resolvedDevicesPerPage = Math.max(1, Math.floor(resolveNumber(devicesPerPage, 2)));
  const resolvedCarouselInterval = resolveNumber(carouselInterval, 5000);
  const resolvedCarouselTransitionDuration = resolveNumber(carouselTransitionDuration, 400);
  const resolvedCarouselLoop = resolveBoolean(carouselLoop, true);
  const resolvedCardGap = resolveNumber(cardGap, 16);
  const rootDomProps = pickRootDomProps(otherProps);
  const [carouselPage, setCarouselPage] = useState(0);
  const carouselPageRef = useRef(0);
  const [carouselTrackPage, setCarouselTrackPage] = useState(0);
  const [outgoingCarouselPage, setOutgoingCarouselPage] = useState<number | null>(null);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [isCarouselResetting, setIsCarouselResetting] = useState(false);

  const carouselPages = useMemo(() => {
    if (!items) {
      return [];
    }

    const pages: DataMonitoringCardData[][] = [];
    for (let start = 0; start < items.length; start += resolvedDevicesPerPage) {
      pages.push(items.slice(start, start + resolvedDevicesPerPage));
    }
    return pages;
  }, [items, resolvedDevicesPerPage]);

  const renderedCarouselPages = useMemo(
    () => (
      resolvedCarouselLoop && carouselPages.length > 1
        ? [...carouselPages, carouselPages[0]]
        : carouselPages
    ),
    [carouselPages, resolvedCarouselLoop],
  );

  useEffect(() => {
    setSourceData(data);
  }, [data]);

  useEffect(() => {
    sourceDataRef.current = sourceData;
  }, [sourceData]);

  useEffect(() => {
    carouselPageRef.current = carouselPage;
  }, [carouselPage]);

  // 循环开关或页数变化时，取消克隆页动画并回到真实页面索引。
  // 防止在「末页 → 首页克隆页」的过渡中关闭循环导致轨道越界、显示空白页。
  useEffect(() => {
    const normalizedPage = Math.min(carouselPageRef.current, Math.max(carouselPages.length - 1, 0));

    carouselPageRef.current = normalizedPage;
    setCarouselPage(normalizedPage);
    setCarouselTrackPage(normalizedPage);
    setOutgoingCarouselPage(null);
    setIsCarouselResetting(true);
  }, [carouselPages.length, resolvedCarouselLoop]);

  useEffect(() => {
    if (!isCarouselResetting || typeof window === 'undefined') {
      return undefined;
    }

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsCarouselResetting(false);
      });
    });

    return () => window.cancelAnimationFrame(firstFrame);
  }, [isCarouselResetting]);

  useEffect(() => {
    if (carouselPaused || carouselPages.length <= 1 || typeof window === 'undefined') {
      return undefined;
    }

    const advancePage = () => {
      setCarouselPage((current) => {
        const isLast = current >= carouselPages.length - 1;

        if (isLast && !resolvedCarouselLoop) {
          return current;
        }

        const next = isLast ? 0 : current + 1;
        setOutgoingCarouselPage(current);
        setCarouselTrackPage(isLast && resolvedCarouselLoop ? carouselPages.length : next);
        return next;
      });
    };
    const timer = window.setTimeout(advancePage, resolvedCarouselInterval);

    return () => window.clearTimeout(timer);
  }, [
    carouselPage,
    carouselPages.length,
    carouselPaused,
    resolvedCarouselInterval,
    resolvedCarouselLoop,
  ]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const onVisibilityChange = () => {
      setCarouselPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData) => {
          setSourceData(nextData);
        },
        getData: () => sourceDataRef.current,
      },
    };
    init(props, bizRef, bc);
    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootStyle: React.CSSProperties = {
    width,
    ...(isListMode ? { height: resolvedHeight } : height !== undefined ? { height } : {}),
    ...(isListMode ? { ['--bizpack-data-monitoring-card-gap' as string]: `${resolvedCardGap}px` } : {}),
    ...style,
  };

  if (!isListMode) {
    return (
      <div className={`bizpack-data-monitoring-card ${className}`} style={rootStyle} {...rootDomProps}>
        <CardContent
          data={singleData}
          headerHeight={resolvedHeaderHeight}
          infoHeight={resolvedInfoHeight}
          chartHeight={resolvedChartHeight}
          showLatestValue={resolvedShowLatestValue}
          mountChart={resolvedMountChart}
        />
      </div>
    );
  }

  const canNavigateCarousel = carouselPages.length > 1;
  const changeCarouselPage = (nextPage: number) => {
    if (!canNavigateCarousel || nextPage === carouselPage) {
      return;
    }

    setOutgoingCarouselPage(carouselPage);
    setCarouselPage(Math.max(0, Math.min(carouselPages.length - 1, nextPage)));
    setCarouselTrackPage(Math.max(0, Math.min(carouselPages.length - 1, nextPage)));
  };

  return (
    <div className={`bizpack-data-monitoring-card ${className}`} style={rootStyle} {...rootDomProps}>
      <div
        className="bizpack-data-monitoring-card-carousel"
        onMouseEnter={resolvedPauseOnHover ? () => setCarouselPaused(true) : undefined}
        onMouseLeave={resolvedPauseOnHover ? () => setCarouselPaused(false) : undefined}
      >
        <div
          className="bizpack-data-monitoring-card-carousel-track"
          style={{
            width: `${renderedCarouselPages.length * 100}%`,
            transform: `translate3d(-${carouselTrackPage * (100 / Math.max(renderedCarouselPages.length, 1))}%, 0, 0)`,
            transitionDuration: isCarouselResetting ? '0ms' : `${resolvedCarouselTransitionDuration}ms`,
          }}
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget) {
              if (resolvedCarouselLoop && carouselTrackPage === carouselPages.length) {
                setIsCarouselResetting(true);
                setCarouselTrackPage(0);
              }
              setOutgoingCarouselPage(null);
            }
          }}
        >
          {renderedCarouselPages.map((page, pageIndex) => {
            const logicalPageIndex = pageIndex === carouselPages.length ? 0 : pageIndex;
            const mountPageCharts = pageIndex === carouselTrackPage || logicalPageIndex === outgoingCarouselPage;

            return (
              <div
                key={pageIndex === carouselPages.length ? 'page-clone-first' : `page-${pageIndex}`}
                className="bizpack-data-monitoring-card-carousel-page"
                style={{ width: `${100 / Math.max(renderedCarouselPages.length, 1)}%` }}
              >
                {page.map((item, itemIndex) => (
                  <React.Fragment
                    key={item.id != null ? `${pageIndex}-${String(item.id)}` : `card-${pageIndex}-${itemIndex}`}
                  >
                    {itemIndex > 0 ? (
                      <div
                        className="bizpack-data-monitoring-card-carousel-separator"
                        style={{ height: resolvedCardGap }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="bizpack-data-monitoring-card-carousel-item">
                      <CardContent
                        data={item}
                        headerHeight={resolvedHeaderHeight}
                        infoHeight={resolvedInfoHeight}
                        chartHeight={resolvedChartHeight}
                        showLatestValue={resolvedShowLatestValue}
                        mountChart={resolvedMountChart && mountPageCharts}
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            );
          })}
        </div>
        {canNavigateCarousel ? (
          <div className="bizpack-data-monitoring-card-carousel-pagination" aria-label="设备轮播分页">
            {carouselPages.map((_, pageIndex) => (
              <button
                key={pageIndex}
                type="button"
                className={`bizpack-data-monitoring-card-carousel-dot ${
                  pageIndex === carouselPage ? 'bizpack-data-monitoring-card-carousel-dot-active' : ''
                }`}
                aria-label={`第 ${pageIndex + 1} 页`}
                aria-current={pageIndex === carouselPage ? 'true' : undefined}
                onClick={() => changeCarouselPage(pageIndex)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

DataMonitoringCard.displayName = 'DataMonitoringCard';
export default DataMonitoringCard;
