export interface OperationLogTestItem {
  id: number;
  action: string;
  name: string;
  time: string;
  [key: string]: unknown;
}

export const DEFAULT_OPERATION_LOG_TEST_DATA: OperationLogTestItem[] = [
  { id: 1, action: '电磁阀0101开启', name: '张伟', time: '08:23:15' },
  { id: 2, action: '电磁阀0102关闭电磁阀0102关闭', name: '李晓明', time: '09:47:32' },
  { id: 3, action: '电机M01启动', name: '欧阳雪晴', time: '10:05:08' },
  { id: 4, action: '温度传感器超限报警', name: '王勇', time: '11:12:44' },
  { id: 5, action: '电磁阀0201开启', name: '王思远', time: '12:30:21' },
  { id: 6, action: '压力泵停止', name: '慕容紫英', time: '13:15:57' },
  { id: 7, action: '电磁阀0103关闭', name: '刘洋', time: '14:42:03' },
  { id: 8, action: '风机启动', name: '陈志强', time: '15:28:19' },
  { id: 9, action: '液位低报警', name: '上官婉儿', time: '16:09:36' },
  { id: 10, action: '电磁阀0202开启', name: '陈静', time: '17:55:42' },
  { id: 11, action: '电机M02停止', name: '赵文博', time: '18:33:27' },
  { id: 12, action: '加热器断电', name: '司马相如', time: '19:20:11' },
  { id: 13, action: '电磁阀0104开启', name: '赵敏', time: '20:07:55' },
  { id: 14, action: '冷却水阀关闭', name: '周慧敏', time: '21:44:08' },
  { id: 15, action: '流量异常报警', name: '诸葛孔明', time: '22:16:30' },
  { id: 16, action: '电磁阀0301开启', name: '周杰', time: '06:38:14' },
  { id: 17, action: '压缩机启动', name: '吴天宇', time: '07:50:22' },
  { id: 18, action: '电磁阀0105关闭', name: '独孤求败', time: '08:59:43' },
  { id: 19, action: '排风阀开启', name: '吴芳', time: '09:13:56' },
  { id: 20, action: '电压不稳报警', name: '郑秀文', time: '10:26:17' },
  { id: 21, action: '电磁阀0203开启', name: '东方不败', time: '11:48:39' },
  { id: 22, action: '水泵停止', name: '郑凯', time: '12:55:02' },
  { id: 23, action: '温度恢复正常', name: '林心如', time: '13:37:28' },
  { id: 24, action: '电磁阀0106关闭', name: '西门吹雪', time: '14:09:50' },
  { id: 25, action: '搅拌机启动', name: '林颖', time: '15:22:11' },
  { id: 26, action: '电磁阀0302开启', name: '张丽华', time: '16:41:33' },
  { id: 27, action: '油泵启动', name: '南宫问天', time: '17:04:46' },
  { id: 28, action: '过滤器堵塞报警', name: '刘佳琪', time: '18:18:59' },
  { id: 29, action: '电磁阀0204关闭', name: '北堂墨染', time: '19:35:12' },
  { id: 30, action: '系统待机', name: '李娜', time: '20:50:25' },
];
