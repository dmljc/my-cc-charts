import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_DEVICE_DETAILS_TEST_DATA } from '../../src/components/device-details/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_DEVICE_DETAILS_TEST_DATA;

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
              tip: '字段：metrics / deviceDisabled / trendPropertyId / trendUnit / legendSeries / trendSeries / chartKey',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
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
              tip: '(range) => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onRangeChange',
            title: {
              label: '趋势区间变化',
              tip: '(range) => void',
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
