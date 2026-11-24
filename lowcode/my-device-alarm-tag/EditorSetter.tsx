import {EditorButton, EditorInput, EditorSelect} from './Controls';
import {createElement, PureComponent} from 'react';
import {stackLabelHeight} from '../../src/components/my-device-alarm-tag/model';

export const sceneLabelEditorCss = `
.scene-label-editor{color:var(--color-text,inherit);font:inherit;font-size:12px;min-width:0;max-width:100%;box-sizing:border-box}
.scene-label-editor label{display:block;margin:8px 0;min-width:0}
.scene-label-editor label>span:first-child:not(.next-input):not(.next-select):not(.next-number-picker){display:block;margin-bottom:4px}
.scene-label-editor details{margin-top:8px;min-width:0}.scene-label-editor summary{cursor:pointer;color:inherit;padding:4px 0}
.scene-label-editor .scene-label-row{padding:8px 0;margin:8px 0;border:0;border-top:1px solid var(--color-line-normal,var(--color-line1-2,#dcdcdc));border-radius:0}
.scene-label-editor .scene-label-actions{display:flex;align-items:center;gap:4px;flex-wrap:wrap;min-width:0}
.scene-label-editor .scene-label-actions>strong{flex:1;min-width:0;overflow-wrap:anywhere;font-weight:500}
.scene-label-editor .scene-label-actions>.next-input{flex:1;min-width:0;width:0}
.scene-label-editor .scene-label-actions>.next-btn{flex-shrink:0}
.scene-label-editor .scene-label-hint{line-height:1.5;color:var(--color-text3,var(--color-text1-3,#999));margin:4px 0;overflow-wrap:anywhere}
.scene-label-editor .scene-label-editor-icon{width:14px;height:14px;vertical-align:middle;fill:none;stroke:#fff;stroke-width:1.8}
.scene-label-editor .next-icon,.scene-label-editor .lc-title-icon,.scene-label-editor .lc-setter-actions,
.scene-label-config-field .next-icon,.scene-label-config-field .lc-title-icon,.scene-label-config-field .lc-setter-actions{color:#fff!important}
.scene-label-editor svg:not(.scene-label-editor-icon),.scene-label-editor svg:not(.scene-label-editor-icon) use,.scene-label-editor svg:not(.scene-label-editor-icon) path,
.scene-label-config-field svg:not(.scene-label-editor-icon),.scene-label-config-field svg use,.scene-label-config-field svg:not(.scene-label-editor-icon) path{color:#fff!important;fill:#fff!important}
.scene-label-editor .next-icon svg,.scene-label-config-field .next-icon svg{filter:brightness(0) invert(1)}
.scene-label-array>.lc-setter-list>.lc-setter-list-scroll-body{margin:0;padding:0;max-height:none;overflow:visible}
.scene-label-array .lc-setter-list .lc-setter-list-card .lc-listitem{height:auto;min-height:28px;flex-direction:column;align-items:stretch;padding:8px 0;border-bottom:1px solid var(--color-line-normal,var(--color-line1-2,#dcdcdc))}
.scene-label-array .lc-setter-list .lc-setter-list-card .lc-listitem-body{display:block;width:100%;overflow:visible;min-width:0}
.scene-label-array .lc-listitem-body>.lc-field{display:block!important}
.scene-label-array .lc-listitem-body .lc-field>.lc-field-body{justify-content:flex-start;min-width:0}
.scene-label-array .lc-listitem-body .lc-block-field{display:block!important}
.scene-label-array .lc-listitem-body .lc-inline-field{margin:12px 0!important;align-items:center!important}
.scene-label-array .lc-setter-list .lc-setter-list-card .lc-listitem-actions{align-self:flex-end;margin:8px 0 0}
.scene-label-array .lc-listitem-actions>.next-btn{background:var(--btn-pure-normal-bg,transparent);border-color:var(--btn-pure-normal-border-color,currentColor);color:var(--btn-pure-normal-color,inherit)}
.scene-label-array .lc-listitem-actions>.next-btn:hover{background:var(--btn-pure-normal-bg-hover,transparent);border-color:var(--btn-pure-normal-border-color-hover,currentColor);color:var(--btn-pure-normal-color-hover,inherit)}
.scene-label-array .lc-field-head{flex-shrink:0}
.scene-label-array .lc-setter-mixed,.scene-label-array .lc-setter-object{min-width:0;max-width:100%;width:100%}
.scene-label-array .lc-listitem-body .lc-inline-field>.lc-field-body{width:auto;flex:1}
.scene-label-array .lc-setter-list .lc-setter-list-card .lc-listitem .lc-listitem-body .next-btn{width:auto;display:inline-flex}
`;

function engineSetters() {return typeof window !== 'undefined' ? (window as any).AliLowCodeEngine?.setters : null;}
function nativeSetter(name: string) {return engineSetters()?.getSetter(name)?.component;}
function icon(name: 'delete' | 'add' | 'bind') {
  const path = name === 'delete' ? 'M3 5h14M7 5V2h6v3M5 5l1 13h8l1-13M8 8v7M12 8v7' : name === 'add' ? 'M10 3v14M3 10h14' : 'M7 5H4v10h3M13 5h3v10h-3M11 3L9 17';
  return createElement('svg', {className: 'scene-label-editor-icon', viewBox: '0 0 20 20', 'aria-hidden': true}, createElement('path', {d: path}));
}
function shell(content: any, className = '') {return createElement('div', {className: `scene-label-editor lc-block-setter ${className}`}, createElement('style', {}, sceneLabelEditorCss), content);}
function bound(value: any) {return value?.type === 'JSExpression';}
function expressionHint(value: any, type: string) {
  return createElement('div', {className: 'scene-label-hint'}, `当前${type}由变量提供，变量须返回${type === '列表' ? '数组' : '对象'}。请通过变量修改内容。`,
    createElement('div', {}, createElement('code', {style: {whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}, value.value || '尚未填写表达式')));
}

/** Keep native forms inline, with theme controls and content-sized array rows. */
export class SceneLabelArraySetter extends PureComponent<any> {
  static displayName = 'SceneLabelArraySetter';
  render() {
    const value = (this.props.field || this.props.prop)?.getValue?.();
    if (bound(value)) return shell(expressionHint(value, '列表'), 'scene-label-array');
    const Setter = nativeSetter('ArraySetter');
    return shell(Setter ? createElement(Setter, {...this.props, forceInline: 0}) : '请在低代码编辑器中配置。', 'scene-label-array');
  }
}
export class SceneLabelObjectSetter extends PureComponent<any> {
  static displayName = 'SceneLabelObjectSetter';
  render() {
    const value = (this.props.field || this.props.prop)?.getValue?.();
    if (bound(value)) return shell(expressionHint(value, '配置'));
    const Setter = nativeSetter('ObjectSetter');
    return shell(Setter ? createElement(Setter, {...this.props, forceInline: 0}) : '请在低代码编辑器中配置。');
  }
}

export function createLabel(items: any[]) {
  const used = new Set(items.map(item => item?.id)); let index = 1;
  while (used.has(`label${index}`)) index++;
  return {id: `label${index}`, position: [0, 0, 0], textLayout: 'stack', autoHeight: true, texts: [{text: '新标注'}]};
}

/** Adding/removing rows opts older, unmarked cards into the simpler layout only after an edit. */
export function replaceTextRows(item: any, texts: any[]) {
  return {...item, texts, ...(item.textLayout !== 'free' ? {textLayout: 'stack', autoHeight: true} : {})};
}

export class SceneLabelEditorSetter extends PureComponent<any, {revision: number}> {
  static displayName = 'SceneLabelEditorSetter';
  state = {revision: 0};
  private fields: any[] = [];
  private fieldKey: string;
  private advancedField: any;
  private get field() {return this.props.field || this.props.prop;}
  private get node() {return this.field?.node;}
  private get items() {return Array.isArray(this.props.value) ? this.props.value.filter(Boolean) : [];}
  private get selected() {return this.items.find(item => item.id === this.node?.getPropValue?.('designItemId')) || this.items[0];}
  private disposeFields = () => {this.fields.reverse().forEach(field => field.purge?.()); this.fields = []; this.fieldKey = undefined; this.advancedField = undefined;};
  componentWillUnmount() {this.disposeFields();}
  private update = (items: any[], selectedId?: string) => {
    this.props.onChange?.(items);
    if (selectedId !== undefined) this.node?.setPropValue?.('designItemId', selectedId);
    this.setState(state => ({revision: state.revision + 1}));
  };
  private patch = (patch: object) => {
    const id = this.selected?.id;
    this.update(this.items.map(item => item.id === id ? {...item, ...patch} : item));
  };
  private rows = (texts: any[]) => {
    const current = this.selected;
    if (current) this.update(this.items.map(item => item.id === current.id ? replaceTextRows(item, texts) : item));
  };
  private text = (index: number, key: string, value: any) => {
    const texts = this.selected?.texts || [];
    this.patch({texts: texts.map((text, i) => i === index ? {...text, [key]: value} : text)});
  };
  private itemField() {
    const index = this.items.findIndex(item => item.id === this.selected?.id);
    const key = `${this.field?.id}:${index}:${this.selected?.id}:${this.selected?.textLayout}:${this.selected?.autoHeight}`;
    if (this.fieldKey !== key) {
      this.disposeFields(); this.fieldKey = key;
      this.advancedField = this.field?.createField?.({name: String(index), setter: 'ObjectSetter'});
      if (this.advancedField) this.fields.push(this.advancedField);
    }
    return this.advancedField;
  }
  private bind = (index: number, key: string) => {
    const Setter = nativeSetter('VariableSetter');
    if (Setter?.show) {
      let prop = this.itemField();
      for (const config of [{name: 'texts'}, {name: String(index)}, {name: key, setter: 'StringSetter', supportVariable: true}]) {
        prop = prop?.createField?.(config);
        if (prop) this.fields.push(prop);
      }
      if (prop) {Setter.show({prop}); return;}
    }
    this.text(index, key, {type: 'JSExpression', value: ''});
  };
  private input(index: number, key: string, title: string, value: any) {
    const expression = bound(value);
    return createElement('label', {key}, createElement('span', {}, title),
      createElement('div', {className: 'scene-label-actions'}, createElement(EditorInput, {
        'aria-label': `${title} ${index + 1}`, value: expression ? value.value || '' : value == null ? '' : String(value),
        placeholder: expression ? '例如 this.state.value' : '', style: {flex: 1},
        onChange: event => this.text(index, key, expression ? {...value, value: event.currentTarget.value} : event.currentTarget.value),
      }), createElement(EditorButton, {type: 'button', 'aria-label': `绑定${title}变量 ${index + 1}`, title: '选择页面变量', onClick: () => this.bind(index, key)}, icon('bind')),
      expression ? createElement(EditorButton, {type: 'button', onClick: () => this.text(index, key, '')}, '改为固定文字') : null),
      expression ? createElement('div', {className: 'scene-label-hint'}, '当前为变量表达式') : null);
  }
  render() {
    if (bound(this.field?.getValue?.())) return shell(createElement('p', {className: 'scene-label-hint'}, '当前卡片由列表表达式生成，请通过已绑定的表达式修改内容和位置。'));
    const current = this.selected, items = this.items;
    const texts = Array.isArray(current?.texts) ? current.texts : [];
    const ObjectSetter = nativeSetter('ObjectSetter');
    const advancedConfig = this.props.itemSetter?.props?.config;
    const advanced = advancedConfig && {items: advancedConfig.items.filter(item =>
      !['id', 'texts', 'value', 'textLayout', 'autoHeight'].includes(item.name) && !(item.name === 'height' && current?.textLayout === 'stack' && current.autoHeight !== false))};
    const advancedField = ObjectSetter && current ? this.itemField() : null;
    return shell(createElement('div', {},
      createElement('p', {className: 'scene-label-hint'}, '一张标注卡片对应一个三维位置；下面的文字行都显示在这张卡片上。'),
      createElement('div', {className: 'scene-label-actions'},
        items.length > 1 ? createElement(EditorSelect, {'aria-label': '当前标注', value: current?.id || '', style: {flex: 1}, onChange: event => {this.node?.setPropValue?.('designItemId', event.currentTarget.value); this.setState(state => ({revision: state.revision + 1}));}}, ...items.map(item => createElement('option', {key: item.id, value: item.id}, item.id))) : createElement('strong', {}, current ? `当前卡片：${current.id}` : '暂无标注'),
        createElement(EditorButton, {type: 'button', onClick: () => {const next = createLabel(items); this.update([...items, next], next.id);}}, icon('add'), ' 新增卡片'),
        current ? createElement(EditorButton, {type: 'button', 'aria-label': '删除当前卡片', title: '删除当前卡片', onClick: () => {const next = items.filter(item => item.id !== current.id); this.disposeFields(); this.update(next, next[0]?.id || '');}}, icon('delete')) : null),
      ...texts.map((text, index) => createElement('div', {className: 'scene-label-row', key: text?.id || index},
        createElement('div', {className: 'scene-label-actions'}, createElement('strong', {}, `文字第 ${index + 1} 行`), createElement(EditorButton, {type: 'button', 'aria-label': `删除文字行 ${index + 1}`, title: '删除这一行', onClick: () => {this.disposeFields(); this.rows(texts.filter((_, i) => i !== index));}}, icon('delete'))),
        this.input(index, 'text', '文案／变量值', text?.text),
        text?.text === undefined && text?.field ? createElement('div', {className: 'scene-label-hint'}, `当前读取旧配置的数据字段 ${text.field}；填写文案或绑定变量后覆盖。`) : null,
        createElement('div', {style: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}, this.input(index, 'prefix', '前置文字', text?.prefix), this.input(index, 'suffix', '单位', text?.suffix)),
        createElement('details', {}, createElement('summary', {}, '文字样式与位置'),
          createElement('label', {}, createElement('span', {}, '字号'), createElement(EditorInput, {type: 'number', min: 1, value: text?.fontSize || 14, onChange: event => {const value = Number(event.currentTarget.value); if (value > 0) this.text(index, 'fontSize', value);}})),
          createElement('label', {}, createElement('span', {}, '文字颜色'), createElement(EditorInput, {type: 'color', value: /^#[\da-f]{6}$/i.test(text?.color) ? text.color : '#ffffff', onChange: event => this.text(index, 'color', event.currentTarget.value)})),
          createElement('label', {}, createElement('span', {}, '对齐'), createElement(EditorSelect, {value: text?.align || 'left', onChange: event => this.text(index, 'align', event.currentTarget.value)}, ...['left', 'center', 'right'].map((value, i) => createElement('option', {key: value, value}, ['左', '中', '右'][i])))),
          current?.textLayout !== 'stack' ? createElement('div', {}, ...['x', 'y', 'width'].map(key => createElement('label', {key}, createElement('span', {}, {x: '左侧位置（px）', y: '顶部位置（px）', width: '文字宽度（px）'}[key]), createElement(EditorInput, {type: 'number', value: text?.[key] ?? '', onChange: event => {const value = Number(event.currentTarget.value); if (event.currentTarget.value !== '' && Number.isFinite(value)) this.text(index, key, value);}})))) : null))),
      current ? createElement(EditorButton, {type: 'button', onClick: () => this.rows([...texts, {text: '新文案'}])}, icon('add'), ' 添加文字行') : null,
      current ? createElement('details', {key: `advanced-${current.id}`}, createElement('summary', {}, '进阶设置（排版、图片、状态与位置）'),
        createElement('label', {}, createElement('span', {}, '卡片 ID'), createElement(EditorInput, {defaultValue: current.id, onBlur: event => {const id = event.currentTarget.value.trim(); if (!id || items.some(item => item !== current && item.id === id)) {event.currentTarget.value = current.id; return;} this.update(items.map(item => item.id === current.id ? {...item, id} : item), id);}})),
        createElement('label', {}, createElement('span', {}, '文字排版'), createElement(EditorSelect, {'aria-label': '文字排版', value: current.textLayout || 'legacy', onChange: event => {
          const textLayout = event.currentTarget.value;
          this.patch({textLayout, autoHeight: textLayout === 'stack', ...(textLayout === 'free' && current.textLayout === 'stack' ? {height: stackLabelHeight(current, undefined)} : {})});
        }}, current.textLayout ? null : createElement('option', {value: 'legacy'}, '原位置（旧配置）'), createElement('option', {value: 'stack'}, '自动排列（推荐）'), createElement('option', {value: 'free'}, '自由定位（保留原坐标）'))),
        current.textLayout === 'stack' ? createElement('label', {}, createElement('span', {}, '卡片高度'), createElement(EditorSelect, {'aria-label': '卡片高度', value: current.autoHeight === false ? 'fixed' : 'auto', onChange: event => this.patch({autoHeight: event.currentTarget.value === 'auto'})}, createElement('option', {value: 'auto'}, '随文字内容收缩'), createElement('option', {value: 'fixed'}, '固定高度（用于固定尺寸图片）'))) : null,
        ObjectSetter && advanced && advancedField ? createElement('div', {className: 'scene-label-config-field', key: advancedField.id}, createElement(ObjectSetter, {field: advancedField, prop: advancedField, value: current, config: advanced, forceInline: 0})) : null) : null));
  }
}
