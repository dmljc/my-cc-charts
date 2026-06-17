import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = {
  switchMode: 'auto',
  switchModeText: '自动',
  abSwitchTime: 'auto',
  abSwitchTimeText: '自动',
  pumps: [
    { id: 'A', name: '真空泵A', mode: 'auto', modeText: '自动', runningHours: 12, selected: true },
    { id: 'B', name: '真空泵B', mode: 'auto', modeText: '自动', runningHours: 12 },
  ],
};

const PairedVacuumPumpStatusMeta: ComponentMetadata = {
  componentName: 'PairedVacuumPumpStatus',
  title: '成对真空泵状态',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'cc-charts',
    version: '0.1.0',
    exportName: 'PairedVacuumPumpStatus',
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
              label: '成对真空泵数据',
              tip: '包含 switchMode、abSwitchTime、pumps 等字段；pumps 中 runningHours 为运行小时数，mode 支持 auto/manual',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
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
            name: 'onSelect',
            title: {
              label: '选择真空泵',
              tip: '(item, index) => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onLocate',
            title: {
              label: '点击定位',
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
    title: '成对真空泵状态',
    screenshot: '',
    schema: {
      componentName: 'PairedVacuumPumpStatus',
      props: {
        ...ChartSnippet,
        data: defaultData,
        width: 400,
        height: 116,
      },
    },
  },
];

export default {
  ...PairedVacuumPumpStatusMeta,
  snippets,
};
