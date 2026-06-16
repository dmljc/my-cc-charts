import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = [
  { id: 1, name: '真空泵1', running: true, selected: true, status: 'normal' },
  { id: 2, name: '真空泵1', running: true, status: 'normal' },
  { id: 3, name: '真空泵1', running: false, status: 'error' },
];

const VacuumPumpStatusMeta: ComponentMetadata = {
  componentName: 'VacuumPumpStatus',
  title: '真空泵状态',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'cc-charts',
    version: '0.1.0',
    exportName: 'VacuumPumpStatus',
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
              label: '真空泵数据',
              tip: '每一项包含 id、name、running、selected、status 字段',
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
            name: 'onSelect',
            title: {
              label: '选择真空泵',
              tip: '(item, index) => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onLocate',
            title: {
              label: '点击定位',
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
    title: '真空泵状态',
    screenshot: '',
    schema: {
      componentName: 'VacuumPumpStatus',
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
  ...VacuumPumpStatusMeta,
  snippets,
};
