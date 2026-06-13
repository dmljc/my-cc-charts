import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const defaultData = [
  { id: 1, name: '取样泵1', value: 192.1 },
  { id: 2, name: '取样泵2', value: 0.0 },
  { id: 3, name: '取样泵3', value: 0.0 },
  { id: 4, name: '取样泵4', value: 156.8 },
  { id: 5, name: '取样泵5', value: 88.2 },
  { id: 6, name: '取样泵6', value: 0.0 },
];

const FlowRateMeta: ComponentMetadata = {
  componentName: 'FlowRate',
  title: '流速',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'cc-charts',
    version: '0.1.0',
    exportName: 'FlowRate',
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
            name: 'averageSpeed',
            title: '平均流速',
            setter: 'NumberSetter',
          },
          {
            name: 'maxSpeed',
            title: '最大流速',
            setter: 'NumberSetter',
          },
          {
            name: 'pageSize',
            title: '每页取样泵数',
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
    title: '流速',
    screenshot: '',
    schema: {
      componentName: 'FlowRate',
      props: {
        ...ChartSnippet,
        data: defaultData,
        width: 400,
        height: 204,
      },
    },
  },
];

export default {
  ...FlowRateMeta,
  snippets,
};
