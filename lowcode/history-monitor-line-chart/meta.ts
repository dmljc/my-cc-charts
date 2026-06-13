import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const defaultData = [
  { label: '周一', pumpCount: 21, alarmCount: 33 },
  { label: '周二', pumpCount: 30, alarmCount: 24 },
  { label: '周三', pumpCount: 21, alarmCount: 33 },
  { label: '周四', pumpCount: 26, alarmCount: 20 },
  { label: '周五', pumpCount: 40, alarmCount: 28 },
  { label: '周六', pumpCount: 31, alarmCount: 25 },
  { label: '周日', pumpCount: 25, alarmCount: 33 },
];

const HistoryMonitorLineChartMeta: ComponentMetadata = {
  componentName: 'HistoryMonitorLineChart',
  title: '历史监测分析折线图',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'cc-charts',
    version: '0.1.0',
    exportName: 'HistoryMonitorLineChart',
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
            name: 'maxValue',
            title: '最大值',
            setter: 'NumberSetter',
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
        ],
      },
    ],
  },
};

const snippets: Snippet[] = [
  {
    title: '历史监测分析折线图',
    screenshot: '',
    schema: {
      componentName: 'HistoryMonitorLineChart',
      props: {
        ...ChartSnippet,
        data: defaultData,
        maxValue: 50,
        width: 400,
        height: 260,
      },
    },
  },
];

export default {
  ...HistoryMonitorLineChartMeta,
  snippets,
};
