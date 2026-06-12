import {getPropByPath, request, token, WS, baseUri} from "../common/request.js";

const fetchData = async (uri: string, fecthId: string | number, payload: any) => {
  const url = uri.replace(':id', fecthId?.toString());
  return await request(url, 'POST', payload);
};

/**
 * 
 * @param props 
 * @param bizRef 
 * @param bc 
 */
export function fetchDataFun(props: any, bizRef: any, setData: any) {
  const {dataType} = props;
  let count = 0;
// debugger
  (window as any)?.GLWs?.deleteCallback(props?.componentId);
  if (dataType === 'fetch' && props?.fetch?.id) {
    fetchData(props.baseFetchUri, props?.fetch?.id, props?.fetch?.payload).then((res) => {
      if (res.data) {
        setData(res.data.data);
      }
    });
  } 
//   else if (dataType === 'board') {
//     const [root, subName] = (props.boardId || 'root.subName').split('.');
//     bc = new BroadcastChannel(root || 'default');
//     bc.onmessage = (e) => {
//       if (e.data[subName]) {
//         setData(e.data[subName]);
//       }
//     };
//   } 
  else if (dataType === 'websocket') {
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
          showData = [...preData, ...showData];
        }
        setData(showData);
        count++;
      },
    };
    if ((window as any).GLWs) {
      (window as any).GLWs.addCallback(options.callbackId, options.callback);
    } else {
      (window as any).GLWs = new WS(options);
    }
    if (props?.ws?.deviceId) {

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
  } else {
    // debugger
    setData(props.data);
  }
}