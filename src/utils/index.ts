import * as ObjUtils from './object';

export { ObjUtils };

/*
 * 数组转字符串
 */
export function arrayToString(ar, symbolChar) {
  let result = '';
  for (let i = 0; i < ar.length; i++) {
    result += ar[i] + symbolChar;
  }
  if (result != '') {
    result = result.substring(0, result.length - 1);
  }
  return result;
}

export function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive
}

function getCookie(name) {
  let arr;
  const reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`);
  if ((arr = document.cookie.match(reg))) {
    return unescape(arr[2]);
  } else {
    return null;
  }
}

export function getLanguage() {
  return getCookie('languageSet');
}

const loadMap = {};

export function loadScriptAndCss({ jses = [], csses = [] }, once) {
  const key = `${JSON.stringify(jses)}_${JSON.stringify(csses)}`;
  if (loadMap[key]) {
    return loadMap[key];
  }
  const promise = new Promise((resolve, reject) => {
    const head = document.getElementsByTagName('head')[0];
    csses
      // .filter(url => !document.querySelector(`link[href="${url}"]`))
      .forEach((url) => {
        const ref = document.createElement('link');
        ref.rel = 'stylesheet';
        ref.type = 'text/css';
        ref.href = url;
        head.appendChild(ref);
      });
    // jses = jses.filter(url => !document.querySelector(`script[src="${url}"]`));
    // 没有loadMap[key] 的情况指的是资源没通过现函数加载，并且已经存在
    // if (!jses.length && !loadMap[key]) {
    //   resolve(true);
    // }
    jses.forEach((url, index, array) => {
      const ref = document.createElement('script');
      ref.type = 'text/javascript';
      ref.src = url;
      ref.async = false;
      if (index === array.length - 1) {
        ref.onload = () => {
          resolve(true);
        };
      }
      document.body.appendChild(ref);
    });
  });
  loadMap[key] = promise;
  return promise;
}

// 快速id生成器
function gid(len) {
  // 随机ID生成
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  const uuid = [];
  let i;
  const radix = chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    // rfc4122, version 4 form
    let r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return uuid.join('');
}

// 随机ID生成
export function getId() {
  return gid(8);
}

// 为日期添加格式化功能
Date.prototype.format = function (fmt) {
  // author: meizz
  const o = {
    'M+': this.getMonth() + 1, // 月份
    'd+': this.getDate(), // 日
    'h+': this.getHours(), // 小时
    'm+': this.getMinutes(), // 分
    's+': this.getSeconds(), // 秒
    'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
    S: this.getMilliseconds(), // 毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, `${this.getFullYear()}`.substr(4 - RegExp.$1.length));
  for (const k in o)
    if (new RegExp(`(${k})`).test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length),
      );
  return fmt;
};

// 深度克隆
export function clone(obj) {
  let result = obj;
  if (obj != null && typeof obj === 'object') {
    result = JSON.parse(JSON.stringify(obj));
  }
  return result;
}

export function measureText(text, style) {
  let lDiv = document.getElementById('measureTextFake');
  if (!lDiv) {
    lDiv = document.createElement('div');
    lDiv.id = 'measureTextFake';
    document.body.appendChild(lDiv);
  }

  if (style != null) {
    lDiv.style.fontSize = style.fontSize;
    lDiv.style.fontFamily = style.fontFamily;
  }
  lDiv.style.position = 'absolute';
  lDiv.style.left = '-1000px';
  lDiv.style.top = '-100px';
  lDiv.style.padding = '0 3px';
  lDiv.style.visibility = 'hidden';

  lDiv.innerHTML = text;

  const lResult = {
    width: lDiv.clientWidth,
    height: lDiv.clientHeight,
  };

  return lResult;
}

// 提取url参数
export function getUrlParam(name) {
  return (
    decodeURIComponent(
      (new RegExp(`[?|&]${name}=([^&;]+?)(&|#|;|$)`, 'i').exec(location.search) || [
        undefined,
        '',
      ])[1].replace(/\+/g, '%20'),
    ) || null
  );
}

export const getByPath = (obj, path = '') => {
  path = path.replace(/\[(\S+?)]/g, '.$1');
  return path.split('.').reduce((p, c) => p && p[c], obj);
};

export const setByPath = (obj, path = '', value) => {
  path = path.replace(/\[(\S+?)]/g, '.$1');
  return path.split('.').reduce((p, c, i, arr) => {
    if (i === arr.length - 1 && p) {
      p[c] = value;
      return obj;
    }
    return p && p[c];
  }, obj);
};

export function transferProps(props, keys) {
  const out = {};
  keys &&
    keys.forEach((key) => {
      out[key] = props[key];
    });
  return out;
}

export function isEditorEnv(props) {
  const { __designMode } = props;
  return __designMode === 'design';
}

// 数组去重
export function uniqueArray(arr) {
  return arr.filter((item, index, arr) => {
    // 当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
    return arr.indexOf(item, 0) === index;
  });
}

export function getContentParentElement(ele: any, i = 0): any {
  if (!ele || i > 100) {
    return;
  }
  i++;
  if (ele.parentElement && ele.clientHeight <= ele.parentElement.clientHeight) {
    return getContentParentElement(ele.parentElement, i);
  }
  return ele;
}


// 计算趋势线
export function calculateTrendline(data: any[], x: string, y: string) {
  // 线性回归计算
  const xSum = data.reduce((acc, curr) => acc + curr[x], 0);
  const ySum = data.reduce((acc, curr) => acc + curr[y], 0);
  const xySum = data.reduce((acc, curr) => acc + (curr[x] * curr[y]), 0);
  const xSquaredSum = data.reduce((acc, curr) => acc + (curr[x] * curr[x]), 0);
  const n = data.length;

  // 计算斜率 b1 和截距 b0
  const b1Numerator = (n * xySum) - (xSum * ySum);
  const b1Denominator = (n * xSquaredSum) - (xSum * xSum);
  const b1 = b1Numerator / b1Denominator;
  const b0 = (ySum - (b1 * xSum)) / n;

  // 计算趋势线数据
  const xMin = Math.min(...data.map(d => d[x]));
  const xMax = Math.max(...data.map(d => d[x]));
  const trendlineData = [
    [xMin, b0 + b1 * xMin],
    [xMax, b0 + b1 * xMax]
  ];

  return {
    // slope: b1,
    // intercept: b0,
    data: trendlineData
  };
}


// 计算多条线且有区分字段的平均值
export function calculateAvgSpreadScore(keywordTrend: any, xField: string, yField: string, lineType: string) {
  const keywordMap = new Map<string, { total: number; count: number }>();

  // 计算每个 keyword 的 first 值的总和和数量
  keywordTrend.forEach((item: any) => {
    // const { keyword, first } = item;
    if (keywordMap.has(item[lineType])) {
      const { total, count } = keywordMap.get(item[lineType])!;
      keywordMap.set(item[lineType], { total: total + item[yField], count: count + 1 });
    } else {
      keywordMap.set(item[lineType], { total: item[yField], count: 1 });
    }
  });

  // 计算每个 keyword 的 first 值的平均值，并生成 avgSpreadScore 数组
  const avgSpreadScore: { key: string; value: number; checked: boolean; startDate: string; endDate: string }[] = [];
  keywordMap.forEach((value, key) => {
    const { total, count } = value;
    const avgValue = total / count;
    avgSpreadScore.push({
      key,
      value: avgValue,
      checked: true,
      startDate: keywordTrend[0][xField], // 假设 startDate 是 keywordTrend 数组的第一个元素的 dates
      endDate: keywordTrend[keywordTrend.length - 1][xField], // 假设 endDate 是 keywordTrend 数组的最后一个元素的 dates
    });
  });
  // console.log(avgSpreadScore, 'avgSpreadScore');
  
  return avgSpreadScore;
}

// // 示例用法
// const keywordTrend = [
//   { keyword: "白超", dates: "1971-01-03 00:39:29", first: 2647 },
//   { keyword: "白超", dates: "1985-07-22 13:57:24", first: 2156 },
//   { keyword: "白超", dates: "1994-10-10 19:40:08", first: 2166 },
//   { keyword: "白超", dates: "1976-08-25 20:59:11", first: 2956 },
//   { keyword: "白超", dates: "2000-08-17 18:06:55", first: 2771 },
//   { keyword: "谭艳", dates: "1971-01-03 00:39:29", first: 2302 },
//   { keyword: "谭艳", dates: "1985-07-22 13:57:24", first: 2709 },
//   { keyword: "谭艳", dates: "1994-10-10 19:40:08", first: 2202 },
//   { keyword: "谭艳", dates: "1976-08-25 20:59:11", first: 2867 },
//   { keyword: "谭艳", dates: "2000-08-17 18:06:55", first: 2149 },
//   { keyword: "王二", dates: "2000-08-17 18:06:55", first: 3322 },
//   { keyword: "王二", dates: "2000-08-14 18:06:55", first: 3464 },
//   { keyword: "王二", dates: "2000-08-15 18:06:55", first: 4545 },
//   { keyword: "王二", dates: "2000-08-16 18:06:55", first: 6666 },
// ];

// const avgSpreadScore = calculateAvgSpreadScore(keywordTrend);
// console.log(avgSpreadScore);
