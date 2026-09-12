import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_EFFLUENT_LINE_CHART_TEST_DATA } from '../../src/components/effluent-line-chart/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_EFFLUENT_LINE_CHART_TEST_DATA;

const EffluentLineChartMeta: ComponentMetadata = {
  componentName: 'EffluentLineChart',
  title: '流出物折线图',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'EffluentLineChart',
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
              tip: '绑定整个接口对象。字段约定与可变Y轴折线图一致：xAxis→横轴；series[].name→系列名；series[][topic]→折线值（topic 如 init_data / data）。每个系列独占一条 Y 轴，最小/最大值按数据动态计算。',
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
            name: 'showLegend',
            title: {
              label: '显示图例',
              tip: '图例名称取自 series[].name，默认不显示',
            },
            defaultValue: false,
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
            defaultValue: 600,
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
    title: '流出物折线图',
    screenshot: '',
    schema: {
      componentName: 'EffluentLineChart',
      props: {
        ...ChartSnippet,
        title: '',
        data: defaultData,
        showLegend: false,
        legendPosition: 'top',
        width: 400,
        height: 600,
      },
    },
  },
];

export default {
  ...EffluentLineChartMeta,
  snippets,
};
