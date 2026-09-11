import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_LEFT2_TEST_DATA } from '../../src/components/device-type/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_LEFT2_TEST_DATA;

const { height: _snippetHeight, ...left2ChartSnippet } = ChartSnippet;

const Left2Meta: ComponentMetadata = {
  componentName: 'Left2',
  title: '设备分类',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'Left2',
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
              label: '设备分类数据',
              tip: '支持后端结构：{ deviceTypes: { "PLC 设备": 5, "QTC 设备": 4 } }，key 为名称，value 为数量；也可直接传 deviceTypes 对象或数组',
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
            name: 'themeField',
            title: {
              label: '主题字段名',
              tip: '默认 theme，取值 blue/green；不传则按棋盘交替',
            },
            defaultValue: 'theme',
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
            title: {
              label: '高度',
              tip: '不填则按内容撑开；内容超出时才出现细滚动条',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'columns',
            title: {
              label: '列数',
              tip: '默认 2',
            },
            defaultValue: 2,
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
    title: '设备分类',
    screenshot: '',
    schema: {
      componentName: 'Left2',
      props: {
        ...left2ChartSnippet,
        data: { deviceTypes: defaultData },
        nameField: 'name',
        valueField: 'value',
        themeField: 'theme',
        columns: 2,
        width: 400,
        height: 300,
      },
    },
  },
];

export default {
  ...Left2Meta,
  snippets,
};
