import {Children, createElement} from 'react';
import {Button, Checkbox, Input, NumberPicker, Select} from '@alifd/next';

// Share the editor's Fusion controls and theme; retain native-like value callbacks for the setters.
const changeEvent = (value: any) => ({currentTarget: {value: value == null ? '' : String(value)}, target: {value: value == null ? '' : String(value)}});

export function EditorButton({children, type, ...props}: any) {
  return createElement(Button, {...props, size: 'small', type: type === 'primary' ? 'primary' : 'normal', htmlType: 'button'}, children);
}

export function EditorInput({type, onChange, style, step, value, ...props}: any) {
  if (type === 'checkbox') return createElement(Checkbox, {...props, onChange: checked => onChange?.({currentTarget: {checked}, target: {checked}})});
  if (type === 'number') return createElement(NumberPicker, {
    ...props, size: 'small', style: {width: '100%', minWidth: 0, ...style},
    value: typeof value === 'number' || typeof value === 'string' ? value : undefined,
    ref: control => {
      const ref = control?.getInputNode?.();
      const input = (ref?.getInputNode?.() || ref) as HTMLInputElement;
      if (props['aria-label']) input?.setAttribute?.('aria-label', props['aria-label']);
    },
    step: step === 'any' ? 0.01 : step, onChange: value => onChange?.(changeEvent(value)),
  });
  return createElement(Input, {...props, value, size: 'small', htmlType: type || 'text', style: {width: '100%', minWidth: 0, ...style}, onChange: value => onChange?.(changeEvent(value))});
}

export function EditorSelect({children, onChange, style, showSearch = false, ...props}: any) {
  const dataSource = Children.toArray(children).filter(Boolean).map((child: any) => ({value: child.props.value, label: child.props.children, disabled: child.props.disabled}));
  return createElement(Select, {...props, size: 'small', showSearch, hasClear: false, autoWidth: false,
    style: {width: '100%', minWidth: 0, ...style}, dataSource, onChange: value => onChange?.(changeEvent(value)),
  });
}
