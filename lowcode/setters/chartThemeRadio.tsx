import React from "react";
import { Radio } from "@alifd/next";

const RadioGroup = Radio.Group;

interface ChartThemeProps {
    // 当前值
    value: string;
    options: themeList[];
    defaultValue: string;
    onChange: (value: string) => void;
    onChangeConsole: (value: string, e: any) => void;
    // isSingle: boolean,
    field: any;
    otherColors: string;
}

interface themeList{
    label: string;
    value: string;
  }

class ChartThemeSetter extends React.Component<ChartThemeProps> {
    constructor(props: ChartThemeProps) {
        super(props);
    }

    componentDidMount() {
        const { onChange, defaultValue, options } = this.props;
          onChange(defaultValue);
        // }
      }

    
    render() {
        const { options, defaultValue, onChange, value, otherColors} = this.props;
        // console.log(onChange, 'onChange');
        return (
            <RadioGroup 
                // value={value}
                shape="button"
                onChange={(val, e)=> {
                    const { field } = this.props;
                    const propsField = field.parent;
                    // 获取同级其他属性 color 的值
                    // const otherValue = propsField.getPropValue('color');
                    
                    // set 同级其他属性 color 的值
                    propsField.setPropValue('color', val);

                    // 同时设置其他颜色
                    if(otherColors){
                        otherColors.split(',').forEach((item: string) => {
                            propsField.setPropValue(item, val)
                        })
                    }

                    onChange(val)
            }}>
                {options.map((item: any) => {
                    return (
                        // <Radio key={isSingle ? item.label : item.value.split(',')} value={isSingle ? item.value : item.value.split(',')}>
                        <Radio key={item.label } value={item.value}>
                            {item.label}
                        </Radio>    
                    )
                })}
            </RadioGroup>
        )
    }
    
  }

// const ChartTheme = (props: ChartThemeProps) => {
//   const { defaultValue, onChange, options } = props;
  
//   useEffect(() => {
//     onChange(defaultValue)
//   }, []);
  
// //   const onChange = (e: any) => {
// //       console.log();
      
// //   }
//   return (
//     <RadioGroup value={defaultValue} onChange={onChange}>
//       {options.map((item: any) => {
//         return (
//           <Radio key={item.value} name={item.value} label={item.label}>
//             {item.label}
//           </Radio>
//         )
//       })}
//     </RadioGroup>
//   )
// }

export default ChartThemeSetter;
