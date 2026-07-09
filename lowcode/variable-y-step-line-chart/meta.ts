import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const defaultXAxisData = [
  '01-01', '01-02', '01-03', '01-04', '01-05',
  '01-06', '01-07', '01-08', '01-09', '01-10',
  '01-11', '01-12', '01-13', '01-14', '01-15',
  '01-16', '01-17', '01-18', '01-19', '01-20',
];

const defaultYAxisData = [
  {
    name: '曲线A',
    data: [0.12, 0.45, 0.78, 0.45, 0.12, 0.12, 0.45, 0.78, 0.45, 0.12, 0.12, 0.45, 0.78, 0.45, 0.12, 0.12, 0.45, 0.78, 0.45, 0.12],
  },
  {
    name: '曲线B',
    data: [0.05, 0.35, 0.65, 0.35, 0.05, 0.05, 0.35, 0.65, 0.35, 0.05, 0.05, 0.35, 0.65, 0.35, 0.05, 0.05, 0.35, 0.65, 0.35, 0.05],
  },
  {
    name: '曲线C',
    data: [0.22, 0.55, 0.88, 0.55, 0.22, 0.22, 0.55, 0.88, 0.55, 0.22, 0.22, 0.55, 0.88, 0.55, 0.22, 0.22, 0.55, 0.88, 0.55, 0.22],
  },
  {
    name: '高值曲线',
    data: [2800, 6200, 9600, 6200, 2800, 2800, 6200, 9600, 6200, 2800, 2800, 6200, 9600, 6200, 2800, 2800, 6200, 9600, 6200, 2800],
  },
];

const VariableYStepLineChartMeta: ComponentMetadata = {
  componentName: 'VariableYStepLineChart',
  title: '可变Y轴步进折线图',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'VariableYStepLineChart',
    main: 'src/index.tsx',
    destructuring: true,
    subName: '',
  },
  props: [
    {
      name: 'ref',
      propType: {
        type: 'oneOfType',
        value: [
          {
            type: 'func',
            params: [
              {
                name: 'instance',
                propType: 'object',
              },
            ],
            returns: {
              propType: 'number',
            },
            raw: '(instance: unknown) => void',
          },
          'object',
        ],
      },
    },
    {
      name: 'key',
      propType: {
        type: 'oneOfType',
        value: ['string', 'number'],
      },
    },
    {
      name: 'style',
      propType: 'object',
    },
  ],
  configure: {
    props: [
      {
        name: 'data',
        type: 'group',
        display: 'accordion',
        title: {
          label: '数据',
        },
        items: [
          ...ChartMetaIot,
          {
            name: 'title',
            title: {
              label: '图表标题',
              tip: '图表顶部显示的标题文本，默认不显示',
            },
            setter: 'StringSetter',
          },
          {
            name: 'xField',
            title: {
              label: 'x轴字段名',
              tip: 'x 方向映射对应的数据字段名，默认为 label（flat 数据模式）',
            },
            defaultValue: 'label',
            setter: 'StringSetter',
          },
          {
            name: 'seriesField',
            title: {
              label: '系列字段名',
              tip: '系列分组对应的数据字段名，默认为 type（flat 数据模式）',
            },
            defaultValue: 'type',
            setter: 'StringSetter',
          },
          {
            name: 'yField',
            title: {
              label: 'y轴字段名',
              tip: 'y 方向映射对应的数据字段名，默认为 value（flat 数据模式）',
            },
            defaultValue: 'value',
            setter: 'StringSetter',
          },
          {
            name: 'timeField',
            title: {
              label: '时间字段名',
              tip: 'flat 数据中用于时间范围过滤的字段名，默认为 time；也可使用可解析的时间字符串作为 x 轴字段',
            },
            defaultValue: 'time',
            setter: 'StringSetter',
          },
        ],
      },
      {
        name: '',
        type: 'group',
        display: 'accordion',
        title: {
          label: '图形属性',
        },
        items: [
          {
            name: 'xAxisData',
            title: {
              label: 'x轴类别数据',
              tip: 'x 轴类别标签数组，例如 ["A", "B", "C"]；与 yAxisData 同时配置时优先使用结构化数据',
            },
            setter: 'JsonSetter',
          },
          {
            name: 'yAxisData',
            title: {
              label: 'y轴系列数据',
              tip: 'y 轴系列数据数组，每项包含 name（系列名）、data（数值数组）、color（可选颜色）。Y 轴等距刻度：0 / 0.5 / 1 / 5000 / 10000',
            },
            setter: 'JsonSetter',
          },
          {
            name: 'logBase',
            title: {
              label: '对数底数',
              tip: '兼容旧配置，当前 Y 轴固定为等距分段刻度 0 / 0.5 / 1 / 5000 / 10000（仅 0.5/1/5000/10000 画虚线）',
            },
            defaultValue: 10,
            setter: 'NumberSetter',
          },
          {
            name: 'showLegend',
            title: {
              label: '显示图例',
              tip: '是否显示图例，默认 true',
            },
            defaultValue: true,
            setter: 'BoolSetter',
          },
          {
            name: 'legendPosition',
            title: {
              label: '图例位置',
              tip: '图例显示位置：left / right / top / bottom，默认 top',
            },
            setter: {
              componentName: 'SelectSetter',
              props: {
                defaultValue: 'top',
                options: [
                  { label: '左侧', value: 'left' },
                  { label: '右侧', value: 'right' },
                  { label: '顶部', value: 'top' },
                  { label: '底部', value: 'bottom' },
                ],
              },
            },
          },
          {
            name: 'showTimeRangeTabs',
            title: {
              label: '显示时间范围按钮',
              tip: '是否显示顶部时间范围筛选按钮，默认 true。切换后会按实时/半小时/1小时过滤数据',
            },
            defaultValue: true,
            setter: 'BoolSetter',
          },
          {
            name: 'timeRangeOptions',
            title: {
              label: '时间范围选项',
              tip: '顶部时间范围筛选按钮的选项数组，默认 ["实时", "半小时", "1小时"]',
            },
            defaultValue: ['实时', '半小时', '1小时'],
            setter: 'JsonSetter',
          },
          {
            name: 'defaultActiveTimeRange',
            title: {
              label: '默认选中时间范围',
              tip: '默认选中的时间范围，不传则取时间范围选项第一项',
            },
            setter: 'StringSetter',
          },
          {
            name: 'width',
            title: '宽度',
            defaultValue: 400,
            setter: 'NumberSetter',
          },
          {
            name: 'height',
            title: '高度',
            defaultValue: 300,
            setter: 'NumberSetter',
          },
          {
            name: 'className',
            title: '自定义类名',
            setter: 'StringSetter',
          },
        ],
      },
      {
        name: '',
        type: 'group',
        display: 'accordion',
        title: {
          label: '交互事件',
        },
        items: [
          {
            name: 'onPointClick',
            title: {
              label: '点击数据点',
              tip: '(item: any, seriesIndex: number, dataIndex: number) => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onTimeRangeChange',
            title: {
              label: '切换时间范围',
              tip: '(value: string, index: number) => void',
            },
            setter: 'FunctionSetter',
          },
        ],
      },
    ],
  },
};

const snippets: Snippet[] = [
  {
    title: '可变Y轴步进折线图',
    screenshot: '',
    schema: {
      componentName: 'VariableYStepLineChart',
      props: {
        ...ChartSnippet,
        title: '',
        xField: 'label',
        seriesField: 'type',
        yField: 'value',
        timeField: 'time',
        xAxisData: defaultXAxisData,
        yAxisData: defaultYAxisData,
        logBase: 10,
        showLegend: true,
        legendPosition: 'top',
        showTimeRangeTabs: true,
        timeRangeOptions: ['实时', '半小时', '1小时'],
        defaultActiveTimeRange: '实时',
        width: 400,
        height: 300,
      },
    },
  },
];

export default {
  ...VariableYStepLineChartMeta,
  snippets,
};
