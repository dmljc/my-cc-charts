import io from "./socket.io";

export const request = (
  dataAPI,
  method = 'GET',
  data,
  header,
  otherProps,
) => {
  const headers = {
    "Content-Type": "application/json;charset=UTF-8",
    "Accept-Encoding": "gzip, deflate, br",
    ...header
  }
  return new Promise((resolve, reject) => {
    if (otherProps && otherProps.timeout) {
      setTimeout(() => {
        reject(new Error('timeout'));
      }, otherProps.timeout);
    }
    const payload = {
      method,
      headers,
      ...otherProps,
    }
    if(method !== 'GET') {
      payload.body = JSON.stringify(data)
    }
    fetch(dataAPI, payload)
      .then((response) => {
        switch (response.status) {
          case 200:
          case 201:
          case 202:
            return response.json();
          case 204:
            if (method === 'DELETE') {
              return {
                success: true,
              };
            } else {
              return {
                __success: false,
                code: response.status,
              };
            }
          case 400:
          case 401:
          case 403:
          case 404:
          case 406:
          case 410:
          case 422:
          case 500:
            return response
              .json()
              .then((res) => {
                return {
                  __success: false,
                  code: response.status,
                  data: res,
                };
              })
              .catch(() => {
                return {
                  __success: false,
                  code: response.status,
                };
              });
          default:
            return null;
        }
      })
      .then((json) => {
        if (json && json.__success !== false) {
          resolve(json);
        } else {
          delete json.__success;
          reject(json);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export const getPropByPath = (obj, path) => {
  let tempObj = obj;
  let currentProp;
  const props = path.split('.');
  for (let i = 0, j = props.length; i < j; i++) {
    currentProp = props[i];
    tempObj = tempObj[currentProp];
    if (!tempObj) {
      break;
    }
  }
  return tempObj;
}

export class WS {
  constructor(options) {
    this.url = options.url;
    this.callbacks = {};
    this.opens = {};
    this.errors = {};
    this.closes = {};
    this.ws = new WebSocket(this.url);
    options.onopen && this.addOpen(options.callbackId, options.onopen);
    options.onerror && this.addError(options.callbackId, options.onerror);
    options.onclose && this.addClose(options.callbackId, options.onclose);
    options.callback && this.addCallback(options.callbackId, options.callback);
    // this.ws.onopen = () => {
    //   this.refreshMessage();
    // }
  }

  addCallback = (callbackId, callback) => {
    this.callbacks[callbackId] = callback;
    this.refreshMessage();
  }

  deleteCallback = (callbackId) => {
    if(!callbackId) return;
    delete this.callbacks[callbackId];
    this.refreshMessage();
  }

  addOpen = (callbackId, callback) => {
    this.opens[callbackId] = callback;
    this.refreshOpen();
  }
  deleteOpen = (callbackId) => {
    if(!callbackId) return;
    delete this.opens[callbackId];
    this.refreshOpen();
  }

  addError = (callbackId, callback) => {
    this.errors[callbackId] = callback;
    this.refreshError();
  }

  deleteError = (callbackId) => {
    if(!callbackId) return;
    delete this.errors[callbackId];
    this.refreshError();
  }

  addClose = (callbackId, callback) => {
    this.closes[callbackId] = callback;
    this.refreshClose();
  }

  deleteClose = (callbackId) => {
    if(!callbackId) return;
    delete this.closes[callbackId];
    this.refreshClose();
  }

  refreshMessage = () => {
    const callbacks = Object.values(this.callbacks);
    this.ws.onmessage = (event) => {
      if(callbacks.length === 0) {
        return;
      }
      const data = JSON.parse(event.data);
      callbacks.forEach((callback) => {
        callback(data);
      })
    }
  }

  refreshOpen = () => {
    const opens = Object.values(this.opens);
    this.ws.onopen = () => {
      if(opens.length === 0) {
        return;
      }
      opens.forEach((open) => {
        open();
      })
    }
  }

  refreshClose = () => {
    const closes = Object.values(this.closes);
    this.ws.onclose = () => {
      if(closes.length === 0) {
        return;
      }
      closes.forEach((close) => {
        close();
      })
    }
  }

  refreshError = () => {
    const errors = Object.values(this.errors);
    this.ws.onerror = (e) => {
      if(errors.length === 0) {
        return;
      }
      errors.forEach((error) => {
        error(e);
      })
    }
  }

  close = () => {
    this.ws.close();
  }

  getState = () => {
    const state = this.ws.readyState;
    const stateArray = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    return stateArray[state];
  }

  send = (data) => {
    this.ws.send(JSON.stringify(data));
  }

}

export class WSIO {
  constructor(options) {
    this.url = options.url;
    this.callbacks = {};
    this.opens = {};
    this.errors = {};
    this.closes = {};
    this.wsio = io(this.url,{
      transports: ['websocket']
    });
    options.onopen && this.addOpen(options.onopen);
    options.onerror && this.addError(options.onerror);
    options.onclose && this.addClose(options.onclose);
    options.callback && this.addCallback(options.callback);
    // this.wsio.onopen = () => {
    //   this.refreshMessage();
    // }
    this.wsio.on("connect", () => {
      console.log("✅ 成功连接 socket.io，socket.id:", this.wsio.id);
    });
    this.wsio.on("disconnect", () => {
      console.log("❌ 断开连接");
    });
    this.wsio.on("connect_error", (err) => {
      console.error("连接失败：", err.message);
    });
    // 监听其他可能的事件
    // this.wsio.on('chat', (data) => {
    //   console.log('📩 收到 chat:', data);
    // });

    // // 调试：监听所有事件
    // this.wsio.onevent = function (packet) {
    //   const [event, ...args] = packet.data;
    //   console.log('[调试] 收到事件:', event, args);
    // };
  }

  addCallback = (callbackId, callback) => {
    this.callbacks[callbackId] = callback;
    this.refreshMessage();
  }

  deleteCallback = (callbackId) => {
    if(!callbackId) return;
    // debugger
    delete this.callbacks[callbackId];
    this.refreshMessage();
  }

  addOpen = (callbackId, callback) => {
    this.opens[callbackId] = callback;
    this.refreshOpen();
  }
  deleteOpen = (callbackId) => {
    if(!callbackId) return;
    delete this.opens[callbackId];
    this.refreshOpen();
  }

  addError = (callbackId, callback) => {
    this.errors[callbackId] = callback;
    this.refreshError();
  }

  deleteError = (callbackId) => {
    if(!callbackId) return;
    delete this.errors[callbackId];
    this.refreshError();
  }

  addClose = (callbackId, callback) => {
    this.closes[callbackId] = callback;
    this.refreshClose();
  }

  deleteClose = (callbackId) => {
    if(!callbackId) return;
    delete this.closes[callbackId];
    this.refreshClose();
  }

  refreshMessage = () => {
    const callbacks = Object.values(this.callbacks);
    if (this._deviceValuesHandler) {
      this.wsio.off('device-values', this._deviceValuesHandler);
    }
    this._deviceValuesHandler = (event) => {
      if(callbacks.length === 0) {
        return;
      }
      const data = event;
      callbacks.forEach((callback) => {
        callback(data);
      })
    };
    this.wsio.on('device-values', this._deviceValuesHandler);
  }

  refreshOpen = () => {
    const opens = Object.values(this.opens);
    this.wsio.onopen = () => {
      if(opens.length === 0) {
        return;
      }
      opens.forEach((open) => {
        open();
      })
    }
  }

  refreshClose = () => {
    const closes = Object.values(this.closes);
    this.wsio.onclose = () => {
      if(closes.length === 0) {
        return;
      }
      closes.forEach((close) => {
        close();
      })
    }
  }

  refreshError = () => {
    const errors = Object.values(this.errors);
    this.wsio.onerror = (e) => {
      if(errors.length === 0) {
        return;
      }
      errors.forEach((error) => {
        error(e);
      })
    }
  }

  close = () => {
    this.wsio.disconnect(); // 主动断开连接
    console.log("连接已关闭");
  }

  getState = () => {
    const state = this.wsio.readyState;
    const stateArray = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    return stateArray[state];
  }

  send = (data) => {
    this.wsio.emit('send', JSON.stringify(data));
  }

}

export const token = `1e91aef0-5615-11ee-808b-e3209e697231`

export const baseUri = () => {
  const {host} = window.location
  return `wss://${host}/iot/open/api/ws`
}
