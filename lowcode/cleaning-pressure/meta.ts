import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultRow = {
  id: 1,
  name: '清洗阀T1',
  status: '运行',
  pressure: '13pa',
  duration: '300s',
};

const defaultData = {
  front: [
    defaultRow,
    { ...defaultRow, id: 2 },
  ],
  rear: [
    defaultRow,
    { ...defaultRow, id: 2 },
  ],
};

const CleaningPressureMeta: ComponentMetadata = {
  componentName: 'CleaningPressure',
  title: '清洗压力前/后端',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'CleaningPressure',
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
              label: '压力数据',
              tip: '{ front, rear } 各包含 { id, name, status, pressure, duration }[]',
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
              tip: '数据中状态对应的字段名，默认为 status',
            },
            setter: 'StringSetter',
          },
          {
            name: 'pressureField',
            title: {
              label: '压力字段名',
              tip: '数据中压力对应的字段名，默认为 pressure',
            },
            setter: 'StringSetter',
          },
          {
            name: 'durationField',
            title: {
              label: '时长字段名',
              tip: '数据中时长对应的字段名，默认为 duration',
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
            name: 'activeTab',
            title: '默认 Tab',
            setter: {
              componentName: 'SelectSetter',
              props: {
                options: [
                  { label: '清洗压力前端', value: 'front' },
                  { label: '清洗压力后端', value: 'rear' },
                ],
              },
            },
          },
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
            name: 'onTabChange',
            title: {
              label: 'Tab 切换',
              tip: '(tab) => void',
            },
            setter: 'FunctionSetter',
          },
          {
            name: 'onRowClick',
            title: {
              label: '行点击',
              tip: '(item, index, tab) => void',
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
    title: '清洗压力前/后端',
    screenshot: '',
    schema: {
      componentName: 'CleaningPressure',
      props: {
        ...ChartSnippet,
        activeTab: 'front',
        data: defaultData,
        nameField: 'name',
        statusField: 'status',
        pressureField: 'pressure',
        durationField: 'duration',
        width: 400,
        height: 108,
      },
    },
  },
];

export default {
  ...CleaningPressureMeta,
  snippets,
};
