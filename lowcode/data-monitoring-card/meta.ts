import { ComponentMetadata, Snippet } from 'lowcode-types';
import { DEFAULT_DATA_MONITORING_PANEL_TEST_DATA } from '../../src/components/data-monitoring-panel/test-data';

const defaultData = DEFAULT_DATA_MONITORING_PANEL_TEST_DATA;

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
          {
            name: 'data',
            title: {
              label: '卡片数据',
              tip: '包含 baseInfo、runtimeParameters、tritiumConcentration 三段数据',
            },
            setter: 'JsonSetter',
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
            defaultValue: 650,
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
            defaultValue: 120,
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
            defaultValue: 50,
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
        data: defaultData,
        width: 400,
        height: 650,
        headerHeight: 78,
        infoHeight: 60,
        chartHeight: 120,
        cardGap: 16,
        scrollMode: 'autoWithManual',
        scrollDuration: 50,
        resumeDelay: 1000,
        pauseOnHover: true,
        showScrollbar: true,
        showLatestValue: true,
      },
    },
  },
];

export default {
  ...DataMonitoringCardMeta,
  snippets,
};
