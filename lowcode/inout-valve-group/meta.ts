import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

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
          ...dataSourceMeta,
          {
            name: 'data',
            title: {
              label: '阀组数据',
              tip: '{ inletData, outletData } 各包含 { id, name, label, open, status, statusText }[]',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
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
          {
            name: 'nameField',
            title: {
              label: '名称字段名',
              tip: '数据中名称对应的字段名，默认为 name',
            },
            setter: 'StringSetter',
          },
          {
            name: 'labelField',
            title: {
              label: '标签字段名',
              tip: '数据中标签对应的字段名，默认为 label',
            },
            setter: 'StringSetter',
          },
          {
            name: 'openField',
            title: {
              label: '开关字段名',
              tip: '数据中开关状态对应的字段名，默认为 open',
            },
            setter: 'StringSetter',
          },
          {
            name: 'statusField',
            title: {
              label: '状态字段名',
              tip: '数据中状态对应的字段名，默认为 status',
            },
            setter: 'StringSetter',
          },
          {
            name: 'statusTextField',
            title: {
              label: '状态文本字段名',
              tip: '数据中状态文本对应的字段名，默认为 statusText',
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
            name: 'inletTitle',
            title: '入口阀标题',
            setter: 'StringSetter',
          },
          {
            name: 'outletTitle',
            title: '出口阀标题',
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
        nameField: 'name',
        labelField: 'label',
        openField: 'open',
        statusField: 'status',
        statusTextField: 'statusText',
        inletTitle: '入口阀',
        outletTitle: '出口阀',
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
