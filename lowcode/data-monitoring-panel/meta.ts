import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';
import { DEFAULT_DATA_MONITORING_PANEL_TEST_DATA } from '../../src/components/data-monitoring-panel/test-data';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');
const defaultData = DEFAULT_DATA_MONITORING_PANEL_TEST_DATA;

const DataMonitoringPanelMeta: ComponentMetadata = {
  componentName: 'DataMonitoringPanel',
  title: '数据监测-滚动面板',
  category: '状态组件',
  group: '图表库',
  docUrl: '',
  screenshot: '',
  devMode: 'proCode',
  npm: {
    package: 'my-cc-charts',
    version: '0.1.0',
    exportName: 'DataMonitoringPanel',
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
              label: '监测卡片列表',
              tip: '数组项包含 baseInfo、runtimeParameters、tritiumConcentration 三段数据，默认提供 12 条测试数据',
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
            name: 'cardGap',
            title: '卡片间距',
            setter: 'NumberSetter',
          },
          {
            name: 'headerHeight',
            title: '头部高度',
            setter: 'NumberSetter',
          },
          {
            name: 'infoHeight',
            title: '指标高度',
            setter: 'NumberSetter',
          },
          {
            name: 'chartHeight',
            title: '图表高度',
            setter: 'NumberSetter',
          },
          {
            name: 'showXAxisLabels',
            title: '显示横轴标签',
            defaultValue: true,
            setter: 'BoolSetter',
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
            name: 'showScrollbar',
            title: '显示滚动条',
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
          label: '滚动配置',
        },
        items: [
          {
            name: 'autoScroll',
            title: '自动滚动',
            defaultValue: true,
            setter: 'BoolSetter',
          },
          {
            name: 'scrollDuration',
            title: '滚动时长',
            defaultValue: 50,
            setter: 'NumberSetter',
          },
          {
            name: 'pauseOnHover',
            title: '悬停暂停',
            defaultValue: true,
            setter: 'BoolSetter',
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
            name: 'onCardClick',
            title: {
              label: '点击卡片',
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
    title: '数据监测-滚动面板',
    screenshot: '',
    schema: {
      componentName: 'DataMonitoringPanel',
      props: {
        ...ChartSnippet,
        data: defaultData,
        width: 400,
        height: 640,
        cardGap: 16,
        headerHeight: 78,
        infoHeight: 60,
        chartHeight: 120,
        showXAxisLabels: true,
        showLatestValue: true,
        autoScroll: true,
        scrollDuration: 50,
        pauseOnHover: true,
        showScrollbar: true,
      },
    },
  },
];

export default {
  ...DataMonitoringPanelMeta,
  snippets,
};
