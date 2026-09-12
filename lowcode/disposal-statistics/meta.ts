import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_DISPOSAL_STATISTICS_TEST_DATA } from '../../src/components/disposal-statistics/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_DISPOSAL_STATISTICS_TEST_DATA;

const { height: _snippetHeight, ...disposalChartSnippet } = ChartSnippet;

const DisposalStatisticsMeta: ComponentMetadata = {
  componentName: 'DisposalStatistics',
  title: '处置统计',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DisposalStatistics',
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
              label: '处置统计数据',
              tip: '支持 disposalStats: { resolved, unresolved, resolutionRate }，或直接传内层字段；resolutionRate 为 0~1 或百分比',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'resolvedField',
            title: {
              label: '已解决字段名',
              tip: '默认 resolved',
            },
            defaultValue: 'resolved',
            setter: 'StringSetter',
          },
          {
            name: 'unresolvedField',
            title: {
              label: '未解决字段名',
              tip: '默认 unresolved',
            },
            defaultValue: 'unresolved',
            setter: 'StringSetter',
          },
          {
            name: 'rateField',
            title: {
              label: '处置率字段名',
              tip: '默认 resolutionRate',
            },
            defaultValue: 'resolutionRate',
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
              tip: '不填则按内容自适应',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'resolvedLabel',
            title: '已解决文案',
            defaultValue: '已解决',
            setter: 'StringSetter',
          },
          {
            name: 'unresolvedLabel',
            title: '未解决文案',
            defaultValue: '未解决',
            setter: 'StringSetter',
          },
          {
            name: 'rateLabel',
            title: '处置率文案',
            defaultValue: '处置率',
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
              tip: '(key, value) => void，key 为 resolved/unresolved/rate',
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
    title: '处置统计',
    screenshot: '',
    schema: {
      componentName: 'DisposalStatistics',
      props: {
        ...disposalChartSnippet,
        data: defaultData,
        resolvedField: 'resolved',
        unresolvedField: 'unresolved',
        rateField: 'resolutionRate',
        resolvedLabel: '已解决',
        unresolvedLabel: '未解决',
        rateLabel: '处置率',
        width: 376,
        height: 171,
      },
    },
  },
];

export default {
  ...DisposalStatisticsMeta,
  snippets,
};
