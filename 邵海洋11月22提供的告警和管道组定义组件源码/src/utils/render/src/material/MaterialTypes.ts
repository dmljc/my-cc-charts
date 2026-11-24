export type UvPair = [number, number];
export type MaterialWrap = 'repeat' | 'clamp' | 'mirrored-repeat';

export interface MaterialUvProperties {
  offset?: UvPair;
  repeat?: UvPair;
  rotation?: number;
  center?: UvPair;
  wrapS?: MaterialWrap;
  wrapT?: MaterialWrap;
  scroll?: {
    enabled?: boolean;
    speed?: UvPair;
    stopMode?: 'freeze' | 'reset';
  };
}

export interface MaterialProperties {
  color?: string | number;
  emissive?: string | number;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  depthWrite?: boolean;
  depthTest?: boolean;
  roughness?: number;
  metalness?: number;
  side?: 'front' | 'back' | 'double';
  uv?: MaterialUvProperties;
}

export interface SetMaterialCommand {
  targets: string[];
  materialIndex?: number;
  recursive?: boolean;
  properties?: MaterialProperties;
  /** 与 properties 互斥，恢复原材质引用并释放运行时覆盖。 */
  reset?: boolean;
}

export type SetMaterialInput = SetMaterialCommand | SetMaterialCommand[];
export type MaterialErrorCode = 'NOT_READY' | 'DESIGN_MODE' | 'INVALID_ARGUMENT' |
  'TARGET_NOT_FOUND' | 'NO_MATERIAL' | 'MATERIAL_INDEX_OUT_OF_RANGE' |
  'UNSUPPORTED_MATERIAL' | 'UNSUPPORTED_PROPERTY' | 'NO_UV' | 'NO_TEXTURE' |
  'UV_WRAP_REQUIRED' | 'OPERATION_FAILED';

export interface MaterialOperationError {
  commandIndex: number;
  target?: string;
  materialIndex?: number;
  code: MaterialErrorCode;
  message: string;
}

export interface SetMaterialResult {
  ok: boolean;
  applied: { commandIndex: number; target: string; materialIndex: number; action: 'set' | 'reset' }[];
  errors: MaterialOperationError[];
}

export function materialFailure(code: MaterialErrorCode, message: string): SetMaterialResult {
  return { ok: false, applied: [], errors: [{ commandIndex: -1, code, message }] };
}
