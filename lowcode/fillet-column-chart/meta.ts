import { ComponentMetadata, Snippet } from 'lowcode-types';
import { actionConfigure } from '../common/chart-action';
import { ChartSnippet, ChartMetaIot } from "../common/iot";
import ChartTheme from '../setters/chartThemeRadio';
import { LegendPositionList, themeColor } from '../../src/utils/constants';

const FilletColumnChartMeta: ComponentMetadata = {
  componentName: 'FilletColumnChart',
  title: '圆角进度柱状图',
  category: '柱状/条形图',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: "my-cc-charts",
    version: "0.1.0",
    exportName: 'FilletColumnChart',
    main: "src/index.tsx",
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
      // 数据
      {
        name: 'data',
        type: 'group',
        display: 'accordion',
        title: {
          label: '数据',
        },
        items: [
          ...ChartMetaIot,
          {
            name: 'xField',
            title: {
              label: 'x轴字段名',
              tip: 'x 方向映射对应的数据字段名',
            },
            setter: 'StringSetter',
          },
          {
            name: 'yMax',
            title: {
              label: 'y-max',
              tip: 'y轴的最大值',
            },
            setter: 'NumberSetter',
          },
          {
            name: 'expected',
            title: {
              label: '目标值字段',
              tip: '期望的目标值',
            },
            setter: 'StringSetter',
          },
          {
            name: 'actual',
            title: {
              label: '实际值字段',
            },
            setter: 'StringSetter',
          },
        ],
      },
      // 图形属性
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
            name: 'legendPostion',
            title: '图例位置',
            setter: {
              componentName: 'SelectSetter',
              props: {
                options: LegendPositionList,
              },
            },
          },

          {
            name: 'themeSwitch',
            title: '配置主題',
            setter: 'BoolSetter',
            setValue: (target: any, value: any) => {
              if (!value) {
                target.getProps().setPropValue('color', '');
              }
            },
          },
          //   {
          //       name: 'color',
          //       title: '颜色',
          //       setter: {
          //           componentName: 'ArraySetter',
          //           props: {
          //               itemSetter: {
          //                   componentName: 'ColorSetter',
          //                 //   props: {
          //                 //       useFor: 'Next'
          //                 //   }
          //               },
          //           },
          //       },
          //       condition: (target: any) => {
          //           return !target.getProps().getPropValue('themeSwitch');
          //       }
          //   },
          {
            name: 'color',
            title: '颜色',
            setter: {
              componentName: 'ColorSetter',
            }
          },
          {
            name: 'theme',
            title: '主题',
            setter: {
              componentName: ChartTheme,
              props: {
                defaultValue: '',
                options: [
                  {
                    label: '亮色',
                    value: themeColor.light
                  },
                  {
                    label: '黑暗',
                    value: themeColor.dark
                  }],
                isSingle: true,
              },
            },
            condition: (target: any) => {
              return target.getProps().getPropValue('themeSwitch');
            },
          },
        ],
      },
    ].concat(actionConfigure),
  },
};

const snippets: Snippet[] = [
  {
    title: '圆角进度柱状图',
    screenshot:
      'https://fhgszg.space.czy3d.com/simu/static/icons/blue-green/3.png',
    schema: {
      componentName: 'FilletColumnChart',
      props: {
        data: [
          { date: '2017年3月2日', actual: 175, expected: 900 },
          { date: '2017年3月3日', actual: 137, expected: 900 },
          { date: '2017年3月4日', actual: 240, expected: 900 },
          { date: '2017年3月5日', actual: 726, expected: 900 },
          { date: '2017年3月6日', actual: 968, expected: 900 },
          { date: '2017年3月7日', actual: 702, expected: 900 },
          { date: '2017年3月8日', actual: 655, expected: 900 },
          { date: '2017年3月9日', actual: 463, expected: 900 },
          { date: '2017年3月10日', actual: 464, expected: 900 },
          { date: '2017年3月12日', actual: 0, expected: 900 },
          { date: '2017年3月13日', actual: 638, expected: 900 },
          { date: '2017年3月14日', actual: 0, expected: 900 },
          { date: '2017年3月15日', actual: 0, expected: 900 },
          { date: '2017年3月16日', actual: 509, expected: 900 },
        ],
        xField: 'date',
        expected: 'expected',
        yMax: 1000,
        actual: 'actual',
        legendPostion: 'top',
        themeSwitch: false,
        color: 'l (270) 0.00:rgba(255, 242, 242, 0.8) 1.00:rgba(42, 156, 255, 0.8)',
        ...ChartSnippet,
      },
    },
  },
  {
    title: '圆角进度柱状图-橙',
    screenshot:
      'https://fhgszg.space.czy3d.com/simu/static/icons/column-chart-icon-orange.png',
    schema: {
      componentName: 'FilletColumnChart',
      props: {
        data: [
          { date: '2017年3月2日', actual: 175, expected: 900 },
          { date: '2017年3月3日', actual: 137, expected: 900 },
          { date: '2017年3月4日', actual: 240, expected: 900 },
          { date: '2017年3月5日', actual: 726, expected: 900 },
          { date: '2017年3月6日', actual: 968, expected: 900 },
          { date: '2017年3月7日', actual: 702, expected: 900 },
          { date: '2017年3月8日', actual: 655, expected: 900 },
          { date: '2017年3月9日', actual: 463, expected: 900 },
          { date: '2017年3月10日', actual: 464, expected: 900 },
          { date: '2017年3月12日', actual: 0, expected: 900 },
          { date: '2017年3月13日', actual: 638, expected: 900 },
          { date: '2017年3月14日', actual: 0, expected: 900 },
          { date: '2017年3月15日', actual: 0, expected: 900 },
          { date: '2017年3月16日', actual: 509, expected: 900 },
        ],
        xField: 'date',
        expected: 'expected',
        yMax: 1000,
        actual: 'actual',
        legendPostion: 'top',
        themeSwitch: false,
        color: 'l (270) 0.00:rgba(255, 121, 84, 0.1) 1.00:rgba(255, 121, 84, 0.8)',
        ...ChartSnippet,
      },
    },
  },
];

const hideFromLibrary = false;

export default {
  ...FilletColumnChartMeta,
  snippets: hideFromLibrary ? [] : snippets,
};
