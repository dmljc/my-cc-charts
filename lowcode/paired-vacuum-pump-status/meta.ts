import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = {
  groups: [
    {
      switchMode: 'auto',
      switchModeText: '自动',
      abSwitchTime: 300,
      abSwitchTimeText: '300ms',
      pumps: [
        { id: 'A', name: '真空泵A', mode: 'auto', modeText: '自动', runningHours: 12, selected: true },
        { id: 'B', name: '真空泵B', mode: 'auto', modeText: '自动', runningHours: 12 },
      ],
    },
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
              tip: 'groups 数组，每项是一条完整数据：switchMode（切换模式，auto/manual）、abSwitchTime（切换时间，如 300→"300ms"）、pumps（成对的两个泵）',
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
              tip: '(item, index, groupIndex?: number) => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onLocate',
            title: {
              label: '点击定位',
              tip: '(item, index, groupIndex?: number) => void',
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
