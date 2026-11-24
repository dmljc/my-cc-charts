import {LabelProjection} from './Projection';
import {LabelFrame} from '../../utils/render/src/labels/LabelFrame';
import {LabelViewport} from '../../utils/render/src/labels/LabelViewport';

/** Keep the actual designer DOM selectable while placing it over the 3D point. */
export class DesignLabelProjection {
  private projection: LabelProjection;
  private version = 0;
  private cameraVersion = -1;
  private width = 0;
  private height = 0;
  constructor(private viewport: LabelViewport, private element: HTMLElement) {
    this.projection = new LabelProjection([], new Map(), element);
  }
  get targetIds() {return this.projection.targetIds;}
  reconcile(items, _elements, width, height) {
    return this.projection.reconcile(items, new Map(items.map(item => [item.id, this.element])), width, height);
  }
  updateFrame(frame: LabelFrame) {
    if (!frame.active) return this.projection.updateFrame(frame);
    const parent = this.element.offsetParent as HTMLElement;
    const surface = (this.viewport.webglRenderer as any).domElement || this.viewport.dom;
    const viewportRect = surface.getBoundingClientRect();
    const parentRect = parent?.getBoundingClientRect();
    const style = parent && parent.ownerDocument.defaultView.getComputedStyle(parent);
    const extra = (keys: string[]) => keys.reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0);
    // offsetHeight rounds fractional CSS sizes, which must not be mistaken for zoom.
    const cssWidth = style && parseFloat(style.width) + (style.boxSizing === 'border-box' ? 0 : extra(['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']));
    const cssHeight = style && parseFloat(style.height) + (style.boxSizing === 'border-box' ? 0 : extra(['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']));
    const parentWidth = cssWidth || parent?.offsetWidth, parentHeight = cssHeight || parent?.offsetHeight;
    const scaleX = parentWidth && parentRect.width ? parentRect.width / parentWidth : 1;
    const scaleY = parentHeight && parentRect.height ? parentRect.height / parentHeight : 1;
    const left = parent ? (viewportRect.left - parentRect.left) / scaleX - parent.clientLeft + parent.scrollLeft : viewportRect.left + this.element.ownerDocument.defaultView.scrollX;
    const top = parent ? (viewportRect.top - parentRect.top) / scaleY - parent.clientTop + parent.scrollTop : viewportRect.top + this.element.ownerDocument.defaultView.scrollY;
    const x = `${left}px`, y = `${top}px`;
    if (this.element.style.left !== x) this.element.style.left = x;
    if (this.element.style.top !== y) this.element.style.top = y;
    const width = viewportRect.width / scaleX, height = viewportRect.height / scaleY;
    if (this.cameraVersion !== frame.cameraVersion || this.width !== width || this.height !== height) this.version++;
    this.cameraVersion = frame.cameraVersion; this.width = width; this.height = height;
    return this.projection.updateFrame({...frame, width, height, cameraVersion: this.version});
  }
}
