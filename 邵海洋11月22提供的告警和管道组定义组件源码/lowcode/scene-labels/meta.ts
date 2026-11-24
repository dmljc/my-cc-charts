import {ComponentMetadata} from '@alilc/lowcode-types';
import {exampleLabelData, exampleLabelItems, exampleLabelRules} from '../../src/components/scene-labels/presets';
import {SceneLabelPositionSetter} from './PositionSetter';
import {SceneLabelHotspotSetter, SceneLabelPlacementToolsSetter} from './PlacementSetter';
import {createLabel, SceneLabelArraySetter, SceneLabelEditorSetter, SceneLabelObjectSetter} from './EditorSetter';
import {SceneLabelBackgroundSetter} from './BackgroundSetter';
import {SceneLabelSizeSetter} from './SizeSetter';

const textSetter = (name: string, title: string, description?: string) => ({name, title, description, setter: 'StringSetter', supportVariable: true, className: 'scene-label-config-field'});
const numberSetter = (name: string, title: string, initialValue?: number) => ({name, title, setter: {componentName: 'NumberSetter', initialValue}, supportVariable: true, className: 'scene-label-config-field'});
const mixed = (setters: string[]) => ({componentName: 'MixedSetter', props: {setters: setters.map(componentName => ({componentName}))}});
const array = (items: any[], options: {columns?: {name: string; title: string}[]; initialValue?: any; descriptor?: string} = {}) => ({
  componentName: SceneLabelArraySetter, isDynamic: false, props: {
    columns: options.columns,
    itemSetter: {componentName: SceneLabelObjectSetter, isDynamic: false, initialValue: options.initialValue, props: {descriptor: options.descriptor, config: {items: items.map(item => ({...item, className: 'scene-label-config-field'}))}}},
  },
});
// Read these inside the engine's observer so both placement controls update together.
const placementContext = (field: any) => ({
  items: field.node?.getPropValue?.('items'),
  designItemId: field.node?.getPropValue?.('designItemId'),
  designFollow: field.node?.getPropValue?.('designFollow'),
});

const rules = () => array([
  {name: 'value', title: '匹配状态值', important: true, supportVariable: true, setter: mixed(['StringSetter', 'NumberSetter', 'BoolSetter', 'ExpressionSetter']), description: '数字和数字字符串自动匹配，例如 1 与 "1"。优先匹配类型完全一致的规则；false、空字符串和 0 保持独立。'},
  {...textSetter('image', '背景图片地址', '图片 URL 或 data URL；匹配规则的空地址表示不显示图片。'), important: true},
], {columns: [{name: 'value', title: '状态值'}, {name: 'image', title: '图片地址'}], initialValue: () => ({value: 0, image: ''})});
const backgroundRules = rules();
const texts = array([
  {...textSetter('text', '固定文案／绑定变量', '直接输入固定文案；使用变量绑定可读取 this.state 或编写文案表达式。显示结果为：前置文案 + 此项内容 + 单位／后缀。'), important: true},
  {...textSetter('suffix', '单位／后缀', '例如 ℃、kPa、%、台；需要间隔时在开头输入空格。'), important: true},
  textSetter('prefix', '前置文案', '例如 温度：、压力：；显示在文案或变量值之前。'),
  numberSetter('x', '左侧位置（px）', 12), numberSetter('y', '顶部位置（px）', 10),
  numberSetter('width', '文字宽度（px）'), numberSetter('fontSize', '字号', 14),
  {name: 'color', title: '文字颜色', setter: 'ColorSetter'},
  {name: 'align', title: '文字对齐', setter: {componentName: 'SelectSetter', props: {options: [{label: '左', value: 'left'}, {label: '中', value: 'center'}, {label: '右', value: 'right'}]}}},
  textSetter('id', '文字标识'),
  textSetter('field', '数据字段（兼容旧配置）', '仅在未配置固定文案或变量时使用，相对于该标注绑定的数据；新配置建议直接绑定变量。'),
], {
  columns: [{name: 'text', title: '固定文案／绑定变量'}, {name: 'suffix', title: '单位／后缀'}],
  initialValue: (field: any) => {
    const value = field.getValue();
    const positions = (Array.isArray(value) ? value : []).map((text, index) => Number.isFinite(text?.y) ? text.y : 10 + index * 24);
    return {text: '新文案', prefix: '', suffix: '', x: 12, y: positions.length ? Math.max(...positions) + 24 : 10, fontSize: 14};
  },
});

const labelItems = array([
  {...textSetter('id', '标注唯一 ID', '同一组件内不可重复，也用于查找实时数据。'), important: true},
  {name: 'texts', title: '文字内容', important: true, display: 'block', setter: texts, supportVariable: true, description: '每项是一段文字。列表可直接编辑固定文案／绑定变量和单位／后缀；点击行内编辑按钮可设置前置文案、文字位置与样式。'},
  {name: 'value', title: '换图状态', supportVariable: true, setter: mixed(['StringSetter', 'NumberSetter', 'BoolSetter', 'ExpressionSetter']), description: '在此绑定控制换图的页面状态，例如 this.state.room1。数字与数字字符串自动匹配，无需手动 Number() 转换。下方图片规则只配置各个状态对应的图片；文字绑定不影响换图。'},
  textSetter('image', '默认背景图片覆盖'),
  {name: 'color', title: '背景颜色覆盖', setter: 'ColorSetter', supportVariable: true, description: '直接绑定后端 color，无需配置状态值。'},
  textSetter('maskImage', '着色外形图片覆盖', '透明 PNG/SVG 的不透明部分填充背景颜色；未设置时使用组件外形，清空后使用矩形颜色底。'),
  {name: 'backgroundRules', title: '本标注状态背景', display: 'block', setter: rules(), description: '未设置时继承通用规则；配置后使用本标注规则，空数组表示禁用通用规则。'},
  textSetter('target', '锚点／模型 UUID', '可使用顶部热点选择自动填写，也可填写模型或独立锚点的 UUID；留空时使用世界坐标。'),
  textSetter('sceneId', '限定场景 UUID', '可选。世界坐标标注建议设置，避免切换场景后继续显示。'),
  {name: 'position', title: '锚点坐标／偏移', setter: {componentName: SceneLabelPositionSetter, isDynamic: false}, supportVariable: true, description: '分别调整 X、Y、Z；有模型 UUID 时是模型局部偏移，否则是世界坐标。设计态页面拖放位置不改变三维坐标。'},
  numberSetter('width', '标注宽度（px）'), numberSetter('height', '标注高度（px）'),
  numberSetter('offsetX', '屏幕水平偏移（px）', 0), numberSetter('offsetY', '屏幕垂直偏移（px）', 0),
  numberSetter('centerX', '水平锚点比例', 0.5), numberSetter('centerY', '垂直锚点比例', 1),
  {name: 'visible', title: '显示本标注', setter: 'BoolSetter', supportVariable: true, description: '每张卡片可独立绑定布尔条件，例如 this.state.sceneIndex === 1 && this.state.floor === 1。'},
  textSetter('dataKey', '数据键（兼容旧配置）', '默认与标注 ID 相同；按原始键查找，键中的点不会被拆分。'),
  textSetter('stateField', '状态字段覆盖（兼容旧配置）'),
], {
  columns: [{name: 'id', title: '标注 ID'}, {name: 'texts', title: '文字内容'}], descriptor: 'id',
  initialValue: (field: any) => {
    const value = field.getValue();
    return createLabel(Array.isArray(value) ? value : []);
  },
});

const metadata: ComponentMetadata = {
  componentName: 'SceneLabels', title: '三维状态标注', devMode: 'proCode',
  group: '精选组件', category: '场景元素',
  npm: {package: 'cc-charts', version: '0.1.0', exportName: 'SceneLabels', main: 'src/index.tsx', destructuring: true, subName: ''},
  configure: {
    props: [
      {name: 'designFollow', title: '设计态跟随三维位置', setter: 'BoolSetter', supportVariable: false, description: '开启后设计态卡片也跟随三维锚点；移动位置请使用拾取按钮或调整 X/Y/Z。关闭后调试卡片样式与大小。'},
      {name: 'hotspotSelection', title: '热点选择', setter: {componentName: SceneLabelHotspotSetter, isDynamic: false, props: placementContext}, supportVariable: false, display: 'block', description: '仅列出当前场景的热点，可输入名称或 UUID 搜索。选择后底部中心对齐，可调整上方间距。'},
      {name: 'designPlacement', title: '三维位置调试', setter: {componentName: SceneLabelPlacementToolsSetter, isDynamic: false, props: placementContext}, supportVariable: false, display: 'block', description: '点击“在模型上拾取位置”，再点击三维视图的模型表面，即可调试新的三维位置。'},
      {name: 'labelSize', title: '标注尺寸', setter: {componentName: SceneLabelSizeSetter, isDynamic: false, props: field => ({...placementContext(field), style: field.node?.getPropValue?.('style'), width: field.node?.getPropValue?.('width'), height: field.node?.getPropValue?.('height')})}, supportVariable: false, display: 'block'},
      {name: 'color', title: '背景颜色／绑定 color', setter: 'ColorSetter', supportVariable: true, description: '绑定对应记录的 color；对象数组请先按 name 查找记录。交付页面可使用 this.getAlarmLabelColor(0, "X12")。颜色变化立即生效，无需状态规则；无有效颜色时使用默认颜色。'},
      {name: 'defaultColor', title: '默认颜色（未连接）', setter: {componentName: 'ColorSetter', initialValue: '#808080'}, supportVariable: true, description: '直接颜色模式未收到颜色或颜色无效时使用，默认灰色 #808080。可绑定页面 JS 变量；不影响旧版图片换图。需要透明时填写 transparent。'},
      textSetter('maskImage', '着色外形图片（透明 PNG）', 'PNG 的不透明区域填充上方颜色，透明区域保持透明；不填时使用矩形颜色底。普通背景图片仍在默认背景图片中配置。'),
      {name: 'items', title: '卡片内容', supportVariable: true, display: 'block', setter: {...labelItems, componentName: SceneLabelEditorSetter, props: field => ({...labelItems.props, ...placementContext(field)})}, description: '一张卡片绑定一个三维位置。直接编辑当前卡片的文字行、变量和单位；多张卡片通过选择框切换。'},
      textSetter('stateField', '默认状态字段', '默认 status。可以使用嵌套路径，例如 device.status。'),
      {name: 'backgroundRules', title: '状态背景图片规则', setter: {...backgroundRules, componentName: SceneLabelBackgroundSetter,
        props: field => ({...backgroundRules.props, ...placementContext(field)})}, supportVariable: false, display: 'block',
        description: '先选择状态变量（例如 this.state.room1），再逐条配置各个状态值对应的图片。绑定状态不会隐藏图片规则。'},
      textSetter('defaultImage', '默认背景图片', '状态无匹配规则时使用；单个标注可覆盖。'),
      numberSetter('width', '默认标注宽度（px）', 180), {...numberSetter('height', '默认固定高度（px）', 90), description: '仅用于固定高度或自由定位卡片；默认自动排列的卡片随文字内容收缩。'},
      {name: 'visible', title: '显示标注层', setter: 'BoolSetter', supportVariable: true, description: '直接绑定布尔条件，例如 this.state.sceneIndex === 1 && this.state.floor === 1。多张卡片分别配置条件时，此项保持开启，在各卡片的“显示本标注”中绑定。'},
      {name: 'syncHotspotVisibility', title: '同步控制绑定热点', setter: 'BoolSetter', supportVariable: false, description: '设计态、预览和发布均生效。开启后，用“显示标注层”或“显示本标注”绑定条件，即可同时隐藏绑定热点；不要使用高级条件渲染。只影响当前加载器，不修改三维工程。'},
      numberSetter('zIndex', '标注层级', 20),
      textSetter('designItemId', '设计态预览标注 ID', '多个标注时选择要调试的标注，留空显示第一个。仅切换设计态预览，不影响发布后的标注数量。'),
      {name: 'onLabelClick', title: '标注点击事件', setter: 'FunctionSetter', description: '参数为 {id,value,data}。不配置时鼠标操作穿透标注，仍可旋转场景。'},
    ].map(prop => ({...prop, className: 'scene-label-config-field'})),
    supports: {style: true},
    component: {isContainer: false},
  },
};

export default {
  ...metadata,
  snippets: [{title: '三维状态标注', schema: {componentName: 'SceneLabels', props: {
    items: exampleLabelItems, data: exampleLabelData, backgroundRules: exampleLabelRules,
    stateField: 'status', width: 180, height: 42, visible: true, defaultImage: exampleLabelRules[0].image,
    style: {position: 'absolute', left: 40, top: 40},
  }}}],
};
