import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const defaultData = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `#${index + 1}`,
  open: index !== 1,
}));

const MiniElectromagneticValveGroupMeta: ComponentMetadata = {
  componentName: 'MiniElectromagneticValveGroup',
  title: '迷你电磁阀组',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'cc-charts',
    version: '0.1.0',
    exportName: 'MiniElectromagneticValveGroup',
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
            name: 'pageSize',
            title: '每页阀数',
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
              tip: '(item, nextOpen, index) => void',
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
    title: '迷你电磁阀组',
    screenshot: '',
    schema: {
      componentName: 'MiniElectromagneticValveGroup',
      props: {
        ...ChartSnippet,
        pageSize: 4,
        data: defaultData,
        width: 400,
        height: 112,
      },
    },
  },
];

export default {
  ...MiniElectromagneticValveGroupMeta,
  snippets,
};
