import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_WARNING_STATISTICS_TEST_DATA } from '../../src/components/warning-statistics/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = DEFAULT_WARNING_STATISTICS_TEST_DATA;

const WarningStatisticsMeta: ComponentMetadata = {
  componentName: 'WarningStatistics',
  title: '警告统计',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'WarningStatistics',
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
              label: '警告统计数据',
              tip: '支持 alarmStats: { total, levels: [{ levelName, count, levelColor }] }，或直接传内层字段；未传 levelColor 时按序使用调色板；total 不传则对 levels 求和',
            },
            setter: 'JsonSetter',
            condition: (target: any) => {
              return target.getProps().getPropValue('dataType') === 'data';
            },
          },
          {
            name: 'listField',
            title: {
              label: '等级列表字段名',
              tip: '分类列表字段，默认为 levels',
            },
            defaultValue: 'levels',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'levels',
              },
            },
          },
          {
            name: 'nameField',
            title: {
              label: '名称字段名',
              tip: '分类名称字段，默认为 levelName',
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
            name: 'valueField',
            title: {
              label: '数量字段名',
              tip: '分类数量字段，默认为 count',
            },
            defaultValue: 'count',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'count',
              },
            },
          },
          {
            name: 'colorField',
            title: {
              label: '颜色字段名',
              tip: '扇区颜色字段，默认为 levelColor',
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
            name: 'totalField',
            title: {
              label: '总计字段名',
              tip: '总计数字段，默认为 total',
            },
            defaultValue: 'total',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: 'total',
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
            defaultValue: 90,
            setter: {
              componentName: 'NumberSetter',
              props: {
                defaultValue: 90,
              },
            },
          },
          {
            name: 'totalLabel',
            title: '总计文案',
            defaultValue: '总计',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: '总计',
              },
            },
          },
          {
            name: 'unit',
            title: '数量单位',
            defaultValue: '个',
            setter: {
              componentName: 'StringSetter',
              props: {
                defaultValue: '个',
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
              label: '点击分类',
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
    title: '警告统计',
    screenshot: '',
    schema: {
      componentName: 'WarningStatistics',
      props: {
        ...ChartSnippet,
        data: defaultData,
        listField: 'levels',
        nameField: 'levelName',
        valueField: 'count',
        colorField: 'levelColor',
        totalField: 'total',
        totalLabel: '总计',
        unit: '个',
        width: 376,
        height: 130,
      },
    },
  },
];

export default {
  ...WarningStatisticsMeta,
  snippets,
};
