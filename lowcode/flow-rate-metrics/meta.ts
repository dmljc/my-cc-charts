import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = {
  averageSpeed: 187.3,
  maxSpeed: 321.5,
};

const FlowRateMetricsMeta: ComponentMetadata = {
  componentName: 'FlowRateMetrics',
  title: '流速指标',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'FlowRateMetrics',
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
              label: '流速数据',
              tip: '包含 averageSpeed、maxSpeed 字段',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'averageSpeedField',
            title: {
              label: '平均流速字段名',
              tip: '数据中平均流速对应的字段名，默认为 averageSpeed',
            },
            setter: 'StringSetter',
          },
          {
            name: 'maxSpeedField',
            title: {
              label: '最大流速字段名',
              tip: '数据中最大流速对应的字段名，默认为 maxSpeed',
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
            name: 'averageLabel',
            title: '平均流速标题',
            setter: 'StringSetter',
          },
          {
            name: 'averageSpeed',
            title: '平均流速',
            extraProps: {
              defaultValue: 187.3,
            },
            setter: {
              componentName: 'NumberSetter',
              props: {
                step: 0.01,
              },
            },
          },
          {
            name: 'maxLabel',
            title: '最大流速标题',
            setter: 'StringSetter',
          },
          {
            name: 'maxSpeed',
            title: '最大流速',
            extraProps: {
              defaultValue: 321.5,
            },
            setter: {
              componentName: 'NumberSetter',
              props: {
                step: 0.01,
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
    ],
  },
};

const snippets: Snippet[] = [
  {
    title: '流速指标',
    screenshot: '',
    schema: {
      componentName: 'FlowRateMetrics',
      props: {
        ...ChartSnippet,
        data: defaultData,
        averageSpeed: 187.3,
        maxSpeed: 321.5,
        averageLabel: '平均流速',
        maxLabel: '最大流速',
        averageSpeedField: 'averageSpeed',
        maxSpeedField: 'maxSpeed',
        width: 400,
        height: 108,
      },
    },
  },
];

const hideFromLibrary = true;

export default {
  ...FlowRateMetricsMeta,
  snippets: hideFromLibrary ? [] : snippets,
};
