import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = {
  id: 1,
  name: 'X12',
  status: 'normal',
  runningText: '正常运行',
  emergency: 3,
  severe: 2,
  general: 10,
};

const AlarmStatusOverviewMeta: ComponentMetadata = {
  componentName: 'AlarmStatusOverview',
  title: '告警状态概览',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'AlarmStatusOverview',
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
              label: '告警状态概览数据',
              tip: '包含 id、name、status、runningText、emergency、severe、general 字段，status 取值 normal 或 alarm',
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
              tip: '数据中名称对应的字段名，默认为 name',
            },
            setter: 'StringSetter',
          },
          {
            name: 'statusField',
            title: {
              label: '状态字段名',
              tip: '数据中状态对应的字段名，默认为 status，取值 normal 或 alarm',
            },
            setter: 'StringSetter',
          },
          {
            name: 'runningTextField',
            title: {
              label: '运行文案字段名',
              tip: '数据中正常运行文案对应的字段名，默认为 runningText',
            },
            setter: 'StringSetter',
          },
          {
            name: 'emergencyField',
            title: {
              label: '紧急字段名',
              tip: '数据中紧急数量对应的字段名，默认为 emergency',
            },
            setter: 'StringSetter',
          },
          {
            name: 'severeField',
            title: {
              label: '严重字段名',
              tip: '数据中严重数量对应的字段名，默认为 severe',
            },
            setter: 'StringSetter',
          },
          {
            name: 'generalField',
            title: {
              label: '一般字段名',
              tip: '数据中一般数量对应的字段名，默认为 general',
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
              label: '点击卡片',
              tip: '(item) => void',
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
    title: '告警状态概览',
    screenshot: '',
    schema: {
      componentName: 'AlarmStatusOverview',
      props: {
        ...ChartSnippet,
        data: defaultData,
        nameField: 'name',
        statusField: 'status',
        runningTextField: 'runningText',
        emergencyField: 'emergency',
        severeField: 'severe',
        generalField: 'general',
        width: 400,
        height: 98,
      },
    },
  },
];

export default {
  ...AlarmStatusOverviewMeta,
  snippets,
};
