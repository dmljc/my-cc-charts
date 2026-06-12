import * as React from 'react';
import { TreeSelect } from '@alifd/next';
import { request } from '../../src/utils/util/request';

interface DeviceListSetterProps {
  value?: string;
  defaultValue?: string;
  onChange: (val: string) => void;
  options?: IDataSource[];
  disabled?: boolean;
  selectable?: boolean;
}
interface IDataSource {
  label: string;
  value: string;
  children?: IDataSource[];
}

export default class TreeSelectSetter extends React.PureComponent<
  DeviceListSetterProps,
  { dataSource: IDataSource[] }
> {
  state = { dataSource: [] };

  componentDidMount() {
    const { options = [], value, defaultValue, onChange } = this.props;
    this.setState({ dataSource: options });
    if (value === undefined && defaultValue) onChange(defaultValue);
    this.getDeviceList();
  }

  getDeviceList = async () => {
    let treeData: IDataSource[] = [];
    try {
      const res = await request('https://plant.czy3d.com/api/project', 'GET');
      if (res?.devices) {
        treeData = Object.values(res.devices).map((dev: any) => ({
          label: dev.name,
          value: dev.id,
          selectable: !dev.enabled,
          children: (dev.tags ? Object.values(dev.tags) : []).map((tag: any) => ({
            label: tag.name,
            value: tag.id,
          })),
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.setState({ dataSource: treeData });   // 永远确保是数组
    }
  };

  render() {
    const { onChange, value } = this.props;
    const { dataSource } = this.state;

    return (
      <TreeSelect
        value={value}
        dataSource={dataSource}
        size="small"
        style={{ width: '100%' }}
        showSearch
        //@ts-ignore
        onChange={onChange}
        filter={(search, node) =>
          node.label.toLowerCase().includes(search.toLowerCase())
        }
      />
    );
  }
}
