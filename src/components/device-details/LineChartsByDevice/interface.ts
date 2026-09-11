/**
 * 折线数据点。
 */
export interface LineChartPoint {
	/** 时间戳（毫秒）或可被 Date 解析的字符串 */
	time: number | string;
	/** 指标数值 */
	value: number;
}

/**
 * 同一 Y 轴上的一条折线。
 */
export interface LineChartSeriesItem {
	/** 图例 / Tooltip 展示名 */
	name: string;
	/** 时序数据，按时间升序 */
	data: LineChartPoint[];
	/** 折线颜色，不传则使用默认色板 */
	color?: string;
}

/**
 * 已补齐默认色的序列，供组装 option 使用。
 */
export interface LineChartResolvedSeries {
	/** 图例 / Tooltip 展示名 */
	name: string;
	/** 折线颜色 */
	color: string;
	/** `[时间戳, 数值]` */
	data: [number, number][];
}

/**
 * 多系列同轴时序折线图入参（X 轴与 LineChartsByRoom 对齐）。
 */
export interface LineChartsProps {
	/** 多条折线，共用同一 Y 轴，颜色区分；缺省或非数组时按空数组渲染 */
	series?: LineChartSeriesItem[];
	/** 折线宽度（蓝湖 1400 逻辑像素） */
	lineWidth?: number;
	/** 图表 X 轴可见时长（毫秒），默认 1 小时 */
	axisRangeMs?: number;
	/** 滑块轨道总天数，默认 7 */
	totalRangeDays?: number;
	/** Tooltip 数值展示格式 */
	valueFormatter?: (value: number) => string;
	/** Tooltip 数值单位，拼在值后面 */
	unit?: string;
	/** 时间轴翻页：回传新的 1 小时查询区间 */
	onTimePage?: (range: { from: number; to: number }) => void;
	/** 滑块拖动结束：回传当前选中窗口（整天步幅） */
	onRangeChange?: (range: { from: number; to: number }) => void;
}

/**
 * 组装 ECharts option 所需的尺寸与缩放。
 */
export interface LineChartBuildContext {
	/** 容器宽度（CSS 像素） */
	width: number;
	/** 容器高度（CSS 像素） */
	height: number;
	/** 相对蓝湖 1400 舞台的缩放比 */
	scale: number;
	/** dataZoom 窗口百分比 */
	zoom: {
		start: number;
		end: number;
	};
	/** 滑块 / 轨道总范围 */
	timeExtent: [number, number] | null;
	/** 图表 X 轴可见范围（与滑块窗口解耦） */
	viewExtent: [number, number] | null;
	/** Tooltip 数值单位 */
	unit?: string;
}
