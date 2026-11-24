import {CSSProperties} from 'react';

export type LabelStateValue = string | number | boolean | null;

export interface LabelBackgroundRule {
  value: LabelStateValue;
  image: string;
}

export interface SceneLabelText {
  id?: string;
  /** Fixed text, a resolved page state expression, or a field from the label's data. */
  text?: string | number | boolean | null;
  field?: string;
  prefix?: string;
  /** Display unit or other trailing text, e.g. ℃, kPa, %. */
  suffix?: string;
  x?: number;
  y?: number;
  width?: number;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface SceneLabelItem {
  id: string;
  /** UUID of a model/anchor. Omit for a fixed world position. */
  target?: string;
  /** Optional scene UUID, particularly useful for fixed world positions. */
  sceneId?: string;
  /** Local coordinates when target is set; world coordinates otherwise. */
  position?: [number, number, number];
  dataKey?: string;
  stateField?: string;
  value?: LabelStateValue;
  image?: string;
  /** A resolved backend CSS color; no state-to-image rules are required. */
  color?: string;
  /** Transparent PNG/SVG silhouette tinted by color. */
  maskImage?: string;
  backgroundRules?: LabelBackgroundRule[];
  texts?: SceneLabelText[];
  /** Stack text rows automatically; omitted values retain legacy free positioning. */
  textLayout?: 'stack' | 'free';
  /** Stack cards fit their content unless explicitly set to false. */
  autoHeight?: boolean;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
  centerX?: number;
  centerY?: number;
  visible?: boolean;
}

export interface SceneLabelsProps {
  /** DevLoader.labelScope or its low-code component ID. Auto-selects a sole loader. */
  loaderId?: string;
  items?: SceneLabelItem[];
  /** Bind this property to page state, indexed by item.dataKey/id. */
  data?: Record<string, any>;
  stateField?: string;
  backgroundRules?: LabelBackgroundRule[];
  defaultImage?: string;
  color?: string;
  /** Fallback for direct-color labels without a usable color. Defaults to gray. */
  defaultColor?: string;
  maskImage?: string;
  width?: number;
  height?: number;
  visible?: boolean;
  /** Use component/item visibility to show or hide the bound native hotspots too. */
  syncHotspotVisibility?: boolean;
  zIndex?: number;
  /** Which label to inspect on the design canvas. Runtime still renders all labels. */
  designItemId?: string;
  /** Project the selected design card onto its 3D anchor instead of a layout sample. */
  designFollow?: boolean;
  onLabelClick?: (event: {id: string; value: any; data: any}) => void;
  /** Canvas placement. Its visual styles also apply to the label card. */
  style?: CSSProperties;
  /** Optional card appearance; placement is controlled by style / the 3D anchor. */
  cardStyle?: CSSProperties;
  className?: string;
  __designMode?: string;
}
