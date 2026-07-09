import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = [
  { id: 1, label: '伽马当量：', value: 12, time: '15:03:04' },
  { id: 2, label: '伽马吸收：', value: 12, time: '15:03:04' },
  { id: 3, label: '中子当量：', value: 12, time: '15:03:04' },
  { id: 4, label: '中子吸收：', value: 12, time: '15:03:04' },
];

const DetailPopupMeta: ComponentMetadata = {
  componentName: 'DetailPopup',
  title: '详情弹框',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DetailPopup',
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
            name: 'title',
            title: {
              label: '标题',
              tip: '弹框标题文案',
            },
            setter: 'StringSetter',
          },
          {
            name: 'visible',
            title: {
              label: '是否显示',
              tip: '控制弹框显示/隐藏，默认 true',
            },
            setter: 'BoolSetter',
          },
          {
            name: 'data',
            title: {
              label: '详情数据',
              tip: '每一项包含 id、label、value、time 字段',
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
              tip: '数据中指标名称对应的字段名，默认为 label',
            },
            setter: 'StringSetter',
          },
          {
            name: 'valueField',
            title: {
              label: '数值字段名',
              tip: '数据中指标数值对应的字段名，默认为 value',
            },
            setter: 'StringSetter',
          },
          {
            name: 'timeField',
            title: {
              label: '时间字段名',
              tip: '数据中时间对应的字段名，默认为 time',
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
            name: 'minHeight',
            title: {
              label: '最小高度',
              tip: '弹框最小高度，内容超出时自动撑开，默认 172',
            },
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
            name: 'onClose',
            title: {
              label: '关闭弹框',
              tip: '() => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onItemClick',
            title: {
              label: '点击数据行',
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
    title: '详情弹框',
    screenshot: '',
    schema: {
      componentName: 'DetailPopup',
      props: {
        ...ChartSnippet,
        title: '辐射物',
        visible: true,
        data: defaultData,
        labelField: 'label',
        valueField: 'value',
        timeField: 'time',
        width: 433,
        minHeight: 172,
      },
    },
  },
];

export default {
  ...DetailPopupMeta,
  snippets,
};
