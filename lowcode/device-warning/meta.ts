import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_DEVICE_WARNING_TEST_DATA } from '../../src/components/device-warning/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_DEVICE_WARNING_TEST_DATA;

const DeviceWarningMeta: ComponentMetadata = {
  componentName: 'DeviceWarning',
  title: '设备警告',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DeviceWarning',
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
              label: '设备警告数据',
              tip: '每一项字段名需与下方字段映射一致；level 取值 urgent/normal/regular，文案按等级自动映射紧急/一般/常规；数组为空时展示无警告文案',
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
              tip: '数据中警告名称对应的字段名，默认为 name',
            },
            setter: 'StringSetter',
          },
          {
            name: 'levelField',
            title: {
              label: '等级字段名',
              tip: '数据中警告等级对应的字段名，默认为 level，取值 urgent/normal/regular',
            },
            setter: 'StringSetter',
          },
          {
            name: 'emptyText',
            title: {
              label: '无警告文案',
              tip: '警告列表为空时展示的文案，默认"正常"',
            },
            defaultValue: '正常',
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
              label: '点击警告项',
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
    title: '设备警告',
    screenshot: '',
    schema: {
      componentName: 'DeviceWarning',
      props: {
        ...ChartSnippet,
        data: defaultData,
        nameField: 'name',
        levelField: 'level',
        emptyText: '正常',
        width: 400,
        height: 200,
      },
    },
  },
];

export default {
  ...DeviceWarningMeta,
  snippets,
};
