import FetchIdSetter from "../setters/fetchId";
import DeviceListSetter from "../setters/deviceList";
import ExcelImportSetter from "../setters/excelImport";

export const ChartMetaIot = [
    {
        name: 'dataType',
        title: '数据源类型',
        setter: {
            componentName: 'SelectSetter',
            props: {
                defaultValue: 'data',
                mode: 'single',
                options: [
                    {
                        label: '数据源',
                        value: 'fetch',
                    },
                    // {
                    //     label: '广播',
                    //     value: 'board',
                    // },
                    {
                        label: '实时数据',
                        value: 'websocket',
                    },
                    {
                        label: '静态数据',
                        value: 'data',
                    },
                    {
                        label: 'excel导入',
                        value: 'excel',
                        // disabled: (tag, options) => {
                        //     console.log(tag, options);
                        //     debugger;
                        //     return false;
                        // }
                    }
                ],
            },
        }
    },
    {
        name: 'fetch.id',
        title: '数据源ID',
        setter: {
            componentName: FetchIdSetter,
            props: {
                placeholder: '请选择数据源',
            }
        },
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'fetch';
        }
    },
    {
        name: 'fetch.payload',
        title: '数据源参数',
        setter: 'JsonSetter',
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'fetch';
        }
    },
    {
        name: 'ws.id',
        title: '订阅Topic',
        setter: 'StringSetter',
        condition: () => false
    },
    {
        name: 'baseWsUri',
        title: '订阅Topic',
        setter: 'StringSetter',
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'websocket';
        }
    },
    {
        name: 'token',
        title: '令牌',
        setter: 'StringSetter',
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'websocket';
        }
    },
    {
        name: 'ws.rules',
        title: '映射路径',
        setter: 'StringSetter',
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'websocket';
        }
    },
    {
        name: 'ws.deviceId',
        title: '设备ID',
        setter: {
            componentName: DeviceListSetter,
            props: {
                defaultValue: '',
                options: [
                    {
                        label: '测试设备1',
                        value: '02bd7a50-2307-11ef-9074-cbba21e11eeb'
                    },
                    {
                        label: '测试设备2',
                        value: 'c2a84640-b69e-11ee-9142-559b88aafa2f'
                    }, {
                        label: '差分曲线',
                        value: '89d7d610-4036-11ef-942b-a169147813eb'
                    }],
            },
        },
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'websocket';
        }
    },
    {
        name: 'ws.callbacks',
        title: '回调函数',
        setter: 'FunctionSetter',
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'websocket';
        }
    },
    {
        name: 'ws.isAdd',
        title: '是否追加',
        setter: 'BoolSetter',
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'websocket';
        }
    },
    {
        name: 'baseFetchUri',
        title: '前缀',
        setter: 'StringSetter',
        condition: () => false
    },
    {
        name: 'boardId',
        title: '广播',
        setter: 'StringSetter',
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'board';
        }
    },
    {
        name: 'data',
        title: '图表数据',
        setter: 'JsonSetter',
        condition: (target: any) => {
            return target.getProps().getPropValue('dataType') === 'data';
        }
    },
    // {
    //     name: 'dataExcel',
    //     title: 'excel数据',
    //     setter: {
    //         componentName: ExcelImportSetter,
    //         props: {
    //             moduleUrl: './static/excelModules/simpleCharts.xls'
    //         },
    //     },
    //     condition: (target: any) => {
    //         return target.getProps().getPropValue('dataType') === 'excel';
    //     }
    // },
]

export const ChartSnippet = {
    height: 300,
    dataType: 'data',
    width: 400,
    baseFetchUri: `/tenant-api/humerus/api/dashboard/data/execute/:id`,
    baseWsUri: '',
    token: '',
}
