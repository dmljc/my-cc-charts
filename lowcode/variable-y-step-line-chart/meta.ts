import { ComponentMetadata, Snippet } from 'lowcode-types';
import { actionConfigure } from '../common/chart-action';
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
    data: [0.015, 0.03, 0.045, 0.06, 0.075, 0.09, 0.105, 0.12, 0.135, 0.15, 0.165, 0.18, 0.195, 0.21, 0.225, 0.24, 0.255, 0.27, 0.285, 0.3],
  },
  {
    name: '曲线B',
    data: [0.03, 0.015, 0.06, 0.045, 0.09, 0.075, 0.12, 0.105, 0.15, 0.135, 0.18, 0.165, 0.21, 0.195, 0.24, 0.225, 0.27, 0.255, 0.3, 0.285],
  },
  {
    name: '曲线C',
    data: [0.075, 0.06, 0.09, 0.105, 0.045, 0.12, 0.135, 0.09, 0.165, 0.18, 0.12, 0.21, 0.15, 0.24, 0.18, 0.27, 0.21, 0.3, 0.24, 0.285],
  },
  {
    name: '高值曲线',
    data: [1, 1.5, 2, 2.8, 3.2, 3.9, 4.5, 5.1, 5.8, 6.2, 6.9, 7.3, 7.8, 8.2, 8.6, 9, 9.3, 9.5, 9.8, 10],
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
            setter: 'StringSetter',
          },
          {
            name: 'seriesField',
            title: {
              label: '系列字段名',
              tip: '系列分组对应的数据字段名，默认为 type（flat 数据模式）',
            },
            setter: 'StringSetter',
          },
          {
            name: 'yField',
            title: {
              label: 'y轴字段名',
              tip: 'y 方向映射对应的数据字段名，默认为 value（flat 数据模式）',
            },
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
              tip: 'x 轴类别标签数组，例如 ["A", "B", "C"]',
            },
            setter: 'JsonSetter',
          },
          {
            name: 'yAxisData',
            title: {
              label: 'y轴系列数据',
              tip: 'y 轴系列数据数组，每项包含 name（系列名）、data（数值数组）、color（可选颜色）',
            },
            setter: 'JsonSetter',
          },
          {
            name: 'logBase',
            title: {
              label: '对数底数',
              tip: 'y 轴对数刻度底数，默认 10。设置为 0 则使用线性轴',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'showLegend',
            title: {
              label: '显示图例',
              tip: '是否显示图例，默认 true',
            },
            setter: 'BoolSetter',
          },
          {
            name: 'legendPosition',
            title: {
              label: '图例位置',
              tip: '图例显示位置：left / right / top / bottom，默认 top（水平居中显示）',
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
              tip: '是否显示顶部时间范围筛选按钮，默认 true',
            },
            setter: 'BoolSetter',
          },
          {
            name: 'timeRangeOptions',
            title: {
              label: '时间范围选项',
              tip: '顶部时间范围筛选按钮的选项数组，默认 ["实时", "半小时", "1小时"]',
            },
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
            setter: 'NumberSetter',
          },
          {
            name: 'height',
            title: '高度',
            setter: 'NumberSetter',
          },
          {
            name: 'className',
            title: '自定义类名',
            setter: 'StringSetter',
          },
        ],
      },
      // 交互事件
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
    ].concat(actionConfigure as any),
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
        xAxisData: defaultXAxisData,
        yAxisData: defaultYAxisData,
        logBase: 10,
        showLegend: true,
        legendPosition: 'top',
        showTimeRangeTabs: true,
        timeRangeOptions: ['实时', '半小时', '1小时'],
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
