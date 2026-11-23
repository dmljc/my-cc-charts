import {Material, ShaderChunk, Vector2} from 'three';

type CompileCallback = Material['onBeforeCompile'];
type Shader = Parameters<CompileCallback>[0];
const wrappedCallbacks = new WeakMap<CompileCallback, {custom: boolean}>();
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const chunkPattern = /#include <(map_fragment|emissivemap_fragment|metalnessmap_fragment|roughnessmap_fragment|normal_fragment_maps|alphamap_fragment)>/g;
const samplePattern = /texture2D\(\s*(map|emissiveMap|metalnessMap|roughnessMap|normalMap|alphaMap)\s*,\s*(v\w*Uv)\s*\)/g;
const marker = '#define OV_MATERIAL_UV';

/** Only modify this material's shader. Shared Three.js chunks must remain self-contained. */
export function injectMaterialUv(material: Material, shader: Shader) {
  if ((material as any).isRawShaderMaterial) return;
  const mat = material as any;
  if (!mat.tilling) mat.tilling = new Vector2(1, 1);
  if (!mat.offset) mat.offset = new Vector2(0, 0);
  if (!mat.ovUvCenter) mat.ovUvCenter = new Vector2(0, 0);
  if (!mat.ovUvRotation) mat.ovUvRotation = {value: 0};

  if (!shader.fragmentShader.includes(marker)) {
    let changed = false;
    const fragment = shader.fragmentShader.replace(chunkPattern, (include, key) => {
      const chunk = ShaderChunk[key];
      const patched = chunk.replace(samplePattern, 'texture2D( $1, ovMaterialTransformUv( $2 ) )');
      if (patched === chunk) return include;
      changed = true;
      return patched;
    });
    if (!changed) return;
    // Namespaced uniforms coexist with callbacks from older editor versions.
    shader.fragmentShader = `${marker}
uniform vec2 ovUvRepeat;
uniform vec2 ovUvOffset;
uniform vec2 ovUvCenter;
uniform float ovUvRotation;
vec2 ovMaterialTransformUv(vec2 uv) {
  vec2 scaled = (uv - ovUvCenter) * ovUvRepeat;
  float c = cos(ovUvRotation);
  float s = sin(ovUvRotation);
  return vec2(c * scaled.x + s * scaled.y, -s * scaled.x + c * scaled.y) + ovUvCenter + ovUvOffset;
}
${fragment}`;
  }
  shader.uniforms.ovUvRepeat = {value: mat.tilling};
  shader.uniforms.ovUvOffset = {value: mat.offset};
  shader.uniforms.ovUvCenter = {value: mat.ovUvCenter};
  shader.uniforms.ovUvRotation = mat.ovUvRotation;
}

/** Also adapt inherited callbacks from a scene supplied by another Three.js instance. */
export function prepareMaterialUv(material: Material) {
  if (!material || (material as any).isRawShaderMaterial) return;
  const callback = material.onBeforeCompile;
  if (callback === Material.prototype.onBeforeCompile || wrappedCallbacks.has(callback)) return;
  const custom = own(material, 'onBeforeCompile');
  const cacheKey = material.customProgramCacheKey;
  const wrapped: CompileCallback = function (shader, renderer) {
    callback.call(this, shader, renderer);
    // Run after custom callbacks, which may replace the entire shader source.
    injectMaterialUv(this, shader);
  };
  wrappedCallbacks.set(wrapped, {custom});
  material.onBeforeCompile = wrapped;
  material.customProgramCacheKey = function () {
    return `${cacheKey.call(this)}|ov-material-uv-v2|${callback.toString()}`;
  };
  material.needsUpdate = true;
}

export function hasCustomMaterialCompile(material: Material) {
  const wrapped = wrappedCallbacks.get(material.onBeforeCompile);
  return wrapped ? wrapped.custom : own(material, 'onBeforeCompile');
}
