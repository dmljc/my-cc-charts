import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_DEVICE_SPOT_CHECK_TEST_DATA } from '../../src/components/device-spot-check/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_DEVICE_SPOT_CHECK_TEST_DATA;

const { height: _snippetHeight, ...spotCheckChartSnippet } = ChartSnippet;

const DeviceSpotCheckMeta: ComponentMetadata = {
  componentName: 'DeviceSpotCheck',
  title: '设备点检',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DeviceSpotCheck',
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
              label: '设备点检数据',
              tip: '支持后端结构：{ inspectionStats: { inspected, overdue, expiring } }，或直接传 { inspected, overdue, expiring }',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'inspectedField',
            title: {
              label: '已点检字段名',
              tip: '默认 inspected',
            },
            defaultValue: 'inspected',
            setter: 'StringSetter',
          },
          {
            name: 'overdueField',
            title: {
              label: '逾期未检字段名',
              tip: '默认 overdue',
            },
            defaultValue: 'overdue',
            setter: 'StringSetter',
          },
          {
            name: 'expiringField',
            title: {
              label: '即将到期字段名',
              tip: '默认 expiring',
            },
            defaultValue: 'expiring',
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
            name: 'width',
            title: '宽度',
            setter: 'NumberSetter',
          },
          {
            name: 'height',
            title: {
              label: '高度',
              tip: '不填则按切图比例自适应',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'centerText',
            title: {
              label: '中心文案',
              tip: '默认 检',
            },
            defaultValue: '检',
            setter: 'StringSetter',
          },
          {
            name: 'inspectedLabel',
            title: '已点检文案',
            defaultValue: '已点检',
            setter: 'StringSetter',
          },
          {
            name: 'overdueLabel',
            title: '逾期未检文案',
            defaultValue: '逾期未检',
            setter: 'StringSetter',
          },
          {
            name: 'expiringLabel',
            title: '即将到期文案',
            defaultValue: '即将到期',
            setter: 'StringSetter',
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
            name: 'onItemClick',
            title: {
              label: '点击指标',
              tip: '(key, value) => void，key 为 inspected/overdue/expiring',
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
    title: '设备点检',
    screenshot: '',
    schema: {
      componentName: 'DeviceSpotCheck',
      props: {
        ...spotCheckChartSnippet,
        data: { inspectionStats: defaultData },
        inspectedField: 'inspected',
        overdueField: 'overdue',
        expiringField: 'expiring',
        centerText: '检',
        inspectedLabel: '已点检',
        overdueLabel: '逾期未检',
        expiringLabel: '即将到期',
        width: 400,
      },
    },
  },
];

export default {
  ...DeviceSpotCheckMeta,
  snippets,
};
