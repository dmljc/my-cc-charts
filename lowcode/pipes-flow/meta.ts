import {ComponentMetadata} from 'lowcode-types';
import {defaultPipeNames} from '../../src/components/pipes-flow/model';
import {PipeNamesSetter} from './NamesSetter';

const number = (name: string, title: string, initialValue: number, min?: number, max?: number) => ({name, title,
  setter: {componentName: 'NumberSetter', initialValue, props: {min, max}}, supportVariable: true});
const metadata: ComponentMetadata = {
  componentName: 'PipesFlow', title: '管道流动控制', group: '图表库', category: '场景元素', devMode: 'proCode',
  npm: {package: 'my-cc-charts', version: '0.1.0', exportName: 'PipesFlow', main: 'src/index.tsx', destructuring: true, subName: ''},
  configure: {
    props: [
      {name: 'names', title: '管道名称数组', display: 'block', supportVariable: false,
        setter: {componentName: PipeNamesSetter, isDynamic: false},
        description: '填写完整名称数组并点击应用，或从当前场景导入带贴图的模型。按名称精确匹配，重名会提示错误。'},
      {name: 'groupPrefix', title: '导入分组前缀', setter: {componentName: 'StringSetter', initialValue: 'QYguan'},
        description: '默认 QYguan，同时兼容 QYquan。导入分组内带贴图的模型，不导入纯金属管体。'},
      {name: 'data', title: '管道状态／绑定 state', supportVariable: true, setter: 'JsonSetter', display: 'block',
        description: '绑定 this.state.pipeFlowList。全量数据示例：{"guan1_Flow":1,"guan2_Flow":0}，或 [{name:"guan1_Flow",status:1}]。名单外或无法识别的状态会被丢掉。'},
      {name: 'replaceData', title: '按全量数据重算', setter: {componentName: 'BoolSetter', initialValue: true}, supportVariable: true,
        description: '开启时，这次数据里没出现的管道停止。关闭时，只更新这次出现的管道，其余保持上次状态。'},
      {name: 'enabled', title: '启用流动控制', setter: {componentName: 'BoolSetter', initialValue: true}, supportVariable: true,
        description: '关闭后恢复原材质并释放运行时缓存；普通启停请修改管道状态，会复用缓存并保留冻结位置。'},
      number('speedU', 'U 方向速度（UV/秒）', 0.2), number('speedV', 'V 方向速度（UV/秒）', 0),
      {name: 'stopMode', title: '停止时', setter: {componentName: 'SelectSetter', initialValue: 'freeze',
        props: {options: [{label: '停在当前位置', value: 'freeze'}, {label: '回到流动起点', value: 'reset'}]}}},
      {name: 'updateFps', title: '流动更新频率', setter: {componentName: 'SelectSetter', initialValue: 0,
        props: {options: [{label: '跟随场景（默认）', value: 0}, {label: '30 FPS（节能）', value: 30},
          {label: '15 FPS', value: 15}, {label: '60 FPS', value: 60}]}},
        description: '只限制贴图流动的更新频率，不改变相机和场景渲染。按经过时间累计，流动速度不变。'},
      {name: 'highlightEnabled', title: '流动时高亮', setter: {componentName: 'BoolSetter', initialValue: false}, supportVariable: true,
        description: '流动的管道同步高亮，停止后恢复原外观。默认关闭，复用流动材质，不增加描边渲染。'},
      {name: 'highlightColor', title: '高亮颜色', setter: {componentName: 'ColorSetter', initialValue: '#00e5ff'}, supportVariable: true},
      number('highlightIntensity', '高亮强度（0～10）', 1, 0, 10),
      {name: 'showDebugger', title: '显示调试面板', setter: {componentName: 'BoolSetter', initialValue: true},
        description: '预览中可编辑名称、导入当前场景、开关模拟和查看结果。关闭后组件不占页面空间。'},
      {name: 'simulationEnabled', title: '定时模拟 WS', setter: {componentName: 'BoolSetter', initialValue: false},
        description: '预览时每次随机选择一部分管道流动，其余停止；设计态仅配置，不修改三维编辑器共享场景。接入真实数据后关闭。'},
      number('simulationInterval', '模拟间隔（毫秒）', 2000, 250, 60000), number('simulationRatio', '模拟流动比例（0～1）', 0.5, 0, 1),
      {name: 'loaderId', title: '加载器标识（可选）', setter: 'StringSetter',
        description: '一个内置加载器时自动连接；多个时填写目标加载器的标注作用域 labelScope，或其组件 ID。'},
      {name: 'onStatusChange', title: '流动状态变化', setter: 'FunctionSetter', description: '参数包含 scene、running、waiting、errors。'},
    ],
    supports: {style: true}, component: {isContainer: false},
  },
};
export default {...metadata, snippets: [{title: '管道流动控制', schema: {componentName: 'PipesFlow', props: {
  names: defaultPipeNames, groupPrefix: 'QYguan', enabled: true, speedU: 0.2, speedV: 0,
  stopMode: 'freeze', updateFps: 0, highlightEnabled: false, highlightColor: '#00e5ff', highlightIntensity: 1,
  simulationEnabled: false, simulationInterval: 2000, simulationRatio: 0.5, showDebugger: true,
  style: {position: 'absolute', left: 20, top: 120, width: 330, zIndex: 20},
}}}]};
