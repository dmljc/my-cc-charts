import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const defaultInletData = [
  { id: 'D01', name: 'D01', open: true },
  { id: 'D02', name: 'D02', open: false },
];

const defaultOutletData = [
  { id: 'D01', name: 'D01', open: true },
  { id: 'D02', name: 'D02', open: false },
];

const InoutValveGroupMeta: ComponentMetadata = {
  componentName: 'InoutValveGroup',
  title: '出入阀组',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'InoutValveGroup',
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
          {
            name: 'inletData',
            title: '入口阀数据',
            setter: 'JsonSetter',
          },
          {
            name: 'outletData',
            title: '出口阀数据',
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
            name: 'onToggle',
            title: {
              label: '切换开关',
              tip: '(item, nextOpen, index, type) => void',
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
    title: '出入阀组',
    screenshot: '',
    schema: {
      componentName: 'InoutValveGroup',
      props: {
        ...ChartSnippet,
        inletData: defaultInletData,
        outletData: defaultOutletData,
        width: 400,
        height: 90,
      },
    },
  },
];

export default {
  ...InoutValveGroupMeta,
  snippets,
};
