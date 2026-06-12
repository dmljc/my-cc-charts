import * as React from "react";
import { Button, Icon } from "@alifd/next";
import * as XLSX from 'xlsx';


interface DeviceListSetterProps {
  // 当前值
  value: string;
  // 默认值
  defaultValue: string;
  // setter 唯一输出
  onChange: (val: string) => void;
  caseType: number;
  // 下载模板Url
  moduleUrl: string;
  compIsTable: boolean;
}

export default class ExcelImportSetter extends React.PureComponent<DeviceListSetterProps, any> {
  // 声明 Setter 的 title
  static displayName = 'ExcelImport';

  constructor(props: DeviceListSetterProps) {
    super(props);
    this.state = {
      dataSource: []
    }
  }




  componentDidMount() {
    const { onChange, value, defaultValue, caseType, moduleUrl, compIsTable } = this.props;
    this.setState({
      dataSource: caseType
    })
    if (value == undefined && defaultValue) {
      onChange(defaultValue);
    }
  }

  render() {
    const _style = {
      display: 'none'
    }
    const { onChange, value, defaultValue, caseType, moduleUrl, compIsTable } = this.props;
    

    const { FileReader } = window;
    const changeFile = (file: any) => {
      const { files } = file.target;
      // 通过FileReader对象读取文件
      const fileReader = new FileReader();
      fileReader.onload = (event:any) => {
        try {
          const { result } = event.target;
          const workbook = XLSX.read(result, { type: 'binary' });
          let data: any = [];
          for (const sheet in workbook.Sheets) {
            if (workbook.Sheets.hasOwnProperty(sheet)) {
              data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { raw: compIsTable ? false : true }));
            }
          }
          console.log(data);
          this.setState({
            dataSource: data
          })
          onChange(data);
          // if (value == undefined && defaultValue) {
          //   onChange(data);
          // }
          document.getElementById('excelFileUpload').value = '';

        } catch (e) {
          console.log('文件类型不正确');
          return;
        }
      };
      fileReader.readAsBinaryString(files[0]);
    }

    return (
      <>
        <div style={{display: 'flex'}}>
          <Button 
            onClick={() => {
              document.getElementById('excelFileUpload').click();
            }}
            style={{marginRight: '10px'}}
          >导入Excel</Button>
          <Icon type="download" title='下载模板' style={{cursor: 'pointer'}}
            onClick={() => {
              window.open(moduleUrl) 
            }}
          />
        </div>
        <input id={'excelFileUpload'} type="file" accept='.xlsx, .xls'  onChange={changeFile} style={_style} />
      </>
    );
  }
}
