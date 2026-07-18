import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface DataMonitoringHeaderData {
  [key: string]: unknown;
}

export interface DataMonitoringHeaderProps {
  data?: DataMonitoringHeaderData;
  /** 房间标签文案，默认 '房间' */
  roomLabel?: string;
  /** 设备标签文案，默认 '设备' */
  deviceLabel?: string;
  /** 房间值对应的数据字段名，默认 roomValue */
  roomValueField?: string;
  /** 设备值对应的数据字段名，默认 deviceValue */
  deviceValueField?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DataMonitoringHeaderData) => void;
  };
}

const DEFAULT_ROOM_LABEL = '房间';
const DEFAULT_DEVICE_LABEL = '设备';

const defaultData: DataMonitoringHeaderData = {
  roomValue: '101',
  deviceValue: '设备名称设备名称名称0253333',
};

const pickRootDomProps = (props: Record<string, unknown>) => {
  const domProps: Record<string, unknown> = {};

  Object.keys(props).forEach((key) => {
    if (
      key === 'id' ||
      key === 'role' ||
      key === 'tabIndex' ||
      key.indexOf('data-') === 0 ||
      key.indexOf('aria-') === 0
    ) {
      domProps[key] = props[key];
    }
  });

  return domProps;
};

const resolveFieldValue = (source: DataMonitoringHeaderData | undefined, field: string) => {
  const value = source?.[field];

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
};

const DataMonitoringHeader: React.FC<DataMonitoringHeaderProps> = function DataMonitoringHeader(props) {
  const {
    data,
    roomLabel = DEFAULT_ROOM_LABEL,
    deviceLabel = DEFAULT_DEVICE_LABEL,
    roomValueField = 'roomValue',
    deviceValueField = 'deviceValue',
    width = 400,
    height = 78,
    style = {},
    className = '',
    ...otherProps
  } = props;

  const resolveState = (source?: DataMonitoringHeaderData) => {
    const dataSource = source ?? defaultData;

    return {
      roomLabel,
      roomValue: resolveFieldValue(dataSource, roomValueField),
      deviceLabel,
      deviceValue: resolveFieldValue(dataSource, deviceValueField),
    };
  };

  const [state, setState] = useState(() => resolveState(data));
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    setState(resolveState(data));
  }, [data, roomLabel, deviceLabel, roomValueField, deviceValueField]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData) => {
          if (nextData) {
            setState(resolveState(nextData));
          }
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  return (
    <div
      className={`bizpack-data-monitoring-header ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-data-monitoring-header-item bizpack-data-monitoring-header-room">
        <span className="bizpack-data-monitoring-header-label">{state.roomLabel}</span>
        <span className="bizpack-data-monitoring-header-value">{state.roomValue}</span>
      </div>
      <div className="bizpack-data-monitoring-header-item bizpack-data-monitoring-header-device">
        <span className="bizpack-data-monitoring-header-label">{state.deviceLabel}</span>
        <span className="bizpack-data-monitoring-header-value bizpack-data-monitoring-header-value-wrap">
          {state.deviceValue}
        </span>
      </div>
    </div>
  );
};

DataMonitoringHeader.displayName = 'DataMonitoringHeader';
export default React.memo(DataMonitoringHeader);
