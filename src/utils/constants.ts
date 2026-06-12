export const emptyFn = () => {};
export const emptyArray = [];


/**
 * 全局主题色themeColor
 */
export const themeColor = {
    dark: ['#936767', '#937b67', '#938b67', '#849367', '#749367', '#67936d', '#679386', '#678493', '#676993', '#816793', '#93678b', '#936775'],
    light: ['#00FF87', '#00FFE0', '#80E4FF', '#2A9CFF', '#0050FF', ],
    commom: ['']
}

/**
 * 散点图图形状
 */
export const scatterShapeList = [
    { value: 'circle', label: '实心圆点' },
    { value: 'square', label: '矩形' },
    { value: 'bowtie', label: '领结形状' },
    { value: 'diamond', label: '菱形' },
    { value: 'hexagon', label: '六边形' },
    { value: 'triangle', label: '三角形' },
    { value: 'triangle-down', label: '倒三角形' },
    { value: 'tick', label: '垂直线断，带头' },
    { value: 'plus', label: '加号' },
    { value: 'hyphen', label: '连字号线段' },
    { value: 'line', label: '垂直线段' },
    { value: 'cross', label: '交叉' },
    { value: 'hollow-circle', label: '空心圆' },
    { value: 'hollow-square', label: '空心矩形' },
    { value: 'hollow-bowtie', label: '空心领结' },
    { value: 'hollow-diamond', label: '空心菱形' },
    { value: 'hollow-hexagon', label: '空心六边形' },
    { value: 'hollow-triangle', label: '空心三角' },
    { value: 'hollow-triangle-down', label: '空心倒三角' },
]

/**
 * 图例位置
 * "top" | "top-left" | "top-right" | "right" | "right-top" | "right-bottom" | "left" | "left-top" | "left-bottom" | "bottom" | "bottom-left" | "bottom-right"
 */
export const LegendPositionList = [
    { value: 'top', label: '顶部' },
    { value: 'bottom', label: '底部' },
    { value: 'left', label: '左侧' },
    { value: 'right', label: '右侧' },
    { value: 'top-left', label: '左上角' },
    { value: 'top-right', label: '右上角' },
    // { value: 'bottom-left', label: '左下角' },
    // { value: 'bottom-right', label: '右下角' },
]