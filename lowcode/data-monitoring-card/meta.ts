import { ComponentMetadata, Snippet } from 'lowcode-types';
import { DEFAULT_DATA_MONITORING_PANEL_TEST_DATA } from '../../src/components/data-monitoring-panel/test-data';

const defaultData = DEFAULT_DATA_MONITORING_PANEL_TEST_DATA[0];

const DataMonitoringCardMeta: ComponentMetadata = {
  componentName: 'DataMonitoringCard',
  title: '数据监测-卡片',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DataMonitoringCard',
    main: 'src/index.tsx',
    destructuring: true,
    subName: '',
  },
  props: [
    {
      name: 'ref',
      propType: {
        type: 'oneOfType',
        value: ['object', 'func'],
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
          {
            name: 'data',
            title: {
              label: '卡片数据',
              tip: '包含 header、info、chart 三段数据',
            },
            setter: 'JsonSetter',
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
            name: 'headerHeight',
            title: '头部高度',
            setter: 'NumberSetter',
          },
          {
            name: 'infoHeight',
            title: '指标高度',
            setter: 'NumberSetter',
          },
          {
            name: 'chartHeight',
            title: '图表高度',
            setter: 'NumberSetter',
          },
          {
            name: 'showXAxisLabels',
            title: '显示横轴标签',
            setter: 'BoolSetter',
          },
          {
            name: 'className',
            title: '自定义类名',
            setter: 'StringSetter',
          },
        ],
      },
    ],
  },
};

const snippets: Snippet[] = [
  {
    title: '数据监测-卡片',
    screenshot: '',
    schema: {
      componentName: 'DataMonitoringCard',
      props: {
        data: defaultData,
        width: 400,
        headerHeight: 78,
        infoHeight: 60,
        chartHeight: 120,
        showXAxisLabels: true,
      },
    },
  },
];

export default {
  ...DataMonitoringCardMeta,
  snippets,
};
