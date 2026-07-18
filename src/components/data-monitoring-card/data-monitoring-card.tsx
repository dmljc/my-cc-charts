import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useCallback, useEffect, useRef } from 'react';
import DataMonitoringHeader from '../data-monitoring-header';
import type { DataMonitoringHeaderData } from '../data-monitoring-header/data-monitoring-header';
import DataMonitoringInfo from '../data-monitoring-info';
import type { DataMonitoringInfoItem } from '../data-monitoring-info';
import DataMonitoringLineChart from '../data-monitoring-line-chart';
import type { DataMonitoringLineChartPoint } from '../data-monitoring-line-chart';
import './index.scss';

export interface DataMonitoringCardData {
  id?: string | number;
  baseInfo?: DataMonitoringHeaderData;
  runtimeParameters?: DataMonitoringInfoItem[];
  tritiumConcentration?: DataMonitoringLineChartPoint[];
  /** @deprecated 请使用 baseInfo，兼容低代码 mock / 旧接口 */
  header?: DataMonitoringHeaderData;
  /** @deprecated 请使用 runtimeParameters */
  info?: DataMonitoringInfoItem[];
  /** @deprecated 请使用 tritiumConcentration */
  chart?: DataMonitoringLineChartPoint[];
  [key: string]: unknown;
}

/** 统一卡片字段：兼容 baseInfo/header、runtimeParameters/info、tritiumConcentration/chart */
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

  return {
    ...card,
    baseInfo,
    runtimeParameters,
    tritiumConcentration,
  };
};

export type DataMonitoringScrollMode = 'auto' | 'manual' | 'autoWithManual';

export interface DataMonitoringCardProps {
  data?: DataMonitoringCardData | DataMonitoringCardData[];
  width?: number | string;
  height?: number | string;
  headerHeight?: number;
  infoHeight?: number;
  chartHeight?: number;
  cardGap?: number;
  /** @deprecated 请使用 scrollMode */
  autoScroll?: boolean;
  scrollMode?: DataMonitoringScrollMode;
  scrollDuration?: number;
  /** 手动接管后恢复自动滚动的延迟，单位毫秒，仅 autoWithManual 生效 */
  resumeDelay?: number;
  pauseOnHover?: boolean;
  showScrollbar?: boolean;
  showXAxisLabels?: boolean;
  /** 折线图末端是否展示最新数值标注，默认 true */
  showLatestValue?: boolean;
  /**
   * 是否挂载折线图实例。跑马灯复制组应传 false，用等高占位保持滚动无缝，
   * 同时避免 ECharts Canvas 翻倍占用内存。默认 true。
   */
  mountChart?: boolean;
  /**
   * 列表模式下最多展示的卡片数量（滚动列表），默认 3。
   * 传入数据超过该数量时只保留前 N 条。
   */
  maxCards?: number;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const DEFAULT_LIST_HEIGHT = 650;
const DEFAULT_MAX_CARDS = 3;

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

const renderCardContent = (
  data: DataMonitoringCardData | undefined,
  headerHeight: number,
  infoHeight: number,
  chartHeight: number,
  showXAxisLabels: boolean,
  showLatestValue: boolean,
  mountChart: boolean = true,
) => {
  const card = normalizeCardData(data);
  // 兼容 tritiumConcentration / chart；无字段时传空数组，保证折线图仍渲染坐标系
  const chartData = Array.isArray(card?.tritiumConcentration)
    ? card.tritiumConcentration
    : Array.isArray(card?.chart)
      ? card.chart
      : [];
  const infoData = Array.isArray(card?.runtimeParameters)
    ? card.runtimeParameters
    : Array.isArray(card?.info)
      ? card.info
      : null;
  // 指标信息为空（无字段 / 空数组）时不渲染该区域
  const hasInfoData = !!infoData && infoData.length > 0;

  return (
    <React.Fragment>
      <DataMonitoringHeader
        width="100%"
        height={headerHeight}
        data={card?.baseInfo}
        className="bizpack-data-monitoring-card-header"
      />
      {hasInfoData ? (
        <DataMonitoringInfo
          width="100%"
          height={infoHeight}
          data={infoData}
          className="bizpack-data-monitoring-card-info"
        />
      ) : null}
      {mountChart ? (
        <DataMonitoringLineChart
          width="100%"
          height={chartHeight}
          data={chartData}
          showXAxisLabels={showXAxisLabels}
          showLatestValue={showLatestValue}
          className="bizpack-data-monitoring-card-chart"
        />
      ) : (
        // 复制组占位也保持与折线图一致的外观，避免滚动时出现“图表消失”
        <div
          className="bizpack-data-monitoring-card-chart bizpack-data-monitoring-card-chart-placeholder bizpack-data-monitoring-line-chart"
          style={{ width: '100%', height: chartHeight }}
          aria-hidden="true"
        />
      )}
    </React.Fragment>
  );
};

const resolveNumber = (value: unknown, fallback: number) => {
  const normalized = Number(value);

  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
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

const resolveScrollMode = (
  scrollMode: unknown,
  autoScroll: unknown,
): DataMonitoringScrollMode => {
  const normalizedMode = typeof scrollMode === 'string' ? scrollMode.trim() : scrollMode;

  if (normalizedMode === 'auto' || normalizedMode === 'manual' || normalizedMode === 'autoWithManual') {
    return normalizedMode;
  }

  if (autoScroll === false || autoScroll === 'false') {
    return 'manual';
  }

  return 'auto';
};

const getNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const DataMonitoringCard: React.FC<DataMonitoringCardProps> = function DataMonitoringCard(props) {
  const {
    data,
    width = '100%',
    height,
    headerHeight = 78,
    infoHeight = 60,
    chartHeight = 120,
    cardGap = 16,
    autoScroll,
    scrollMode,
    scrollDuration = 50,
    resumeDelay = 1000,
    pauseOnHover = true,
    showScrollbar = true,
    showXAxisLabels = true,
    showLatestValue = true,
    mountChart = true,
    maxCards = DEFAULT_MAX_CARDS,
    className = '',
    style = {},
    ...otherProps
  } = props;

  const resolvedMaxCards = resolveNumber(maxCards, DEFAULT_MAX_CARDS);
  const items = Array.isArray(data) ? data.slice(0, resolvedMaxCards) : null;
  const singleData = Array.isArray(data) ? undefined : data;
  const resolvedHeaderHeight = resolveNumber(headerHeight, 78);
  const resolvedInfoHeight = resolveNumber(infoHeight, 60);
  const resolvedChartHeight = resolveNumber(chartHeight, 120);
  const resolvedCardGap = resolveNumber(cardGap, 16);
  const resolvedScrollDuration = resolveNumber(scrollDuration, 50);
  const resolvedResumeDelay = resolveNumber(resumeDelay, 1000);
  const resolvedPauseOnHover = resolveBoolean(pauseOnHover, true);
  const resolvedShowScrollbar = resolveBoolean(showScrollbar, true);
  const resolvedScrollMode = resolveScrollMode(scrollMode, autoScroll);
  const resolvedHeight = resolveNumber(height, DEFAULT_LIST_HEIGHT);
  const isListMode = !!items && items.length > 1;
  // 自动滚动统一走 scrollTop，禁止 CSS transform 跑马灯（会令 ECharts canvas 大面积空白）
  const useJsAutoScroll = isListMode && (
    resolvedScrollMode === 'auto' || resolvedScrollMode === 'autoWithManual'
  );
  const allowManualTakeover = isListMode && resolvedScrollMode === 'autoWithManual';
  const useManualOnly = isListMode && resolvedScrollMode === 'manual';
  const shouldDuplicate = useJsAutoScroll;
  const showNativeScrollbar = (useManualOnly || allowManualTakeover) && resolvedShowScrollbar;
  const hideScrollbar = useJsAutoScroll && (
    resolvedScrollMode === 'auto' || !resolvedShowScrollbar
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const hoverPausedRef = useRef(false);
  const userControlUntilRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastAutoScrollAtRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const pointerActiveRef = useRef(false);

  const PROGRAMMATIC_SCROLL_GUARD_MS = 150;

  const beginProgrammaticScroll = useCallback(() => {
    isProgrammaticScrollRef.current = true;
    lastAutoScrollAtRef.current = getNow();

    if (programmaticScrollTimerRef.current) {
      clearTimeout(programmaticScrollTimerRef.current);
    }

    programmaticScrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      programmaticScrollTimerRef.current = undefined;
    }, PROGRAMMATIC_SCROLL_GUARD_MS);
  }, []);

  const setScrollTopProgrammatically = useCallback((el: HTMLDivElement, nextScrollTop: number) => {
    beginProgrammaticScroll();
    el.scrollTop = nextScrollTop;
  }, [beginProgrammaticScroll]);

  const normalizeLoopPosition = useCallback((el: HTMLDivElement) => {
    const loopHeight = el.scrollHeight / 2;

    if (loopHeight <= 0) {
      return;
    }

    if (el.scrollTop >= loopHeight) {
      setScrollTopProgrammatically(el, el.scrollTop - loopHeight);
    } else if (el.scrollTop < 0) {
      setScrollTopProgrammatically(el, el.scrollTop + loopHeight);
    }
  }, [setScrollTopProgrammatically]);

  const markUserInteraction = useCallback(() => {
    if (!allowManualTakeover || isProgrammaticScrollRef.current) {
      return;
    }

    userControlUntilRef.current = getNow() + resolvedResumeDelay;
  }, [allowManualTakeover, resolvedResumeDelay]);

  const handleUserScroll = useCallback(() => {
    const el = scrollRef.current;

    if (!el) {
      return;
    }

    normalizeLoopPosition(el);

    if (!allowManualTakeover || isProgrammaticScrollRef.current) {
      return;
    }

    const elapsedSinceAutoScroll = getNow() - lastAutoScrollAtRef.current;

    if (elapsedSinceAutoScroll < PROGRAMMATIC_SCROLL_GUARD_MS) {
      return;
    }

    // 滚轮/触摸已在对应事件中标记；此处主要覆盖滚动条拖拽等场景
    if (pointerActiveRef.current) {
      userControlUntilRef.current = getNow() + resolvedResumeDelay;
    }
  }, [allowManualTakeover, normalizeLoopPosition, resolvedResumeDelay]);

  useEffect(() => {
    if (!useJsAutoScroll) {
      return undefined;
    }

    hoverPausedRef.current = false;
    userControlUntilRef.current = 0;
    lastFrameTimeRef.current = getNow();

    const tick = (now: number) => {
      const el = scrollRef.current;

      if (el) {
        const loopHeight = el.scrollHeight / 2;
        const maxScrollTop = el.scrollHeight - el.clientHeight;
        const isUserControlling = allowManualTakeover && now < userControlUntilRef.current;
        const shouldPause = isUserControlling || (resolvedPauseOnHover && hoverPausedRef.current);

        if (isUserControlling) {
          normalizeLoopPosition(el);
        }

        if (!shouldPause && loopHeight > 0 && maxScrollTop > 0) {
          const delta = Math.max(now - lastFrameTimeRef.current, 0);
          const speed = loopHeight / (resolvedScrollDuration * 1000);
          let nextScrollTop = el.scrollTop + speed * delta;

          if (nextScrollTop >= loopHeight) {
            nextScrollTop -= loopHeight;
          }

          setScrollTopProgrammatically(el, nextScrollTop);
        }
      }

      lastFrameTimeRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (programmaticScrollTimerRef.current) {
        clearTimeout(programmaticScrollTimerRef.current);
      }
    };
  }, [
    allowManualTakeover,
    items,
    normalizeLoopPosition,
    resolvedPauseOnHover,
    resolvedScrollDuration,
    setScrollTopProgrammatically,
    useJsAutoScroll,
  ]);

  useEffect(() => {
    if (!useJsAutoScroll || !scrollRef.current || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const el = scrollRef.current;
    const observer = new ResizeObserver(() => {
      normalizeLoopPosition(el);
    });

    observer.observe(el);
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    return () => {
      observer.disconnect();
    };
  }, [items, normalizeLoopPosition, useJsAutoScroll]);

  const rootDomProps = pickRootDomProps(otherProps);
  const rootStyle: React.CSSProperties = {
    width,
    ...(items ? { height: resolvedHeight } : height !== undefined ? { height } : {}),
    ...(items
      ? {
        '--bizpack-data-monitoring-card-gap': `${resolvedCardGap}px`,
        '--bizpack-data-monitoring-card-scroll-duration': `${resolvedScrollDuration}s`,
      }
      : {}),
    ...style,
  };

  const renderItems = (groupKey: string, groupMountChart: boolean) => items?.map((item, index) => (
    <div
      key={`${groupKey}-${item.id != null ? String(item.id) : index}`}
      className="bizpack-data-monitoring-card-item"
    >
      {renderCardContent(
        item,
        resolvedHeaderHeight,
        resolvedInfoHeight,
        resolvedChartHeight,
        showXAxisLabels,
        showLatestValue,
        groupMountChart,
      )}
    </div>
  ));

  const scrollClassName = [
    'bizpack-data-monitoring-card-scroll',
    showNativeScrollbar ? 'bizpack-data-monitoring-card-scroll-visible' : '',
    hideScrollbar ? 'bizpack-data-monitoring-card-scroll-hidden' : '',
  ].filter(Boolean).join(' ');

  const listClassName = 'bizpack-data-monitoring-card-list';
  // 复制组也挂载真实折线图，避免无缝循环滚到下半段时出现空白占位
  const duplicateMountChart = mountChart !== false;

  return (
    <div
      className={`bizpack-data-monitoring-card ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      {items
        ? (
          <div
            ref={useJsAutoScroll || useManualOnly ? scrollRef : undefined}
            className={scrollClassName}
            style={isListMode
              ? {
                height: '100%',
                maxHeight: '100%',
                overflowY: showNativeScrollbar ? 'scroll' : 'auto',
              }
              : undefined}
            onScroll={useJsAutoScroll ? handleUserScroll : undefined}
            onWheel={allowManualTakeover ? markUserInteraction : undefined}
            onTouchStart={allowManualTakeover ? markUserInteraction : undefined}
            onPointerDown={allowManualTakeover
              ? () => {
                pointerActiveRef.current = true;
              }
              : undefined}
            onPointerUp={allowManualTakeover ? () => { pointerActiveRef.current = false; } : undefined}
            onPointerCancel={allowManualTakeover ? () => { pointerActiveRef.current = false; } : undefined}
            onPointerLeave={allowManualTakeover ? () => { pointerActiveRef.current = false; } : undefined}
            onMouseEnter={useJsAutoScroll && resolvedPauseOnHover
              ? () => { hoverPausedRef.current = true; }
              : undefined}
            onMouseLeave={useJsAutoScroll && resolvedPauseOnHover
              ? () => { hoverPausedRef.current = false; }
              : undefined}
          >
            <div className={listClassName}>
              {renderItems('primary', mountChart !== false)}
              {shouldDuplicate ? renderItems('duplicate', duplicateMountChart) : null}
            </div>
          </div>
        )
        : renderCardContent(
          singleData,
          resolvedHeaderHeight,
          resolvedInfoHeight,
          resolvedChartHeight,
          showXAxisLabels,
          showLatestValue,
          mountChart !== false,
        )}
    </div>
  );
};

DataMonitoringCard.displayName = 'DataMonitoringCard';
export default React.memo(DataMonitoringCard);
