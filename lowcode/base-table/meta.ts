import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const defaultColumns = [
  { key: 'name', title: '名称', align: 'left' },
  { key: 'mode', title: '模式', align: 'center' },
  { key: 'output', title: '输出', align: 'center' },
  { key: 'openFlow', title: '开度/流量', align: 'right' },
];

const defaultData = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  name: '调节阀1',
  mode: '自动',
  output: '52%',
  openFlow: '412/200',
}));

const BaseTableMeta: ComponentMetadata = {
  componentName: 'BaseTable',
  title: '基础表格',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'BaseTable',
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
          label: '表格配置',
        },
        items: [
          {
            name: 'columns',
            title: {
              label: '列定义',
              tip: '每一项包含 key、title、align（left/center/right）、width 字段',
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
            name: 'onRowClick',
            title: {
              label: '点击行',
              tip: '(item, index) => void',
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
    title: '基础表格',
    screenshot: '',
    schema: {
      componentName: 'BaseTable',
      props: {
        ...ChartSnippet,
        columns: defaultColumns,
        data: defaultData,
        width: 400,
        height: 368,
      },
    },
  },
];

export default {
  ...BaseTableMeta,
  snippets,
};
