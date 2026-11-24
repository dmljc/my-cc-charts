import {LabelBackgroundRule, SceneLabelItem} from './types';

function background(color: string) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="42"><rect x="1" y="1" width="178" height="40" rx="8" fill="#082b3d" stroke="${color}" stroke-width="2"/></svg>`);
}

const exampleImages = new Set(['#44d5bc', '#ffb347', '#8b9dab'].flatMap(color => [
  background(color),
  // Older saved pages used the two-row demo card. It is also a replaceable placeholder.
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="90"><rect x="1" y="1" width="178" height="88" rx="8" fill="#082b3d" stroke="${color}" stroke-width="2"/><path d="M1 30h178" stroke="${color}" opacity=".6"/><circle cx="160" cy="16" r="4" fill="${color}"/></svg>`),
]));

export function isExampleLabelImage(image: string) {return exampleImages.has(image);}

export const exampleLabelRules: LabelBackgroundRule[] = [
  {value: 0, image: background('#44d5bc')},
  {value: 1, image: background('#ffb347')},
  {value: false, image: background('#8b9dab')},
];

export const exampleLabelItems: SceneLabelItem[] = [
  {id: 'label1', position: [0, 0, 0], textLayout: 'stack', autoHeight: true, texts: [{text: '示例标注'}]},
];

export const exampleLabelData = {
  label1: {status: 0},
  label2: {status: 1},
};
