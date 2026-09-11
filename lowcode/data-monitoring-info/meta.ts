import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = [
  { id: 1, value: '12', unit: 'm³/h', label: '流量' },
  { id: 2, value: '12', unit: 'm³/h', label: '流速' },
  { id: 3, value: '1.3', unit: 'pa', label: '压力' },
];

const DataMonitoringInfoMeta: ComponentMetadata = {
  componentName: 'DataMonitoringInfo',
  title: '数据监测-指标信息',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DataMonitoringInfo',
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
              label: '指标数据',
              tip: '静态预览数据，数组项字段名需与下方字段映射一致',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'valueField',
            title: {
              label: '数值字段名',
              tip: '数值对应的数据字段名，默认 value',
            },
            setter: 'StringSetter',
          },
          {
            name: 'unitField',
            title: {
              label: '单位字段名',
              tip: '单位对应的数据字段名，默认 unit',
            },
            setter: 'StringSetter',
          },
          {
            name: 'labelField',
            title: {
              label: '名称字段名',
              tip: '指标名称对应的数据字段名，默认 label',
            },
            setter: 'StringSetter',
          },
          {
            name: 'iconField',
            title: {
              label: '图标字段名',
              tip: '自定义图标地址对应的数据字段名，默认 icon；未配置时按指标名使用内置图标',
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
              label: '点击指标项',
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
    title: '数据监测-指标信息',
    screenshot: '',
    schema: {
      componentName: 'DataMonitoringInfo',
      props: {
        ...ChartSnippet,
        data: defaultData,
        valueField: 'value',
        unitField: 'unit',
        labelField: 'label',
        iconField: 'icon',
        width: 395,
        height: 110,
      },
    },
  },
];

export default {
  ...DataMonitoringInfoMeta,
  snippets,
};
