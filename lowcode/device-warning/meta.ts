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
              tip: '每一项与接口字段一致：ruleName、levelName、levelColor、alarmTime、status；status 为 "0" 未解决 / "1" 已解决；levelColor 支持十六进制色值；数组为空时展示无警告文案',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'ruleNameField',
            title: {
              label: '规则名称字段名',
              tip: '数据中规则名称对应的字段名，默认为 ruleName',
            },
            defaultValue: 'ruleName',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'ruleName',
              },
            },
          },
          {
            name: 'levelNameField',
            title: {
              label: '等级名称字段名',
              tip: '数据中等级文案对应的字段名，默认为 levelName',
            },
            defaultValue: 'levelName',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'levelName',
              },
            },
          },
          {
            name: 'levelColorField',
            title: {
              label: '等级颜色字段名',
              tip: '数据中等级颜色对应的字段名，默认为 levelColor，支持 #FF0000 等色值',
            },
            defaultValue: 'levelColor',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'levelColor',
              },
            },
          },
          {
            name: 'alarmTimeField',
            title: {
              label: '告警时间字段名',
              tip: '数据中告警时间对应的字段名，默认为 alarmTime',
            },
            defaultValue: 'alarmTime',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'alarmTime',
              },
            },
          },
          {
            name: 'statusField',
            title: {
              label: '状态字段名',
              tip: '数据中状态对应的字段名，默认为 status；"0" 未解决，"1" 已解决',
            },
            defaultValue: 'status',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'status',
              },
            },
          },
          {
            name: 'emptyText',
            title: {
              label: '无警告文案',
              tip: '警告列表为空时展示的文案，默认"正常"',
            },
            defaultValue: '正常',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: '正常',
              },
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
            defaultValue: 400,
            setter: {
              componentName: 'NumberSetter',
              props: {
                defaultValue: 400,
              },
            },
          },
          {
            name: 'height',
            title: '高度',
            defaultValue: 200,
            setter: {
              componentName: 'NumberSetter',
              props: {
                defaultValue: 200,
              },
            },
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
        ruleNameField: 'ruleName',
        levelNameField: 'levelName',
        levelColorField: 'levelColor',
        alarmTimeField: 'alarmTime',
        statusField: 'status',
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
