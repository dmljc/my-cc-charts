import {createElement, PureComponent} from 'react';
import {EditorButton, EditorInput, EditorSelect} from './Controls';
import {SceneLabelArraySetter, sceneLabelEditorCss} from './EditorSetter';

const isExpression = (value: any) => value?.type === 'JSExpression';

/** Bind a card's scalar state without replacing the editable image rule array. */
export class SceneLabelBackgroundSetter extends PureComponent<any, {revision: number}> {
  static displayName = 'SceneLabelBackgroundSetter';
  state = {revision: 0};
  private fields: any[] = [];
  private get field() {return this.props.field || this.props.prop;}
  private get node() {return this.field?.node;}
  private get items() {
    const items = this.props.items ?? this.node?.getPropValue?.('items');
    return Array.isArray(items) ? items : [];
  }
  private get index() {
    const id = this.props.designItemId ?? this.node?.getPropValue?.('designItemId');
    const index = this.items.findIndex(item => item?.id === id);
    return index >= 0 ? index : this.items.findIndex(item => item?.id);
  }
  componentWillUnmount() {this.fields.reverse().forEach(field => field.purge?.());}
  private setStatus = (value: any) => {
    if (this.index < 0) return;
    this.node?.setPropValue?.(`items.${this.index}.value`, value);
    this.setState(state => ({revision: state.revision + 1}));
  };
  private bindStatus = () => {
    if (this.index < 0) return;
    const Setter = typeof window !== 'undefined' && (window as any).AliLowCodeEngine?.setters?.getSetter('VariableSetter')?.component;
    const root = this.field?.getProps?.()?.get?.('items');
    const item = root?.createField?.({name: String(this.index), setter: 'ObjectSetter'});
    const status = item?.createField?.({name: 'value', setter: 'StringSetter', supportVariable: true});
    if (item) this.fields.push(item);
    if (status) this.fields.push(status);
    if (Setter?.show && status) {Setter.show({prop: status}); return;}
    this.setStatus({type: 'JSExpression', value: ''});
  };
  private setRules = (value: any) => {
    // Raw setValue also lets older array expressions return to normal rule editing.
    if (this.field?.setValue) this.field.setValue(value); else this.props.onChange?.(value);
    this.setState(state => ({revision: state.revision + 1}));
  };
  render() {
    const current = this.items[this.index], status = current?.value;
    const rules = this.field?.getValue?.() ?? this.props.value;
    const expression = isExpression(status);
    return createElement('div', {className: 'scene-label-editor scene-label-background lc-block-setter'},
      createElement('style', {}, sceneLabelEditorCss),
      this.items.length > 1 ? createElement('label', {}, createElement('span', {}, '当前卡片'),
        createElement(EditorSelect, {'aria-label': '背景规则当前卡片', value: current?.id || '', onChange: event => {
          this.node?.setPropValue?.('designItemId', event.currentTarget.value);
          this.setState(state => ({revision: state.revision + 1}));
        }}, ...this.items.filter(Boolean).map(item => createElement('option', {key: item.id, value: item.id}, item.id)))) : null,
      createElement('label', {}, createElement('span', {}, '状态变量'),
        createElement(EditorInput, {'aria-label': '背景状态变量', disabled: !current,
          placeholder: '例如 this.state.room1', value: expression ? status.value || '' : '',
          onChange: event => this.setStatus({...(expression ? status : {}), type: 'JSExpression', value: event.currentTarget.value}),
        })),
      createElement('div', {className: 'scene-label-actions'},
        createElement(EditorButton, {disabled: !current, onClick: this.bindStatus}, '选择状态变量'),
        expression ? createElement(EditorButton, {onClick: () => this.setStatus(undefined)}, '清除状态绑定') : null),
      createElement('p', {className: 'scene-label-hint'}, current
        ? `作用于卡片 ${current.id}。根据此变量的值匹配下面的图片规则。`
        : '请先添加卡片；动态生成的卡片请在列表数据中配置各卡片的状态。'),
      current && !expression && status !== undefined ? createElement('p', {className: 'scene-label-hint'}, `当前固定状态：${String(status)}`) : null,
      current?.backgroundRules !== undefined ? createElement('p', {className: 'scene-label-hint'}, '当前卡片使用独立图片规则，请在卡片进阶设置中编辑；下方为通用规则。') : null,
      createElement('strong', {}, '图片匹配规则'),
      isExpression(rules) ? createElement('div', {},
        createElement('p', {className: 'scene-label-hint'}, '旧配置绑定了整套规则数组。可将此绑定改用作状态变量，并恢复逐条配置。'),
        createElement(EditorInput, {'aria-label': '旧版规则数组表达式', value: rules.value || '', onChange: event => this.setRules({...rules, value: event.currentTarget.value})}),
        createElement('div', {className: 'scene-label-actions', style: {marginTop: 8}},
          createElement(EditorButton, {disabled: !current, onClick: () => {
            this.setStatus({type: 'JSExpression', value: rules.value || ''});
            this.setRules(Array.isArray(rules.mock) ? rules.mock : []);
          }}, '用作状态变量并恢复规则'),
          createElement(EditorButton, {onClick: () => this.setRules(Array.isArray(rules.mock) ? rules.mock : [])}, '恢复逐条配置')))
        : createElement(SceneLabelArraySetter, this.props));
  }
}
