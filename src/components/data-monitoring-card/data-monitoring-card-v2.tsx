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
  /** 折线图 Y 轴最小值；传入则固定使用。未传时按当前卡片趋势数据最小值动态取整。 */
  min?: number;
  /** 折线图 Y 轴最大值；传入则固定使用。未传时按当前卡片趋势数据最大值动态取整。 */
  max?: number;
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
/** 数据监测趋势折线图只保留最近 15 分钟。 */
const CHART_WINDOW_SECONDS = 15 * 60;
/** 时间字段不可识别时，按 1 秒 1 点降级裁剪。 */
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

interface PointTime {
  value: number;
  cyclic: boolean;
}

const parsePointTime = (point: DataMonitoringLineChartPoint): PointTime | null => {
  const rawValue = point.label;
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return null;
  }

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    if (rawValue >= 0 && rawValue < 24 * 60 * 60) {
      return { value: rawValue, cyclic: true };
    }
    return { value: rawValue > 1e12 ? rawValue / 1000 : rawValue, cyclic: false };
  }

  const text = String(rawValue);
  const hasCalendarDate = /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text);
  if (hasCalendarDate) {
    const timestamp = new Date(text.replace(/-/g, '/')).getTime();
    if (!Number.isNaN(timestamp)) {
      return { value: timestamp / 1000, cyclic: false };
    }
  }

  const timeMatch = text.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    return {
      value: Number(timeMatch[1]) * 3600 + Number(timeMatch[2]) * 60 + Number(timeMatch[3] || 0),
      cyclic: true,
    };
  }

  const numericValue = Number(text);
  if (Number.isFinite(numericValue)) {
    return parsePointTime({ label: numericValue });
  }

  const timestamp = new Date(text.replace(/-/g, '/')).getTime();
  return Number.isNaN(timestamp) ? null : { value: timestamp / 1000, cyclic: false };
};

const trimChartWindow = (
  points: DataMonitoringLineChartPoint[] | null | undefined,
): DataMonitoringLineChartPoint[] => {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }

  let elapsedSeconds = 0;
  let windowStart = points.length - 1;
  let nextTime = parsePointTime(points[points.length - 1]);

  if (!nextTime) {
    return points.length > LIST_CHART_MAX_POINTS ? points.slice(-LIST_CHART_MAX_POINTS) : points;
  }

  for (let index = points.length - 2; index >= 0; index -= 1) {
    const currentTime = parsePointTime(points[index]);
    if (!currentTime || currentTime.cyclic !== nextTime.cyclic) {
      return points.length > LIST_CHART_MAX_POINTS ? points.slice(-LIST_CHART_MAX_POINTS) : points;
    }

    let interval = nextTime.value - currentTime.value;
    if (nextTime.cyclic && interval < 0) {
      interval += 24 * 60 * 60;
    }
    if (interval < 0) {
      return points.length > LIST_CHART_MAX_POINTS ? points.slice(-LIST_CHART_MAX_POINTS) : points;
    }

    elapsedSeconds += interval;
    if (elapsedSeconds > CHART_WINDOW_SECONDS) {
      break;
    }

    windowStart = index;
    nextTime = currentTime;
  }

  const windowedPoints = windowStart > 0 ? points.slice(windowStart) : points;
  return windowedPoints.length > LIST_CHART_MAX_POINTS
    ? windowedPoints.slice(-LIST_CHART_MAX_POINTS)
    : windowedPoints;
};

const getPointKey = (point: DataMonitoringLineChartPoint) => {
  const label = point?.label;
  return label === null || label === undefined || label === '' ? null : String(label);
};

const mergeChartPoints = (
  history: DataMonitoringLineChartPoint[] | null | undefined,
  realtime: DataMonitoringLineChartPoint[] | null | undefined,
) => {
  const merged = Array.isArray(history) ? history.slice() : [];
  const pointIndexByKey = new Map<string, number>();

  merged.forEach((point, index) => {
    const key = getPointKey(point);
    if (key !== null) {
      pointIndexByKey.set(key, index);
    }
  });

  if (Array.isArray(realtime)) {
    realtime.forEach((point) => {
      const key = getPointKey(point);
      const existingIndex = key === null ? undefined : pointIndexByKey.get(key);
      if (existingIndex !== undefined) {
        merged[existingIndex] = point;
        return;
      }

      merged.push(point);
      if (key !== null) {
        pointIndexByKey.set(key, merged.length - 1);
      }
    });
  }

  return trimChartWindow(merged);
};

const getCardKey = (card: DataMonitoringCardData, index: number) => {
  if (card.id !== null && card.id !== undefined) {
    return `id:${String(card.id)}`;
  }
  const normalized = normalizeCardData(card);
  const deviceValue = normalized?.baseInfo?.deviceValue;
  return deviceValue !== null && deviceValue !== undefined && deviceValue !== ''
    ? `device:${String(deviceValue)}`
    : `index:${index}`;
};

const mergeCard = (
  history: DataMonitoringCardData | undefined,
  realtime: DataMonitoringCardData,
): DataMonitoringCardData => {
  const previous = normalizeCardData(history);
  const incoming = normalizeCardData(realtime) as DataMonitoringCardData;
  const incomingPoints = incoming.tritiumConcentration;

  return {
    ...previous,
    ...incoming,
    tritiumConcentration: incomingPoints === undefined
      ? trimChartWindow(previous?.tritiumConcentration)
      : mergeChartPoints(previous?.tritiumConcentration, incomingPoints),
  };
};

const mergeMonitoringData = (
  history: DataMonitoringCardData | DataMonitoringCardData[] | undefined,
  realtime: DataMonitoringCardData | DataMonitoringCardData[],
): DataMonitoringCardData | DataMonitoringCardData[] => {
  if (!Array.isArray(realtime)) {
    return mergeCard(Array.isArray(history) ? history[0] : history, realtime);
  }

  const previousList = Array.isArray(history) ? history : history ? [history] : [];
  const incomingKeys = new Set<string>();
  const incomingByKey = new Map<string, DataMonitoringCardData>();
  realtime.forEach((card, index) => {
    const key = getCardKey(card, index);
    incomingKeys.add(key);
    incomingByKey.set(key, card);
  });

  const merged = previousList.map((card, index) => {
    const key = getCardKey(card, index);
    const incoming = incomingByKey.get(key);
    if (!incoming) {
      // 增量更新未带上的设备保持原引用，避免每轮 WS 让全部卡片重渲染。
      return card;
    }
    incomingByKey.delete(key);
    return mergeCard(card, incoming);
  });

  realtime.forEach((card, index) => {
    const key = getCardKey(card, index);
    if (incomingKeys.has(key) && incomingByKey.has(key)) {
      merged.push(mergeCard(undefined, card));
      incomingByKey.delete(key);
    }
  });

  return merged;
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
  return Array.isArray(points) ? points : [];
};

interface CardContentProps {
  data?: DataMonitoringCardData;
  headerHeight: number;
  infoHeight: number;
  chartHeight: number;
  showLatestValue: boolean;
  min?: number;
  max?: number;
  mountChart: boolean;
}

const CardContent: React.FC<CardContentProps> = React.memo(function CardContent({
  data,
  headerHeight,
  infoHeight,
  chartHeight,
  showLatestValue,
  min,
  max,
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
          min={min}
          max={max}
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
});
CardContent.displayName = 'DataMonitoringCardContent';

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
    min,
    max,
    mountChart = true,
    devicesPerPage = 2,
    carouselInterval = 5000,
    carouselTransitionDuration = 400,
    carouselLoop = true,
    className = '',
    style = {},
    ...otherProps
  } = props;
  const [sourceData, setSourceData] = useState<
    DataMonitoringCardData | DataMonitoringCardData[] | undefined
  >(() => {
    if (data === undefined) {
      return undefined;
    }
    return mergeMonitoringData(undefined, data);
  });
  const sourceDataRef = useRef(sourceData);
  const previousDataPropRef = useRef(data);
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
  const carouselHoverRef = useRef(false);
  const navigateToPageRef = useRef<(nextPage: number) => void>(() => undefined);

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

  // 轮播页必须与输入数据一一对应。此前为实现无缝循环追加了首页克隆页，
  // 导致克隆页可能被当作额外设备展示。
  const renderedCarouselPages = carouselPages;

  useEffect(() => {
    if (data === undefined || data === previousDataPropRef.current) {
      return;
    }
    previousDataPropRef.current = data;
    setSourceData((previous) => {
      const next = mergeMonitoringData(previous, data);
      sourceDataRef.current = next;
      return next;
    });
  }, [data]);

  useEffect(() => {
    sourceDataRef.current = sourceData;
  }, [sourceData]);

  useEffect(() => {
    carouselPageRef.current = carouselPage;
  }, [carouselPage]);

  navigateToPageRef.current = (nextPage: number) => {
    const pageCount = carouselPages.length;
    if (pageCount <= 1) {
      return;
    }

    const clamped = Math.max(0, Math.min(pageCount - 1, nextPage));
    const current = carouselPageRef.current;
    if (clamped === current) {
      return;
    }

    const isAdjacent = Math.abs(clamped - current) === 1;
    const isLoopEdge = resolvedCarouselLoop && (
      (current === 0 && clamped === pageCount - 1)
      || (current === pageCount - 1 && clamped === 0)
    );
    const animate = isAdjacent && !isLoopEdge;

    carouselPageRef.current = clamped;
    if (animate) {
      setOutgoingCarouselPage(current);
    } else {
      setOutgoingCarouselPage(null);
      setIsCarouselResetting(true);
    }
    setCarouselPage(clamped);
    setCarouselTrackPage(clamped);
  };

  // 仅在页数缩短导致越界时回正，避免循环开关切换时无意义地打断当前页。
  useEffect(() => {
    const normalizedPage = Math.min(carouselPageRef.current, Math.max(carouselPages.length - 1, 0));
    if (normalizedPage === carouselPageRef.current) {
      return;
    }

    carouselPageRef.current = normalizedPage;
    setCarouselPage(normalizedPage);
    setCarouselTrackPage(normalizedPage);
    setOutgoingCarouselPage(null);
    setIsCarouselResetting(true);
  }, [carouselPages.length]);

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
      const current = carouselPageRef.current;
      const isLast = current >= carouselPages.length - 1;
      if (isLast && !resolvedCarouselLoop) {
        return;
      }
      navigateToPageRef.current(isLast ? 0 : current + 1);
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
      setCarouselPaused(document.hidden || carouselHoverRef.current);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData) => {
          setSourceData((previous) => {
            const next = mergeMonitoringData(previous, nextData);
            sourceDataRef.current = next;
            return next;
          });
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

  useEffect(() => {
    if (outgoingCarouselPage === null || typeof window === 'undefined') {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setOutgoingCarouselPage(null);
    }, resolvedCarouselTransitionDuration + 80);
    return () => window.clearTimeout(timer);
  }, [outgoingCarouselPage, carouselPage, resolvedCarouselTransitionDuration]);

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
          min={min}
          max={max}
          mountChart={resolvedMountChart}
        />
      </div>
    );
  }

  const canNavigateCarousel = carouselPages.length > 1;
  const changeCarouselPage = (nextPage: number) => {
    navigateToPageRef.current(nextPage);
  };

  return (
    <div className={`bizpack-data-monitoring-card ${className}`} style={rootStyle} {...rootDomProps}>
      <div
        className="bizpack-data-monitoring-card-carousel"
        onMouseEnter={resolvedPauseOnHover ? () => {
          carouselHoverRef.current = true;
          setCarouselPaused(true);
        } : undefined}
        onMouseLeave={resolvedPauseOnHover ? () => {
          carouselHoverRef.current = false;
          setCarouselPaused(document.hidden);
        } : undefined}
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
              setOutgoingCarouselPage(null);
            }
          }}
        >
          {renderedCarouselPages.map((page, pageIndex) => {
            const mountPageCharts = pageIndex === carouselTrackPage || pageIndex === outgoingCarouselPage;

            return (
              <div
                key={`page-${pageIndex}`}
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
                        min={min}
                        max={max}
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
