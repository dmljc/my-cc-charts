import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_DATA_MONITORING_CARD_TEST_DATA } from '../../src/components/data-monitoring-card/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');
const defaultData = DEFAULT_DATA_MONITORING_CARD_TEST_DATA;

const DataMonitoringCardMeta: ComponentMetadata = {
  componentName: 'DataMonitoringCard',
  title: '数据监测-卡片',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DataMonitoringCard',
    main: 'src/index.tsx',
    destructuring: true,
    subName: '',
  },
  props: [
    {
      name: 'ref',
      propType: {
        type: 'oneOfType',
        value: ['object', 'func'],
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
              label: '卡片数据',
              tip: '包含 baseInfo、runtimeParameters、tritiumConcentration 三段数据；支持单卡对象或卡片数组',
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
            defaultValue: 400,
            setter: 'NumberSetter',
          },
          {
            name: 'height',
            title: '高度',
            defaultValue: 700,
            setter: 'NumberSetter',
          },
          {
            name: 'headerHeight',
            title: '头部高度',
            defaultValue: 78,
            setter: 'NumberSetter',
          },
          {
            name: 'infoHeight',
            title: '指标高度',
            defaultValue: 60,
            setter: 'NumberSetter',
          },
          {
            name: 'chartHeight',
            title: '图表高度',
            defaultValue: 150,
            setter: 'NumberSetter',
          },
          {
            name: 'cardGap',
            title: '卡片间距',
            defaultValue: 16,
            setter: 'NumberSetter',
          },
          {
            name: 'showLatestValue',
            title: {
              label: '显示末端数值',
              tip: '在折线图末端展示最新数值标注，默认 true',
            },
            defaultValue: true,
            setter: 'BoolSetter',
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
          label: '轮播配置',
        },
        items: [
          {
            name: 'devicesPerPage',
            title: {
              label: '每页设备数',
              tip: '每个轮播页面展示的设备数量，默认 2',
            },
            defaultValue: 2,
            setter: 'NumberSetter',
          },
          {
            name: 'carouselInterval',
            title: {
              label: '轮播间隔',
              tip: '每页停留时间，单位毫秒，默认 5000',
            },
            defaultValue: 5000,
            setter: 'NumberSetter',
          },
          {
            name: 'carouselTransitionDuration',
            title: {
              label: '切换动画时长',
              tip: '页面切换动画时长，单位毫秒，默认 400',
            },
            defaultValue: 400,
            setter: 'NumberSetter',
          },
          {
            name: 'carouselLoop',
            title: '循环轮播',
            defaultValue: true,
            setter: 'BoolSetter',
          },
          {
            name: 'pauseOnHover',
            title: '悬停暂停',
            defaultValue: true,
            setter: 'BoolSetter',
          },
        ],
      },
    ],
  },
};

const snippets: Snippet[] = [
  {
    title: '数据监测-卡片',
    screenshot: '',
    schema: {
      componentName: 'DataMonitoringCard',
      props: {
        ...ChartSnippet,
        data: defaultData,
        width: 400,
        height: 700,
        headerHeight: 78,
        infoHeight: 60,
        chartHeight: 150,
        cardGap: 16,
        devicesPerPage: 2,
        carouselInterval: 5000,
        carouselTransitionDuration: 400,
        carouselLoop: true,
        pauseOnHover: true,
        showLatestValue: true,
      },
    },
  },
];

export default {
  ...DataMonitoringCardMeta,
  snippets,
};
