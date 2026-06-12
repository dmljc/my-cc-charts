import * as React from "react";
import {Button, Input, Icon} from "@alifd/next";
// import "./index.scss";

interface FetchIdSetterProps {
  // 当前值
  value: string;
  // 默认值
  defaultValue: string;
  // setter 唯一输出
  onChange: (val: string) => void;
  // AltStringSetter 特殊配置
  placeholder: string;
}

export default class FetchIdSetter extends React.PureComponent<FetchIdSetterProps> {
  // 声明 Setter 的 title
  static displayName = 'FetchIdSetter';

  componentDidMount() {
    const { onChange, value, defaultValue } = this.props;
    if (value == undefined && defaultValue) {
      onChange(defaultValue);
    }
  }

  jump = () => {
    // @ts-ignore
    window.open('https://czy.spacetest.czy3d.com/simu/data-base/#/')
  }

  render() {
    const { onChange, value, placeholder } = this.props;
    return (
      <>
        <Input
          value={value}
          placeholder={placeholder || ""}
          onChange={(val: any) => onChange(val)}
          style={{
            width: '65%',
          }}
        /> &nbsp;&nbsp;
        <Button type="primary" onClick={this.jump}>
          <Icon type="edit" />
        </Button>
      </>
    );
  }
}
