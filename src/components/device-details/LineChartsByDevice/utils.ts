import type { EChartsOption } from "echarts";
import {
	buildTimeAxisTicks,
	clampTimeToNow,
	formatAxisTime,
	formatTooltipTime,
	formatYAxisValue,
	getLineChartLayout,
} from "../chart-time-utils";
import type {
	LineChartBuildContext,
	LineChartPoint,
	LineChartResolvedSeries,
	LineChartSeriesItem,
} from "./interface";

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;
/** Tooltip 与边界附近取值允许的最大距离。 */
const MAX_NEAREST_POINT_MS = 10 * MS_MINUTE;
/** 动态断线阈值相对常规采样间隔的倍数。 */
const LINE_GAP_FACTOR = 5;
/** 动态断线阈值下限，避免偶发采样抖动造成断线。 */
const MIN_LINE_GAP_MS = MS_MINUTE;
const AXIS_LABEL_COLOR = "rgba(198, 221, 255, 0.72)";
const SPLIT_LINE_COLOR = "rgba(100, 160, 210, 0.28)";
const AXIS_LINE_COLOR = "rgba(100, 160, 210, 0.45)";
const TICK_COLOR = "rgba(100, 160, 210, 0.45)";
const FONT_FAMILY =
	'"HarmonyOS Sans SC", "HarmonyOS_Sans_SC", "PingFang SC", "Microsoft YaHei", sans-serif';
/** 蓝湖稿：设备A 蓝 / 设备B 黄 */
const DEFAULT_COLORS = ["#3BA7FF", "#F0C040", "#6BC7A6"];

function toRgba(color: string, alpha: number): string {
	const hex = color.trim();
	if (/^#([0-9a-f]{6})$/i.test(hex)) {
		const value = hex.slice(1);
		const r = Number.parseInt(value.slice(0, 2), 16);
		const g = Number.parseInt(value.slice(2, 4), 16);
		const b = Number.parseInt(value.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}
	return color;
}

type LineChartPlotPoint = [number, number | null];

/**
 * 将业务点转为 `[时间戳, 数值]`，按时间升序。
 *
 * @param {LineChartPoint[]} - 组件入参点列；缺省或非数组时返回空数组。
 * @returns {[number, number][]} - 可供 ECharts 使用的点。
 */
export function toChartPoints(data: LineChartPoint[]): [number, number][] {
	if (!Array.isArray(data) || data.length === 0) {
		return [];
	}
	return data
		.map((point): [number, number] => {
			if (typeof point.time === "number") {
				return [point.time, point.value];
			}
			const parsed = Date.parse(point.time);
			const time = Number.isNaN(parsed) ? Number(point.time) : parsed;
			return [time, point.value];
		})
		.filter(([time]) => Number.isFinite(time))
		.sort((a, b) => a[0] - b[0]);
}

/**
 * 只保留当前 X 轴窗口内的点。
 *
 * @param {[number, number][]} - 已按时间升序的点。
 * @param {[number, number] | null} - 可见时间区间。
 * @returns {[number, number][]} - 裁切后的点。
 */
export function clipPointsToView(
	points: [number, number][],
	viewExtent: [number, number] | null,
): [number, number][] {
	if (!viewExtent || points.length === 0) {
		return points;
	}
	const [start, end] = viewExtent;
	return points.filter(([time]) => time >= start && time <= end);
}

/**
 * 根据当前分段的常规采样间隔计算断线阈值。
 *
 * @param {[number, number][]} - 已按时间升序的点。
 * @returns {number} - 相邻点超过此毫秒数时断开。
 */
export function getLineGapThreshold(points: [number, number][]): number {
	const intervals: number[] = [];
	for (let index = 1; index < points.length; index += 1) {
		const interval = points[index][0] - points[index - 1][0];
		if (interval > 0) intervals.push(interval);
	}
	if (!intervals.length) return MIN_LINE_GAP_MS;
	intervals.sort((a, b) => a - b);
	const median = intervals[Math.floor(intervals.length / 2)];
	return Math.max(MIN_LINE_GAP_MS, median * LINE_GAP_FACTOR);
}

/**
 * 相邻点时间间隔过大时插入空值，配合 `connectNulls: false` 断开折线。
 *
 * @param {[number, number][]} - 已按时间升序的点。
 * @returns {LineChartPlotPoint[]} - 可供 ECharts 使用的点（含空值）。
 */
export function breakLineOnGaps(points: [number, number][]): LineChartPlotPoint[] {
	if (points.length <= 1) {
		return points;
	}
	const gapThreshold = getLineGapThreshold(points);
	const next: LineChartPlotPoint[] = [points[0]];
	for (let index = 1; index < points.length; index += 1) {
		const prev = points[index - 1];
		const current = points[index];
		if (current[0] - prev[0] > gapThreshold) {
			next.push([prev[0], null]);
		}
		next.push(current);
	}
	return next;
}

/**
 * 补齐颜色并把各序列点规范为 `[时间戳, 数值]`。
 *
 * @param {LineChartSeriesItem[]} - 组件入参序列；缺省或非数组时返回空数组。
 * @returns {LineChartResolvedSeries[]} - 可供 ECharts 使用的序列。
 */
export function resolveSeries(series: LineChartSeriesItem[] = []): LineChartResolvedSeries[] {
	if (!Array.isArray(series) || series.length === 0) {
		return [];
	}
	return series.map((item, index) => ({
		name: item.name,
		color: item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
		data: toChartPoints(item.data ?? []),
	}));
}

/**
 * 收集点列时间范围。
 *
 * @param {[number, number][]} - `[时间戳, 数值]`。
 * @returns {[number, number] | null} - `[min, max]`；无数据时为 null。
 */
export function getPointsExtent(points: [number, number][]): [number, number] | null {
	if (!points.length) {
		return null;
	}
	let min = points[0][0];
	let max = points[0][0];
	for (const [time] of points) {
		if (time < min) min = time;
		if (time > max) max = time;
	}
	return [min, max];
}

/**
 * 按当前 X 轴可见窗口计算 Y 轴范围，随窗口内数据变化。
 *
 * @param {[number, number][]} - 全部折线点。
 * @param {[number, number] | null} - 可见时间区间。
 * @returns {{ min: number; max: number; tight: boolean }} -
 *   tight=true 表示波动很小，Y 轴贴数据极值，不强制贴 0。
 */
export function computeVisibleYExtent(
	points: [number, number][],
	viewExtent: [number, number] | null,
): { min: number; max: number; tight: boolean } {
	const values: number[] = [];
	const start = viewExtent?.[0];
	const end = viewExtent?.[1];
	for (const [time, value] of points) {
		if (!Number.isFinite(value)) continue;
		if (start != null && time < start) continue;
		if (end != null && time > end) continue;
		values.push(value);
	}
	if (!values.length) {
		for (const [, value] of points) {
			if (Number.isFinite(value)) values.push(value);
		}
	}
	if (!values.length) {
		return { min: 0, max: 1, tight: false };
	}
	const minVal = Math.min(...values);
	const maxVal = Math.max(...values);
	const span = maxVal - minVal;
	const mid = (minVal + maxVal) / 2;
	const tight = span <= Math.max(Math.abs(mid) * 0.15, 0.5);
	if (span <= 0) {
		const padding = Math.max(Math.abs(minVal) * 0.05, 0.01);
		return {
			min: minVal - padding,
			max: maxVal + padding,
			tight: true,
		};
	}
	if (tight) {
		const padding = Math.max(span * 0.1, 0.01);
		return {
			min: minVal - padding,
			max: maxVal + padding,
			tight: true,
		};
	}
	return { min: minVal, max: maxVal, tight: false };
}

/**
 * 转义 Tooltip HTML 文本。
 *
 * @param {string} - 原始文本。
 * @returns {string} - 转义后的文本。
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * 在序列中取最接近目标时刻的数值。
 *
 * @param {LineChartPlotPoint[]} - `[时间戳, 数值]`，已按时间升序。
 * @param {number} - 目标时间戳。
 * @returns {number | null} - 最近一点的数值；无数据或落在空档中为 null。
 */
function findValueAtTime(data: LineChartPlotPoint[], time: number): number | null {
	const points = data.filter((item): item is [number, number] => item[1] != null);
	if (points.length === 0) {
		return null;
	}
	const start = points[0][0];
	const end = points[points.length - 1][0];
	if (time < start || time > end) {
		return null;
	}
	let nearest = points[0];
	let best = Math.abs(points[0][0] - time);
	for (let i = 1; i < points.length; i += 1) {
		const dist = Math.abs(points[i][0] - time);
		if (dist < best) {
			best = dist;
			nearest = points[i];
		}
	}
	if (best > MAX_NEAREST_POINT_MS) {
		return null;
	}
	return nearest[1];
}

/**
 * 从 Tooltip 回调参数取出当前指示器时间。
 *
 * @param {unknown} - ECharts formatter 原始入参。
 * @returns {number | null} - 毫秒时间戳。
 */
function getHoveredTime(raw: unknown): number | null {
	const params = Array.isArray(raw) ? raw : raw ? [raw] : [];
	const first = params[0] as
		| {
				axisValue?: string | number;
				value?: number | [number, number];
		  }
		| undefined;
	if (!first) {
		return null;
	}
	if (first.axisValue != null && first.axisValue !== "") {
		const fromAxis = Number(first.axisValue);
		if (Number.isFinite(fromAxis)) {
			return fromAxis;
		}
	}
	if (Array.isArray(first.value)) {
		const fromValue = Number(first.value[0]);
		return Number.isFinite(fromValue) ? fromValue : null;
	}
	return null;
}

type LineChartPlottedSeries = Omit<LineChartResolvedSeries, "data"> & {
	data: LineChartPlotPoint[];
};

/**
 * 组装多系列同轴 Tooltip。
 *
 * @param {LineChartPlottedSeries[]} - 已按窗口裁切并断开空档的序列。
 * @param {number} - 舞台缩放比。
 * @param {(value: number) => string} - 数值格式化。
 * @param {string} - 数值单位。
 * @returns {(raw: unknown) => string} - ECharts tooltip formatter。
 */
function createTooltipFormatter(
	series: LineChartPlottedSeries[],
	scale: number,
	valueFormatter: (value: number) => string,
	unit = "",
) {
	const font = Math.max(12 * scale, 10);
	const gap = 8 * scale;
	const valueGap = 12 * scale;
	const dot = 8 * scale;
	const unitText = unit.trim();

	return (raw: unknown) => {
		const time = getHoveredTime(raw);
		if (time == null) {
			return "";
		}
		const names = [...new Set(series.map((item) => item.name))];
		const rows = names
			.map((name) => {
				const segments = series.filter((item) => item.name === name);
				const item = segments[0];
				const value =
					segments
						.map((segment) => findValueAtTime(segment.data, time))
						.find((candidate) => candidate != null) ?? null;
				if (value == null) {
					return "";
				}
				const text = unitText
					? `${valueFormatter(value)} ${unitText}`
					: valueFormatter(value);
				return `<span style="display:flex;align-items:center;gap:${6 * scale}px;color:rgba(255,255,255,0.88);font-size:${font}px">
<span style="width:${dot}px;height:${dot}px;border-radius:50%;background:${item.color};flex:none"></span>
<span>${escapeHtml(name)}</span>
</span>
<span style="color:#ffffff;font-size:${font}px;font-weight:600;text-align:right;white-space:nowrap">${escapeHtml(text)}</span>`;
			})
			.join("");
		return `<div>
<div style="margin-bottom:${gap}px;color:rgba(198,221,255,0.72);font-size:${font}px;white-space:nowrap">当前时间：${formatTooltipTime(time)}</div>
<div style="display:grid;grid-template-columns:1fr auto;column-gap:${valueGap}px;row-gap:${gap}px;align-items:center">${rows}</div>
</div>`;
	};
}

/**
 * 组装多系列同轴时序折线图 option：X 轴与 LineChartsByRoom 相同（时间轴、自定义刻度、顶部滑块）。
 *
 * @param {LineChartResolvedSeries[]} - 已规范化的序列。
 * @param {number} - 折线宽度（蓝湖逻辑像素）。
 * @param {(value: number) => string} - Tooltip 数值格式化。
 * @param {LineChartBuildContext} - 容器尺寸、缩放与窗口配置。
 * @returns {EChartsOption} - 完整图表配置。
 */
export function buildLineChartOption(
	series: LineChartResolvedSeries[],
	lineWidth: number,
	valueFormatter: (value: number) => string,
	context: LineChartBuildContext,
): EChartsOption {
	const { scale, zoom, timeExtent, viewExtent, unit = "" } = context;
	const layout = getLineChartLayout(scale);
	const fontSize = 12 * scale;
	const dataZoomGap = 10 * scale;
	const xLabelSpace = 48 * scale;
	const top0 = layout.dataZoomTop + layout.dataZoomHeight + dataZoomGap;
	const unitText = unit.trim();
	const plotted = series.map((item) => ({
		...item,
		data: breakLineOnGaps(clipPointsToView(item.data, viewExtent)),
	}));
	const points = series.flatMap((item) => item.data);
	const yExtent = computeVisibleYExtent(points, viewExtent);
	const now = Date.now();
	const viewSpan = viewExtent != null ? Math.max(viewExtent[1] - viewExtent[0], 0) : 0;
	const axisMax = viewExtent != null ? clampTimeToNow(viewExtent[1], now) : undefined;
	const axisMin = axisMax != null ? axisMax - viewSpan : viewExtent?.[0];
	const tickInterval = viewSpan >= MS_HOUR ? 10 * MS_MINUTE : MS_MINUTE;
	const axisTicks =
		axisMin != null && axisMax != null
			? buildTimeAxisTicks(axisMin, axisMax, tickInterval)
			: undefined;

	const gridOption = {
		left: layout.left,
		right: layout.right,
		top: top0,
		bottom: xLabelSpace,
		outerBoundsMode: "none" as const,
	};

	const xAxisOption = [
		{
			type: "time" as const,
			gridIndex: 0,
			min: axisMin,
			max: axisMax,
			show: true,
			nameMoveOverlap: false,
			axisTick: {
				show: true,
				customValues: axisTicks,
				length: 4 * scale,
				lineStyle: { color: TICK_COLOR },
			},
			axisLine: {
				show: true,
				lineStyle: { color: AXIS_LINE_COLOR },
			},
			axisLabel: {
				show: true,
				customValues: axisTicks,
				showMinLabel: true,
				showMaxLabel: true,
				color: AXIS_LABEL_COLOR,
				fontSize,
				fontFamily: FONT_FAMILY,
				hideOverlap: true,
				margin: 10 * scale,
				formatter: (value: number) => {
					if (axisMax != null && value > axisMax) {
						return "";
					}
					return formatAxisTime(value);
				},
			},
			splitLine: { show: false },
		},
		{
			type: "time" as const,
			gridIndex: 0,
			min: timeExtent?.[0],
			max: timeExtent?.[1] != null ? clampTimeToNow(timeExtent[1], now) : undefined,
			show: false,
			axisPointer: {
				show: false,
				triggerTooltip: false,
			},
		},
	];

	// 波动很小：贴数据 min/max；波动正常：正数从 0、负数可贴到 0
	const yMin = yExtent.tight
		? yExtent.min
		: yExtent.min >= 0
			? 0
			: yExtent.min;
	const yMax = yExtent.tight
		? yExtent.max
		: yExtent.max <= 0
			? 0
			: yExtent.max;
	const yAxisSpan = Math.max(yMax - yMin, 0.01);
	const yAxisOption = {
		type: "value" as const,
		min: yMin,
		max: yMax === yMin ? yMax + 1 : yMax,
		splitNumber: 5,
		scale: false,
		show: true,
		name: unitText || undefined,
		nameLocation: "end" as const,
		nameGap: 12 * scale,
		nameTextStyle: {
			color: AXIS_LABEL_COLOR,
			fontSize,
			fontFamily: FONT_FAMILY,
			align: "right" as const,
			padding: [0, 8 * scale, 0, 0],
		},
		nameMoveOverlap: false,
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: {
			show: true,
			showMinLabel: true,
			color: AXIS_LABEL_COLOR,
			fontSize,
			fontFamily: FONT_FAMILY,
			margin: 8 * scale,
			formatter: (value: number) => formatYAxisValue(value, yAxisSpan),
		},
		splitLine: {
			show: true,
			lineStyle: {
				color: SPLIT_LINE_COLOR,
				type: "dashed" as const,
				width: 1,
			},
		},
	};

	return {
		animationDuration: 300,
		animationDurationUpdate: 0,
		backgroundColor: "transparent",
		grid: gridOption,
		legend: {
			show: plotted.length > 0,
			bottom: 2 * scale,
			left: "center",
			itemWidth: 18 * scale,
			itemHeight: 2 * scale,
			itemGap: 24 * scale,
			icon: "rect",
			textStyle: {
				color: "rgba(255, 255, 255, 0.88)",
				fontSize,
				fontFamily: FONT_FAMILY,
			},
			data: plotted.map((item) => ({
				name: item.name,
				itemStyle: { color: item.color },
			})),
		},
		xAxis: xAxisOption,
		yAxis: yAxisOption,
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "line",
				snap: true,
				lineStyle: { color: "rgba(118, 228, 255, 0.55)", width: 1 },
				label: { show: false },
			},
			backgroundColor: "rgba(8, 28, 58, 0.92)",
			borderColor: "rgba(64, 148, 214, 0.45)",
			borderWidth: 1,
			padding: [12 * scale, 16 * scale],
			confine: true,
			extraCssText: `border-radius:${4 * scale}px;box-shadow:0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.28);`,
			formatter: createTooltipFormatter(plotted, scale, valueFormatter, unit),
		},
		dataZoom: [
			{
				type: "slider",
				xAxisIndex: 1,
				filterMode: "none",
				showDetail: false,
				brushSelect: false,
				realtime: true,
				left: layout.left,
				right: layout.sliderRight,
				top: layout.dataZoomTop,
				height: layout.dataZoomHeight,
				start: zoom.start,
				end: zoom.end,
				minValueSpan: MS_DAY,
				maxValueSpan: MS_DAY,
				zoomLock: true,
				fillerColor: "rgba(59, 167, 255, 0.45)",
				borderColor: "transparent",
				backgroundColor: "rgba(18, 48, 86, 0.72)",
				showDataShadow: false,
				handleSize: Math.max(22 * scale, 18),
				moveHandleSize: 0,
				handleStyle: {
					color: "#76e4ff",
					borderColor: "#3ba7ff",
					borderWidth: 1,
					shadowBlur: 4 * scale,
					shadowColor: "rgba(59, 167, 255, 0.35)",
				},
				emphasis: {
					handleStyle: {
						color: "#ffffff",
						borderColor: "#76e4ff",
					},
				},
				dataBackground: {
					lineStyle: { color: "transparent" },
					areaStyle: { color: "transparent" },
				},
				selectedDataBackground: {
					lineStyle: { color: "transparent" },
					areaStyle: { color: "transparent" },
				},
			},
			{
				type: "inside",
				xAxisIndex: 1,
				filterMode: "none",
				start: zoom.start,
				end: zoom.end,
				minValueSpan: MS_DAY,
				maxValueSpan: MS_DAY,
				zoomLock: true,
				zoomOnMouseWheel: false,
				moveOnMouseMove: false,
				moveOnMouseWheel: false,
			},
		],
		series: plotted.map((item) => ({
			type: "line" as const,
			name: item.name,
			data: item.data,
			xAxisIndex: 0,
			yAxisIndex: 0,
			showSymbol: false,
			smooth: 0.35,
			clip: true,
			connectNulls: false,
			lineStyle: {
				width: Math.max(lineWidth * scale, 2),
				color: item.color,
				shadowBlur: 8 * scale,
				shadowColor: toRgba(item.color, 0.45),
			},
			areaStyle: {
				color: {
					type: "linear" as const,
					x: 0,
					y: 0,
					x2: 0,
					y2: 1,
					colorStops: [
						{ offset: 0, color: toRgba(item.color, 0.38) },
						{ offset: 1, color: toRgba(item.color, 0.02) },
					],
				},
			},
			itemStyle: {
				color: item.color,
				borderColor: item.color,
				borderWidth: Math.max(1 * scale, 1),
			},
		})),
	};
}
