import {getPropByPath, request, token, WS, baseUri} from "../utils/util/request.js";
import { MAX_CHART_POINTS, sliceWindow } from "./perf";

const fetchData = async (uri: string, fecthId: string | number, payload: any) => {
  const url =  uri.replace(':id', fecthId?.toString()),
  body = {...payload, id: fecthId};
  // debugger
  return await request(url, 'POST', body);
};

const boardChannels = new Map<string, BroadcastChannel>();

const resolveBoardChannelKey = (props: any, root: string, subName: string) => (
  props?.componentId != null && props.componentId !== ''
    ? String(props.componentId)
    : `${root}.${subName}`
);

const closeBoardChannel = (key: string) => {
  const channel = boardChannels.get(key);

  if (channel) {
    channel.close();
    boardChannels.delete(key);
  }
};

// 根据数据类型，初始化数据源，包括从API获取数据、从广播通道获取数据、从WebSocket获取数据、静态数据
export async function init(props: any, bizRef: any, bc: BroadcastChannel) {
  const {dataType} = props;
  let count = 0;

  (window as any)?.GLWs?.deleteCallback(props?.componentId);
  if (dataType === 'fetch' && props?.fetch?.id) {
    try{
      const res = await fetchData(props.baseFetchUri, props?.fetch?.id, props?.fetch?.payload)
      if (res?.data) {
        bizRef.current?.chart?.changeData(res.data.data);
      }
    }catch (e){
      bizRef.current?.chart?.changeData(props.data.reverse());
    }

  } else if (dataType === 'board') {
    const [root, subName] = (props.boardId || 'root.subName').split('.');
    const channelKey = resolveBoardChannelKey(props, root || 'default', subName || 'subName');
    closeBoardChannel(channelKey);
    const channel = new BroadcastChannel(root || 'default');
    boardChannels.set(channelKey, channel);
    // 兼容旧签名：若调用方传入可写引用则同步挂上
    if (bc && typeof (bc as any) === 'object') {
      try {
        (bc as any).current = channel;
      } catch (e) {
        // ignore non-writable bc
      }
    }
    channel.onmessage = (e) => {
      if (e.data[subName]) {
        bizRef.current?.chart?.changeData(e.data[subName]);
      }
    };
  } else if (dataType === 'websocket') {
    const maxPoints = Number(props.ws?.maxPoints) > 0
      ? Number(props.ws.maxPoints)
      : MAX_CHART_POINTS;
    const options = {
      url: `${props.baseWsUri || baseUri()}?X-Tenant-Id=${props.token || window.localStorage.getItem('tenantId') || token}`,
      callbackId: props.componentId,
      callback: (data: any) => {
        let showData = data;
        if (props.ws?.rules) {
          showData = getPropByPath(data, props.ws.rules);
        }
        if (props.ws?.callbacks) {
          showData = props.ws.callbacks(showData);
        }
        if (props.ws?.isAdd && count > 0) {
          const preData = bizRef.current?.chart?.getData();
          const prevList = Array.isArray(preData) ? preData : [];
          const nextList = Array.isArray(showData) ? showData : [];
          showData = sliceWindow([...prevList, ...nextList], maxPoints);
        }
        bizRef.current?.chart?.changeData(showData);
        count++;
      },
    };
    if ((window as any).GLWs) {
      (window as any).GLWs.addCallback(options.callbackId, options.callback);
    } else {
      (window as any).GLWs = new WS(options);
    }
    if (props?.ws?.deviceId) {
      const initData: any = {
        tsSubCmds: [
          {
            entityType: 'DEVICE',
            entityId: props.ws?.deviceId,
            scope: 'LATEST_TELEMETRY',
            cmdId: 1,
          },
        ],
      };

      const initData1 = {
        "cmds": [{
          "type": "TIMESERIES",
          "entityType": "DEVICE",
          "entityId": props.ws?.deviceId,
          "scope": "LATEST_TELEMETRY",
          "cmdId": 2
        }]
      }
      setTimeout(() => {
        (window as any).GLWs.send(initData1);
      }, 1000);
    }
  }else if(dataType === 'excel' && props.dataExcel && props.dataExcel.length > 0) {
    console.log(props.dataExcel, 'props.dataExcel');
    bizRef.current?.chart?.changeData(props.dataExcel);
  } else if (props.data !== undefined && props.data !== null) {
    bizRef.current?.chart?.changeData(props.data);
  }
}

export function destroy(props: any, bc: BroadcastChannel) {
  if (props?.dataType === 'board') {
    const [root, subName] = (props.boardId || 'root.subName').split('.');
    closeBoardChannel(resolveBoardChannelKey(props, root || 'default', subName || 'subName'));
  }

  if (bc && typeof (bc as any).close === 'function') {
    try {
      bc.close();
    } catch (e) {
      // ignore
    }
  }

  if (bc && typeof bc === 'object' && 'current' in (bc as any)) {
    try {
      (bc as any).current?.close?.();
      (bc as any).current = null;
    } catch (e) {
      // ignore
    }
  }

  (window as any)?.GLWs?.deleteCallback(props.componentId);
}
