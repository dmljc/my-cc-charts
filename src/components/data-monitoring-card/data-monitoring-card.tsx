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
  /** 折线图末端是否展示最新数值标注，默认 true */
  showLatestValue?: boolean;
  /**
   * 是否挂载折线图实例。跑马灯复制组应传 false，用等高占位保持滚动无缝，
   * 同时避免 ECharts Canvas 翻倍占用内存。默认 true。
   */
  mountChart?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const DEFAULT_LIST_HEIGHT = 650;
/** 复制组仍挂载真实折线图的卡片数量上限，超出后用占位以控制 ECharts 实例数 */
const DUPLICATE_REAL_CHART_LIMIT = 5;

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
          maxPoints={30 * 60}
          showXAxisLabels={false}
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
    showLatestValue = true,
    mountChart = true,
    className = '',
    style = {},
    ...otherProps
  } = props;

  // openview 经 props 整表覆盖传入；直接渲染，不做内部 state / concat
  // 列表模式展示后端返回的全部卡片，不做数量截断
  const items = Array.isArray(data) ? data : null;
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
  const metricsResizeRafRef = useRef(0);
  const primaryItemCount = items?.length ?? 0;
  /** 循环步长/最大滚动距离缓存，避免 rAF 每帧读 offsetTop/scrollHeight 触发强制布局 */
  const loopMetricsRef = useRef({ loopHeight: 0, maxScrollTop: 0, valid: false });

  const PROGRAMMATIC_SCROLL_GUARD_MS = 150;
  /** 浏览器对 scrollTop 的亚像素钳制容差（麒麟/Chromium 更易出现） */
  const SCROLL_EDGE_EPSILON = 1;

  const beginProgrammaticScroll = useCallback(() => {
    isProgrammaticScrollRef.current = true;
    lastAutoScrollAtRef.current = getNow();

    // 连续自动滚动时只维持一个清理定时器，避免每帧 clearTimeout + setTimeout
    if (programmaticScrollTimerRef.current) {
      return;
    }

    const releaseProgrammaticGuard = () => {
      const remain = PROGRAMMATIC_SCROLL_GUARD_MS - (getNow() - lastAutoScrollAtRef.current);
      if (remain > 0) {
        programmaticScrollTimerRef.current = setTimeout(releaseProgrammaticGuard, remain);
        return;
      }
      isProgrammaticScrollRef.current = false;
      programmaticScrollTimerRef.current = undefined;
    };

    programmaticScrollTimerRef.current = setTimeout(releaseProgrammaticGuard, PROGRAMMATIC_SCROLL_GUARD_MS);
  }, []);

  const setScrollTopProgrammatically = useCallback((el: HTMLDivElement, nextScrollTop: number) => {
    beginProgrammaticScroll();
    el.scrollTop = nextScrollTop;
  }, [beginProgrammaticScroll]);

  /**
   * 测量无缝循环步长：优先用首张复制卡片相对列表顶部的偏移。
   * 比 scrollHeight/2 更准确（含间距），并避免奇数高度/亚像素导致回绕点不可达。
   * 仅在尺寸变化或 effect 启动时调用，勿放入 rAF 热路径。
   */
  const measureLoopMetrics = useCallback((el: HTMLDivElement) => {
    const list = el.firstElementChild as HTMLElement | null;
    let loopHeight = el.scrollHeight / 2;

    if (list && primaryItemCount > 0) {
      const children = list.children;
      if (children.length >= primaryItemCount * 2) {
        const firstPrimary = children[0] as HTMLElement;
        const firstDuplicate = children[primaryItemCount] as HTMLElement;
        const measured = firstDuplicate.offsetTop - firstPrimary.offsetTop;
        if (measured > 0) {
          loopHeight = measured;
        }
      }
    }

    const maxScrollTop = Math.max(el.scrollHeight - el.clientHeight, 0);
    const metrics = { loopHeight, maxScrollTop, valid: true };
    loopMetricsRef.current = metrics;
    return metrics;
  }, [primaryItemCount]);

  const normalizeLoopPosition = useCallback((el: HTMLDivElement) => {
    const { loopHeight, maxScrollTop } = measureLoopMetrics(el);

    if (loopHeight <= 0) {
      return;
    }

    // 单份内容矮于视口时，无缝回绕点不可达，贴底后重置到顶部，避免卡死
    if (loopHeight > maxScrollTop + SCROLL_EDGE_EPSILON) {
      if (el.scrollTop >= maxScrollTop - SCROLL_EDGE_EPSILON) {
        setScrollTopProgrammatically(el, 0);
      }
      return;
    }

    if (el.scrollTop >= loopHeight) {
      setScrollTopProgrammatically(el, el.scrollTop - loopHeight);
    } else if (el.scrollTop < 0) {
      setScrollTopProgrammatically(el, el.scrollTop + loopHeight);
    }
  }, [measureLoopMetrics, setScrollTopProgrammatically]);

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

    // 自动滚动写入 scrollTop 会同步触发 onScroll；跳过以免每帧 measure 强制布局
    if (isProgrammaticScrollRef.current) {
      return;
    }

    normalizeLoopPosition(el);

    if (!allowManualTakeover) {
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
    loopMetricsRef.current.valid = false;

    const tick = (now: number) => {
      const el = scrollRef.current;

      if (el) {
        // 热路径只读缓存；尺寸变化由 ResizeObserver 重新 measure
        let { loopHeight, maxScrollTop, valid } = loopMetricsRef.current;
        if (!valid) {
          ({ loopHeight, maxScrollTop } = measureLoopMetrics(el));
        }

        const isUserControlling = allowManualTakeover && now < userControlUntilRef.current;
        const shouldPause = isUserControlling || (resolvedPauseOnHover && hoverPausedRef.current);

        if (isUserControlling && loopHeight > 0) {
          // 仅在越界时校正，避免手动拖动期间每帧 measure
          const nearBottom = maxScrollTop > 0 && el.scrollTop >= maxScrollTop - SCROLL_EDGE_EPSILON;
          if (
            el.scrollTop >= loopHeight
            || el.scrollTop < 0
            || (loopHeight > maxScrollTop + SCROLL_EDGE_EPSILON && nearBottom)
          ) {
            normalizeLoopPosition(el);
            ({ loopHeight, maxScrollTop } = loopMetricsRef.current);
          }
        }

        if (!shouldPause && loopHeight > 0 && maxScrollTop > 0) {
          const delta = Math.max(now - lastFrameTimeRef.current, 0);
          const speed = loopHeight / (resolvedScrollDuration * 1000);
          const prevScrollTop = el.scrollTop;
          let nextScrollTop = prevScrollTop + speed * delta;

          if (loopHeight > maxScrollTop + SCROLL_EDGE_EPSILON) {
            // 单份高度 < 容器：scrollTop 永远到不了 loopHeight，贴底后回到顶部
            if (nextScrollTop >= maxScrollTop - SCROLL_EDGE_EPSILON) {
              nextScrollTop = 0;
            }
          } else if (nextScrollTop >= loopHeight) {
            nextScrollTop %= loopHeight;
          }

          if (!Number.isFinite(nextScrollTop) || nextScrollTop < 0) {
            nextScrollTop = 0;
          }

          setScrollTopProgrammatically(el, nextScrollTop);

          // 兜底：写入后仍贴在底部且未能前进，说明被浏览器钳制，强制回绕
          if (
            nextScrollTop > prevScrollTop
            && el.scrollTop <= prevScrollTop + SCROLL_EDGE_EPSILON
            && prevScrollTop >= maxScrollTop - SCROLL_EDGE_EPSILON
          ) {
            const forced = loopHeight > maxScrollTop + SCROLL_EDGE_EPSILON
              ? 0
              : (prevScrollTop + speed * delta) % loopHeight;
            setScrollTopProgrammatically(el, Number.isFinite(forced) ? forced : 0);
          }
        }
      }

      lastFrameTimeRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    if (scrollRef.current) {
      measureLoopMetrics(scrollRef.current);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (programmaticScrollTimerRef.current) {
        clearTimeout(programmaticScrollTimerRef.current);
        programmaticScrollTimerRef.current = undefined;
      }
    };
  }, [
    allowManualTakeover,
    measureLoopMetrics,
    normalizeLoopPosition,
    primaryItemCount,
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
    // 28 卡挂载时图表尺寸连变，合并到单帧再 measure，避免麒麟机布局抖动
    const observer = new ResizeObserver(() => {
      loopMetricsRef.current.valid = false;
      if (metricsResizeRafRef.current) {
        return;
      }
      metricsResizeRafRef.current = requestAnimationFrame(() => {
        metricsResizeRafRef.current = 0;
        normalizeLoopPosition(el);
      });
    });

    observer.observe(el);
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    return () => {
      observer.disconnect();
      if (metricsResizeRafRef.current) {
        cancelAnimationFrame(metricsResizeRafRef.current);
        metricsResizeRafRef.current = 0;
      }
    };
  }, [normalizeLoopPosition, primaryItemCount, useJsAutoScroll]);

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
  // 卡片较少时复制组挂真图保证无缝段观感；数量多时用占位，避免实例翻倍拖垮麒麟机
  const duplicateMountChart = mountChart !== false
    && primaryItemCount > 0
    && primaryItemCount <= DUPLICATE_REAL_CHART_LIMIT;

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
          showLatestValue,
          mountChart !== false,
        )}
    </div>
  );
};

DataMonitoringCard.displayName = 'DataMonitoringCard';
// 不用 memo：低代码可能复用 data 引用，memo 会导致列表/折线不刷新
export default DataMonitoringCard;
