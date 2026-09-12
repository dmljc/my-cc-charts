import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_LEFT1_TEST_DATA } from '../../src/components/device-overview/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_LEFT1_TEST_DATA;

const Left1Meta: ComponentMetadata = {
  componentName: 'Left1',
  title: '设备概览',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'Left1',
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
              label: '设备概览数据',
              tip: '支持后端结构：{ overviewStats: { totalDevices, workingDevices, idleDevices } }，或直接传 { totalDevices, workingDevices, idleDevices }',
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
            name: 'unitField',
            title: {
              label: '单位字段名',
              tip: '默认 unit',
            },
            defaultValue: 'unit',
            setter: 'StringSetter',
          },
          {
            name: 'themeField',
            title: {
              label: '主题字段名',
              tip: '默认 theme，取值 orange/blue/green',
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
            title: '高度',
            setter: 'NumberSetter',
          },
          {
            name: 'unit',
            title: {
              label: '默认单位',
              tip: '条目未配置 unit 时使用，默认 个',
            },
            defaultValue: '个',
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
    title: '设备概览',
    screenshot: '',
    schema: {
      componentName: 'Left1',
      props: {
        ...ChartSnippet,
        data: defaultData,
        nameField: 'name',
        valueField: 'value',
        unitField: 'unit',
        themeField: 'theme',
        unit: '个',
        width: 376,
        height: 188,
      },
    },
  },
];

export default {
  ...Left1Meta,
  snippets,
};
