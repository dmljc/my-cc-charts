import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = [
  { id: 1, label: '全排', value: 1.2, trend: 'up' },
  { id: 2, label: '特排', value: 1.2, trend: 'flat' },
  { id: 3, label: '局排', value: 1.2, trend: 'down' },
  { id: 4, label: '特排', value: 1.2, trend: 'flat' },
];

const EffluentMeta: ComponentMetadata = {
  componentName: 'Effluent',
  title: '流出物',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'Effluent',
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
              label: '流出物数据',
              tip: '每一项包含 id、label、value、trend 字段，trend 取值 up/down/flat',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'labelField',
            title: {
              label: '名称字段名',
              tip: '数据中名称对应的字段名，默认为 label',
            },
            setter: 'StringSetter',
          },
          {
            name: 'valueField',
            title: {
              label: '数值字段名',
              tip: '数据中数值对应的字段名，默认为 value',
            },
            setter: 'StringSetter',
          },
          {
            name: 'trendField',
            title: {
              label: '趋势字段名',
              tip: '数据中趋势对应的字段名，默认为 trend，取值 up/down/flat',
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
            name: 'unit',
            title: '数值单位',
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
              label: '点击指标项',
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
    title: '流出物',
    screenshot: '',
    schema: {
      componentName: 'Effluent',
      props: {
        ...ChartSnippet,
        data: defaultData,
        labelField: 'label',
        valueField: 'value',
        trendField: 'trend',
        width: 400,
        height: 60,
      },
    },
  },
];

export default {
  ...EffluentMeta,
  snippets,
};
