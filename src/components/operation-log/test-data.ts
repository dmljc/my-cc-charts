export interface OperationLogTestItem {
  id: number;
  title: string;
  operName: string;
  operTime: string;
  [key: string]: unknown;
}

export const DEFAULT_OPERATION_LOG_TEST_DATA: OperationLogTestItem[] = [
  { id: 1, title: '电磁阀0101开启', operName: '张伟', operTime: '08:23:15' },
  { id: 2, title: '电磁阀0102关闭电磁阀0102关闭', operName: '李晓明', operTime: '09:47:32' },
  { id: 3, title: '电机M01启动', operName: '欧阳雪晴', operTime: '10:05:08' },
  { id: 4, title: '温度传感器超限报警', operName: '王勇', operTime: '11:12:44' },
  { id: 5, title: '电磁阀0201开启', operName: '王思远', operTime: '12:30:21' },
  { id: 6, title: '压力泵停止', operName: '慕容紫英', operTime: '13:15:57' },
  { id: 7, title: '电磁阀0103关闭', operName: '刘洋', operTime: '14:42:03' },
  { id: 8, title: '风机启动', operName: '陈志强', operTime: '15:28:19' },
  { id: 9, title: '液位低报警', operName: '上官婉儿', operTime: '16:09:36' },
  { id: 10, title: '电磁阀0202开启', operName: '陈静', operTime: '17:55:42' },
  { id: 11, title: '电机M02停止', operName: '赵文博', operTime: '18:33:27' },
  { id: 12, title: '加热器断电', operName: '司马相如', operTime: '19:20:11' },
  { id: 13, title: '电磁阀0104开启', operName: '赵敏', operTime: '20:07:55' },
  { id: 14, title: '冷却水阀关闭', operName: '周慧敏', operTime: '21:44:08' },
  { id: 15, title: '流量异常报警', operName: '诸葛孔明', operTime: '22:16:30' },
  { id: 16, title: '电磁阀0301开启', operName: '周杰', operTime: '06:38:14' },
  { id: 17, title: '压缩机启动', operName: '吴天宇', operTime: '07:50:22' },
  { id: 18, title: '电磁阀0105关闭', operName: '独孤求败', operTime: '08:59:43' },
  { id: 19, title: '排风阀开启', operName: '吴芳', operTime: '09:13:56' },
  { id: 20, title: '电压不稳报警', operName: '郑秀文', operTime: '10:26:17' },
  { id: 21, title: '电磁阀0203开启', operName: '东方不败', operTime: '11:48:39' },
  { id: 22, title: '水泵停止', operName: '郑凯', operTime: '12:55:02' },
  { id: 23, title: '温度恢复正常', operName: '林心如', operTime: '13:37:28' },
  { id: 24, title: '电磁阀0106关闭', operName: '西门吹雪', operTime: '14:09:50' },
  { id: 25, title: '搅拌机启动', operName: '林颖', operTime: '15:22:11' },
  { id: 26, title: '电磁阀0302开启', operName: '张丽华', operTime: '16:41:33' },
  { id: 27, title: '油泵启动', operName: '南宫问天', operTime: '17:04:46' },
  { id: 28, title: '过滤器堵塞报警', operName: '刘佳琪', operTime: '18:18:59' },
  { id: 29, title: '电磁阀0204关闭', operName: '北堂墨染', operTime: '19:35:12' },
  { id: 30, title: '系统待机', operName: '李娜', operTime: '20:50:25' },
];
