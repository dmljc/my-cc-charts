import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const defaultData = [
  { id: 1, name: '取样泵1', running: false, selected: true, status: 'normal' },
  { id: 2, name: '取样泵1', running: true, status: 'normal' },
  { id: 3, name: '取样泵1', running: true, status: 'error' },
];

const SamplingPumpStatusMeta: ComponentMetadata = {
  componentName: 'SamplingPumpStatus',
  title: '取样泵状态',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'cc-charts',
    version: '0.1.0',
    exportName: 'SamplingPumpStatus',
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
    title: '取样泵状态',
    screenshot: '',
    schema: {
      componentName: 'SamplingPumpStatus',
      props: {
        ...ChartSnippet,
        data: defaultData,
        width: 400,
        height: 200,
      },
    },
  },
];

export default {
  ...SamplingPumpStatusMeta,
  snippets,
};
