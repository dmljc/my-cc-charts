import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_DATA_MONITORING_LINE_CHART_TEST_DATA } from '../../src/components/data-monitoring-line-chart/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_DATA_MONITORING_LINE_CHART_TEST_DATA;

const DataMonitoringLineChartMeta: ComponentMetadata = {
  componentName: 'DataMonitoringLineChart',
  title: '数据监测-趋势折线图',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DataMonitoringLineChart',
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
              label: '趋势数据',
              tip: '静态预览数据，数组项字段名需与下方时间/y轴字段映射一致',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'xField',
            title: {
              label: '时间字段名',
              tip: 'x 轴时间字段名，值会格式化为 HH:mm:ss，默认 label',
            },
            setter: 'StringSetter',
          },
          {
            name: 'yField',
            title: {
              label: 'y轴字段名',
              tip: 'y 方向映射对应的数据字段名，默认 value',
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
            name: 'min',
            title: {
              label: 'y轴最小值',
              tip: '默认 0',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'max',
            title: {
              label: 'y轴最大值',
              tip: '默认 10000',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'lineColor',
            title: {
              label: '曲线颜色',
              tip: '默认 #5bc8ff',
            },
            setter: {
              componentName: 'ColorSetter',
            },
          },
          {
            name: 'showXAxisLabels',
            title: {
              label: '显示横轴标签',
              tip: '是否在横轴展示部分时间标签，默认 true',
            },
            setter: 'BoolSetter',
          },
          {
            name: 'xAxisLabelCount',
            title: {
              label: '横轴标签数量',
              tip: '横轴最多展示几个时间标签，默认 5',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'xAxisUnitLabel',
            title: {
              label: '横轴末尾单位标注',
              tip: '仅在关闭横轴标签时显示，默认 t',
            },
            setter: 'StringSetter',
          },
          {
            name: 'showLatestValue',
            title: {
              label: '显示末端数值标注',
              tip: '在曲线末端展示最新数值，默认 true',
            },
            setter: 'BoolSetter',
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
              tip: '(item, index) => void',
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
    title: '数据监测-趋势折线图',
    screenshot: '',
    schema: {
      componentName: 'DataMonitoringLineChart',
      props: {
        ...ChartSnippet,
        data: defaultData,
        xField: 'label',
        yField: 'value',
        min: 0,
        max: 10000,
        showXAxisLabels: false,
        xAxisLabelCount: 5,
        xAxisUnitLabel: 't',
        showLatestValue: true,
        width: 400,
        height: 100,
      },
    },
  },
];

export default {
  ...DataMonitoringLineChartMeta,
  snippets,
};
