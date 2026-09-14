import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

/** 设计器默认空数据；大屏推荐用「数据监测卡片」点击打开，或绑定 state 注入 data */
const defaultData = {
  deviceId: '',
  deviceName: '',
  deviceCode: '',
  monitorArea: '',
  pipeCode: '',
  configFlow: '',
  metrics: [],
  deviceDisabled: false,
  trendPropertyId: '',
  trendUnit: '',
  legendSeries: [],
  trendSeries: [],
  chartKey: 'device-details-empty',
};

const dataJsonTip = [
  '必填（拉趋势）：deviceId、metrics[].propertyId、trendPropertyId（或取首个指标 propertyId）',
  '头部：deviceName、deviceCode、monitorArea、pipeCode、configFlow',
  'metrics 示例：{ "key":"RCE","label":"反控执行","value":0,"unit":"","propertyId":"RCE" }',
  '趋势由组件内请求 /api/iiot/tablet/device/{deviceId}/trend，无需传 trendSeries',
].join('；');

const { height: _snippetHeight, ...deviceDetailsChartSnippet } = ChartSnippet;

const DeviceDetailsMeta: ComponentMetadata = {
  componentName: 'DeviceDetails',
  title: '设备详情',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DeviceDetails',
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
              label: '设备详情数据',
              tip: dataJsonTip,
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'apiBaseUrl',
            title: {
              label: 'API 根地址',
              tip: '趋势接口前缀，如 https://xxx.vicp.fun；留空则走当前页同域 /api/...',
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
            name: 'title',
            title: '弹窗标题',
            defaultValue: '设备详情',
            setter: 'StringSetter',
          },
          {
            name: 'width',
            title: '宽度',
            setter: 'NumberSetter',
          },
          {
            name: 'height',
            title: {
              label: '高度',
              tip: '不填则按内容自适应',
            },
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
            name: 'onClose',
            title: {
              label: '关闭弹窗',
              tip: '() => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onTrendPropertyChange',
            title: {
              label: '切换趋势指标',
              tip: '(propertyId) => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onTimePage',
            title: {
              label: '趋势时间翻页',
              tip: '左右箭头：({ from, to }) => void，from/to 为毫秒时间戳，窗口约 1 小时；组件内已自动请求 trend',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onRangeChange',
            title: {
              label: '趋势区间变化',
              tip: '顶部 1 天滑块：({ from, to }) => void，窗口约 24 小时；组件内已自动请求 trend',
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
    title: '设备详情',
    screenshot: '',
    schema: {
      componentName: 'DeviceDetails',
      props: {
        ...deviceDetailsChartSnippet,
        data: defaultData,
        title: '设备详情',
        width: 884,
        height: 643,
      },
    },
  },
];

export default {
  ...DeviceDetailsMeta,
  snippets,
};
