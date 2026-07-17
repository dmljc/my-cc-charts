import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_DEVICE_CHECK_TEST_DATA } from '../../src/components/device-check/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_DEVICE_CHECK_TEST_DATA;

const DeviceCheckMeta: ComponentMetadata = {
  componentName: 'DeviceCheck',
  title: '设备定检',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DeviceCheck',
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
              label: '设备定检数据',
              tip: '与接口字段一致：deviceName、remainingDaysText、status；status 为文案如正常/即将到期/逾期',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'deviceNameField',
            title: {
              label: '设备名称字段名',
              tip: '数据中设备名称对应的字段名，默认为 deviceName',
            },
            defaultValue: 'deviceName',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'deviceName',
              },
            },
          },
          {
            name: 'remainingDaysTextField',
            title: {
              label: '天数文案字段名',
              tip: '数据中天数文案对应的字段名，默认为 remainingDaysText，如：剩余50天、延期3天',
            },
            defaultValue: 'remainingDaysText',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'remainingDaysText',
              },
            },
          },
          {
            name: 'statusField',
            title: {
              label: '状态字段名',
              tip: '数据中状态文案对应的字段名，默认为 status，如：正常、即将到期、逾期',
            },
            defaultValue: 'status',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'status',
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
              label: '点击设备',
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
    title: '设备定检',
    screenshot: '',
    schema: {
      componentName: 'DeviceCheck',
      props: {
        ...ChartSnippet,
        data: defaultData,
        deviceNameField: 'deviceName',
        remainingDaysTextField: 'remainingDaysText',
        statusField: 'status',
        width: 400,
        height: 200,
      },
    },
  },
];

export default {
  ...DeviceCheckMeta,
  snippets,
};
