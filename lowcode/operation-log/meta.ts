import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_OPERATION_LOG_TEST_DATA } from '../../src/components/operation-log/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_OPERATION_LOG_TEST_DATA;

const OperationLogMeta: ComponentMetadata = {
  componentName: 'OperationLog',
  title: '操作日志',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'OperationLog',
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
              label: '操作日志数据',
              tip: '{ id, action, name, time }[]',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'actionField',
            title: {
              label: '操作内容字段名',
              tip: '操作内容对应的数据字段名，默认 action',
            },
            setter: 'StringSetter',
          },
          {
            name: 'nameField',
            title: {
              label: '操作人字段名',
              tip: '操作人对应的数据字段名，默认 name',
            },
            setter: 'StringSetter',
          },
          {
            name: 'timeField',
            title: {
              label: '操作时间字段名',
              tip: '操作时间对应的数据字段名，默认 time',
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
            defaultValue: 400,
            setter: 'NumberSetter',
          },
          {
            name: 'height',
            title: '高度',
            defaultValue: 200,
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
          label: '滚动配置',
        },
        items: [
          {
            name: 'scrollMode',
            title: '滚动模式',
            defaultValue: 'autoWithManual',
            setter: {
              componentName: 'SelectSetter',
              props: {
                options: [
                  { label: '自动滚动', value: 'auto' },
                  { label: '手动滚动', value: 'manual' },
                  { label: '自动滚动（可手动接管）', value: 'autoWithManual' },
                ],
              },
            },
          },
          {
            name: 'scrollDuration',
            title: '滚动时长',
            tip: '完成一轮滚动所需秒数，手动模式不生效',
            defaultValue: 60,
            setter: 'NumberSetter',
            condition: (target: any) => {
              const mode = target.getProps().getPropValue('scrollMode');
              return mode !== 'manual';
            },
          },
          {
            name: 'resumeDelay',
            title: '恢复自动滚动延迟',
            tip: '手动操作后恢复自动滚动的等待毫秒数',
            defaultValue: 1000,
            setter: 'NumberSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('scrollMode') === 'autoWithManual';
            },
          },
          {
            name: 'pauseOnHover',
            title: '悬停暂停',
            defaultValue: true,
            setter: 'BoolSetter',
            condition: (target: any) => {
              const mode = target.getProps().getPropValue('scrollMode');
              return mode !== 'manual';
            },
          },
          {
            name: 'showScrollbar',
            title: '显示滚动条',
            defaultValue: true,
            setter: 'BoolSetter',
            condition: (target: any) => {
              const mode = target.getProps().getPropValue('scrollMode');
              return mode === 'manual' || mode === 'autoWithManual';
            },
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
            name: 'onRowClick',
            title: {
              label: '点击行',
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
    title: '操作日志',
    screenshot: '',
    schema: {
      componentName: 'OperationLog',
      props: {
        ...ChartSnippet,
        data: defaultData,
        actionField: 'action',
        nameField: 'name',
        timeField: 'time',
        width: 400,
        height: 200,
        scrollMode: 'autoWithManual',
        scrollDuration: 60,
        resumeDelay: 1000,
        pauseOnHover: true,
        showScrollbar: true,
      },
    },
  },
];

export default {
  ...OperationLogMeta,
  snippets,
};
