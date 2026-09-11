// 设备详情
import DeviceDetails from './device-details';

export type {
  DeviceDetailsData,
  DeviceMetric,
  RoomTrendSeriesItem,
} from './interface';
export type { DeviceDetailsProps } from './device-details';
export {
  createDeviceDetailsTestData,
  DEFAULT_DEVICE_DETAILS_TEST_DATA,
} from './test-data';
export default DeviceDetails;
