import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

/** 与接口 qtcData 结构一致：xAxis + series[].name + topic 指定的数值字段 */
const defaultApiData = {
  topic: 'init_data',
  xAxis: [
    '04:44', '05:44', '06:44', '07:44', '08:44', '09:44', '10:44', '11:44',
    '12:44', '13:44', '14:44', '15:44', '16:44',
  ],
  series: [
    {
      name: '设备1',
      init_data: [0.015, 0.02, 0.03, 0.035, 0.045, 0.05, 0.06, 0.065, 0.075, 0.08, 0.09, 0.095, 0.105],
    },
    {
      name: '设备2',
      init_data: [0.03, 0.025, 0.015, 0.04, 0.06, 0.05, 0.045, 0.07, 0.09, 0.08, 0.075, 0.1, 0.12],
    },
    {
      name: '设备3',
      init_data: [0.02, 0.035, 0.04, 0.025, 0.05, 0.055, 0.07, 0.06, 0.08, 0.085, 0.095, 0.09, 0.11],
    },
    {
      name: '设备4',
      init_data: [1000, 120, 105, 187, 992, 2030, 2800, 1500, 900, 600, 400, 300, 200],
    },
  ],
};

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
          ...dataSourceMeta,
          {
            name: 'data',
            title: {
              label: '接口数据',
              tip: '绑定整个接口对象。字段约定：xAxis→横轴；series[].name→图例；series[][topic]→折线值（topic 如 init_data / data）',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'title',
            title: {
              label: '图表标题',
              tip: '图表顶部显示的标题文本，默认不显示',
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
            name: 'logBase',
            title: {
              label: '对数底数',
              tip: '兼容旧配置，当前 Y 轴固定为等距分段刻度 0 / 0.5 / 1 / 5000 / 10000',
            },
            defaultValue: 10,
            setter: 'NumberSetter',
          },
          {
            name: 'showLegend',
            title: {
              label: '显示图例',
              tip: '图例名称取自 series[].name',
            },
            defaultValue: true,
            setter: 'BoolSetter',
          },
          {
            name: 'legendPosition',
            title: {
              label: '图例位置',
              tip: '图例位置，默认 top',
            },
            defaultValue: 'top',
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
        data: defaultApiData,
        logBase: 10,
        showLegend: true,
        legendPosition: 'top',
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
