import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const defaultData = [
  { id: 1, name: '取样泵1流量计保养', level: 'urgent', levelText: '紧急' },
  { id: 2, name: '取样泵1流量计保养', level: 'normal', levelText: '一般' },
  { id: 3, name: '取样泵1流量计保养', level: 'regular', levelText: '常规' },
];

const TodayTaskMeta: ComponentMetadata = {
  componentName: 'TodayTask',
  title: '今日任务',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'TodayTask',
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
            name: 'defaultTaskDetailVisible',
            title: {
              label: '默认打开任务详情',
              tip: '组件加载时是否自动显示任务详情弹窗',
            },
            setter: 'BoolSetter',
          },
          {
            name: 'taskDetail',
            title: {
              label: '初始任务详情',
              tip: '包含 taskName、taskArea、inspectionDevice、taskTime 字段的任务详情数据',
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
            name: 'onItemClick',
            title: {
              label: '点击任务',
              tip: '(item, index) => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onTaskDetailClose',
            title: {
              label: '关闭详情',
              tip: '() => void',
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
    title: '今日任务',
    screenshot: '',
    schema: {
      componentName: 'TodayTask',
      props: {
        ...ChartSnippet,
        data: defaultData,
        width: 400,
        height: 171,
      },
    },
  },
];

export default {
  ...TodayTaskMeta,
  snippets,
};
