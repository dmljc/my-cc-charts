// 处置统计
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { DEFAULT_DISPOSAL_STATISTICS_TEST_DATA } from './test-data';
import './index.scss';

export interface DisposalStatisticsStats {
  resolved?: number | string;
  unresolved?: number | string;
  /** 后端字段：0~1 或 0~100 均可 */
  resolutionRate?: number | string;
  /** @deprecated 兼容旧字段，优先用 resolutionRate */
  rate?: number | string;
  [key: string]: unknown;
}

export interface DisposalStatisticsData extends DisposalStatisticsStats {
  disposalStats?: DisposalStatisticsStats;
}

export type DisposalStatisticsSlotKey = 'resolved' | 'unresolved' | 'rate';

export interface DisposalStatisticsProps {
  data?: DisposalStatisticsData;
  resolvedField?: string;
  unresolvedField?: string;
  rateField?: string;
  resolvedLabel?: string;
  unresolvedLabel?: string;
  rateLabel?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (key: DisposalStatisticsSlotKey, value: number | string) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DisposalStatisticsData) => void;
  };
}

const defaultData = DEFAULT_DISPOSAL_STATISTICS_TEST_DATA as DisposalStatisticsData;

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

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const pickMetric = (
  data: DisposalStatisticsStats,
  fields: string[],
  fallback: number | string,
) => {
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    const value = data[field];
    if (value !== null && value !== undefined && value !== '') {
      return value as number | string;
    }
  }
  return fallback;
};

const formatValue = (value: number | string) => {
  const raw = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return Number(raw).toLocaleString('en-US');
  }
  return raw || '-';
};

const formatRate = (value: number) => {
  const fixed = Math.round(value * 100) / 100;
  return `${fixed.toFixed(2)}%`;
};

const unwrapStats = (value: DisposalStatisticsData): DisposalStatisticsStats => {
  if (value.disposalStats && typeof value.disposalStats === 'object') {
    return value.disposalStats;
  }
  return value;
};

const resolveData = (value?: DisposalStatisticsData | null): DisposalStatisticsStats => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...defaultData, ...unwrapStats(value) };
  }
  return { ...defaultData };
};

const resolveRatePercent = (
  stats: DisposalStatisticsStats,
  rateField: string,
): number => {
  const explicit = toNumber(
    stats[rateField] ?? stats.resolutionRate ?? stats.rate,
  );
  if (explicit !== null) {
    // 兼容 0.8222 / 82.22 两种写法
    return explicit <= 1 ? explicit * 100 : explicit;
  }

  const resolved = toNumber(stats.resolved) ?? 0;
  const unresolved = toNumber(stats.unresolved) ?? 0;
  const total = resolved + unresolved;
  if (total <= 0) {
    return 0;
  }
  return (resolved / total) * 100;
};

const DisposalStatistics: React.FC<DisposalStatisticsProps> = function DisposalStatistics(
  props,
) {
  const {
    data = defaultData,
    resolvedField = 'resolved',
    unresolvedField = 'unresolved',
    rateField = 'resolutionRate',
    resolvedLabel = '已解决',
    unresolvedLabel = '未解决',
    rateLabel = '处置率',
    width = 376,
    height,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;

  const [metrics, setMetrics] = useState<DisposalStatisticsStats>(() => resolveData(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setMetrics(resolveData(data));
    }
  }, [data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DisposalStatisticsData) => {
          setMetrics(resolveData(nextData));
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeResolvedField = resolvedField || 'resolved';
  const safeUnresolvedField = unresolvedField || 'unresolved';
  const safeRateField = rateField || 'resolutionRate';

  const resolvedValue = pickMetric(
    metrics,
    [safeResolvedField, 'resolved'],
    defaultData.resolved,
  );
  const unresolvedValue = pickMetric(
    metrics,
    [safeUnresolvedField, 'unresolved'],
    defaultData.unresolved,
  );
  const ratePercent = resolveRatePercent(metrics, safeRateField);
  const rateWidth = Math.max(0, Math.min(100, ratePercent));

  const rootStyle: React.CSSProperties = {
    width,
    height,
    ...style,
  };

  return (
    <div
      className={`bizpack-disposal-statistics ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      <div className="bizpack-disposal-statistics-main">
        <button
          type="button"
          className="bizpack-disposal-statistics-slot bizpack-disposal-statistics-slot-resolved"
          title={`${resolvedLabel} ${formatValue(resolvedValue)}`}
          onClick={() => {
            if (onItemClick) {
              onItemClick('resolved', resolvedValue);
            }
          }}
        >
          <span className="bizpack-disposal-statistics-label">{resolvedLabel}</span>
          <span className="bizpack-disposal-statistics-value bizpack-disposal-statistics-value-resolved">
            {formatValue(resolvedValue)}
          </span>
        </button>

        <div className="bizpack-disposal-statistics-center" aria-hidden="true" />

        <button
          type="button"
          className="bizpack-disposal-statistics-slot bizpack-disposal-statistics-slot-unresolved"
          title={`${unresolvedLabel} ${formatValue(unresolvedValue)}`}
          onClick={() => {
            if (onItemClick) {
              onItemClick('unresolved', unresolvedValue);
            }
          }}
        >
          <span className="bizpack-disposal-statistics-label">{unresolvedLabel}</span>
          <span className="bizpack-disposal-statistics-value bizpack-disposal-statistics-value-unresolved">
            {formatValue(unresolvedValue)}
          </span>
        </button>
      </div>

      <div className="bizpack-disposal-statistics-rate">
        <button
          type="button"
          className="bizpack-disposal-statistics-rate-text"
          title={`${rateLabel} ${formatRate(ratePercent)}`}
          onClick={() => {
            if (onItemClick) {
              onItemClick('rate', ratePercent);
            }
          }}
        >
          <span className="bizpack-disposal-statistics-rate-label">{rateLabel}</span>
          <span className="bizpack-disposal-statistics-rate-value">{formatRate(ratePercent)}</span>
        </button>
        <div
          className="bizpack-disposal-statistics-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Number(rateWidth.toFixed(2))}
          aria-label={rateLabel}
        >
          <div
            className="bizpack-disposal-statistics-progress-fill"
            style={{ width: `${rateWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};

DisposalStatistics.displayName = 'DisposalStatistics';
export default DisposalStatistics;
