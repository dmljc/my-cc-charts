/** 与后端 deviceTypes 一致：key 为名称，value 为数量 */
export type Left2DeviceTypesMap = Record<string, number | string>;

export interface Left2DeviceTypesPayload {
  deviceTypes: Left2DeviceTypesMap;
  [key: string]: unknown;
}

export const DEFAULT_LEFT2_TEST_DATA: Left2DeviceTypesMap = {
  'PLC 设备': 5,
  'QTC 设备': 4,
  测氚设备: 4254,
  测γ设备: 3180,
  测中子设备: 2866,
  测气设备: 5120,
  测水设备: 1942,
  测尘设备: 3675,
  测温设备: 2488,
  测压设备: 1730,
  测流设备: 4096,
  测湿设备: 2215,
};
