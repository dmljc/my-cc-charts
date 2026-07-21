import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = {
  roomValue: '101',
  deviceValue: '设备名称设备名称名称0253333',
};

const DataMonitoringHeaderMeta: ComponentMetadata = {
  componentName: 'DataMonitoringHeader',
  title: '数据监测-头部信息',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DataMonitoringHeader',
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
              label: '头部数据',
              tip: '静态预览数据，字段名需与下方字段映射一致',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'roomLabel',
            title: {
              label: '房间标签',
              tip: '房间标签文案，默认 房间：',
            },
            setter: 'StringSetter',
          },
          {
            name: 'roomValueField',
            title: {
              label: '房间值字段名',
              tip: '接口数据中房间值对应的字段名，默认 roomValue',
            },
            setter: 'StringSetter',
          },
          {
            name: 'deviceLabel',
            title: {
              label: '设备标签',
              tip: '设备标签文案，默认 设备：',
            },
            setter: 'StringSetter',
          },
          {
            name: 'deviceValueField',
            title: {
              label: '设备值字段名',
              tip: '接口数据中设备值对应的字段名，默认 deviceValue',
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
    ],
  },
};

const snippets: Snippet[] = [
  {
    title: '数据监测-头部信息',
    screenshot: '',
    schema: {
      componentName: 'DataMonitoringHeader',
      props: {
        ...ChartSnippet,
        data: defaultData,
        roomLabel: '房间：',
        deviceLabel: '设备：',
        roomValueField: 'roomValue',
        deviceValueField: 'deviceValue',
        width: 400,
        height: 78,
      },
    },
  },
];

export default {
  ...DataMonitoringHeaderMeta,
  snippets,
};
