import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';

/**
 * 在容器上初始化 / 更新 ECharts 实例，返回绑定用的 DOM ref。
 * 首次全量 setOption；后续用 replaceMerge，避免打断 dataZoom 拖动。
 */
export function useEchartsInit(option: EChartsCoreOption) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) {
      return undefined;
    }

    let chart = echarts.getInstanceByDom(el);
    if (!chart) {
      chart = echarts.init(el);
      readyRef.current = false;
    }

    if (option && Object.keys(option).length > 0) {
      if (!readyRef.current) {
        chart.setOption(option, true);
        readyRef.current = true;
      } else {
        chart.setOption(option, {
          replaceMerge: ['series', 'xAxis', 'yAxis', 'grid'],
        });
      }
    } else {
      chart.clear();
      readyRef.current = false;
    }

    const resize = () => {
      if (!chart.isDisposed()) {
        chart.resize();
      }
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (observer) {
      observer.observe(el);
    }
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [option]);

  useEffect(() => {
    return () => {
      readyRef.current = false;
      const el = chartRef.current;
      if (!el) {
        return;
      }
      const chart = echarts.getInstanceByDom(el);
      if (chart && !chart.isDisposed()) {
        chart.dispose();
      }
    };
  }, []);

  return chartRef;
}
