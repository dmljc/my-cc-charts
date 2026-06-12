import * as React from "react";
import {Select} from "@alifd/next";
import { request } from "../../src/utils/util/request";

const Option = Select.Option;

interface DeviceListSetterProps {
  // 当前值
  value: string;
  // 默认值
  defaultValue: string;
  // setter 唯一输出
  onChange: (val: string) => void;
  options: IDataSource[];
}

interface IDataSource{
  label: string;
  value: string;
}
export default class DeviceListSetter extends React.PureComponent<DeviceListSetterProps, any> {
  // 声明 Setter 的 title
  static displayName = 'DeviceListSetter';

  constructor(props: DeviceListSetterProps) {
    super(props);
    this.state = {
      dataSource: []
    }
    this.getDeviceList();
  }


  getDeviceList = async () => {
    const reData: any = [];
    try{
      const res = await request('/tenant-api/iot/api/tenant/deviceInfos?pageSize=10&page=0&sortProperty=createdTime&sortOrder=DESC', 'GET');
      res?.data?.forEach((item: any) => {
        reData.push({
          label: item.name,
          value: item.id.id
        })
      })
    } catch (e){
      console.log(e);
    }
    const olderData = this.state.dataSource;
    this.setState({
      dataSource: [...olderData, ...reData]
    })
  }

  componentDidMount() {
    const { onChange, value, defaultValue, options } = this.props;
    this.setState({
      dataSource: options
    })
    if (value == undefined && defaultValue) {
      onChange(defaultValue);
    }
  }

  render() {
    const { onChange, value } = this.props;
    return (
      <>
        <Select value={value} onChange={onChange} size="medium" style={{width: '100%'}}>
          {
            this?.state?.dataSource?.map((item: IDataSource) => {
              return (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              )
            })
          }
        </Select>
      </>
    );
  }
}
