import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = [
  { id: 1, name: '全排', value: 0.3, threshold: 1, arrow: 'down' },
  { id: 2, name: '特排', value: 0.285, threshold: 100, arrow: 'down' },
  { id: 3, name: '局排', value: 0.285, threshold: 10, arrow: 'down' },
  { id: 4, name: '特排', value: 1000, threshold: 100, arrow: 'up' },
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
              tip: '与接口一致：[{ name, value, threshold, arrow }]，arrow 取值 up/down',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'nameField',
            title: {
              label: '名称字段名',
              tip: '默认 name',
            },
            defaultValue: 'name',
            setter: 'StringSetter',
          },
          {
            name: 'valueField',
            title: {
              label: '数值字段名',
              tip: '默认 value',
            },
            defaultValue: 'value',
            setter: 'StringSetter',
          },
          {
            name: 'thresholdField',
            title: {
              label: '阈值字段名',
              tip: '默认 threshold',
            },
            defaultValue: 'threshold',
            setter: 'StringSetter',
          },
          {
            name: 'arrowField',
            title: {
              label: '箭头字段名',
              tip: '默认 arrow，取值 up/down',
            },
            defaultValue: 'arrow',
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
            title: {
              label: '宽度',
              tip: '可选；不填则由内容自适应撑开',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'height',
            title: {
              label: '高度',
              tip: '可选；不填则由内容自适应撑开',
            },
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
        nameField: 'name',
        valueField: 'value',
        thresholdField: 'threshold',
        arrowField: 'arrow',
      },
    },
  },
];

export default {
  ...EffluentMeta,
  snippets,
};
