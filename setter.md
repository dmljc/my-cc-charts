## setter配置文档

```json
[
  {
    "setter": {
      "componentName": "StringSetter", // 或 "TextAreaSetter"
      "props": {
        "condition": "(target) => target.getProps().getPropValue('type') === 'primary'",    // 条件渲染，用同级别其他的 Setter 值来判断此 Setter 是否显示
        "allowClear": true,           // 显示清除按钮
        "maxLength": 100,             // 最大长度
        "hasClearIcon": true,         // 显示清除图标
        "trimValue": false            // 是否自动去除首尾空格
      }
    }
  },
  {
    "setter": {
      "componentName": "NumberSetter",
      "props": {
        "step": 1,                    // 步进值
        "min": 0,                     // 最小值
        "max": 100,                   // 最大值
        "precision": 2,               // 小数位数
        "unit": "px"                 // 单位后缀
      }
    }
  },
  {
    "setter": {
      "componentName": "SelectSetter",
      "props": {
        "options": [                  // 选项配置
          { "label": "选项1", "value": 1 },
          { "label": "选项2", "value": 2 }
        ],
        "mode": "single",           // 单选模式：single/multiple
        "useVirtual": true,           // 开启虚拟滚动
        "filterable": true            // 可搜索
      }
    }
  },
  {
    "setter": {
      "componentName": "RadioGroupSetter",
      "props": {
        "options": [
          { "label": "选项A", "value": "a" },
          { "label": "选项B", "value": "b" }
        ],
        "direction": "hoz",          // 排列方向：hoz/ver
        "size": "medium"             // 尺寸：small/medium/large
      }
    }
  },
  {
    "setter": {
      "componentName": "ColorSetter",
      "props": {
        "showAlpha": true,            // 显示透明度控制
        "presetColors": [             // 预设颜色
          "#FF0000", "#00FF00", "#0000FF"
        ],
        "format": "hex"              // 格式：hex/rgb/hsb
      }
    }
  },
  {
    "setter": {
      "componentName": "DateSetter",  // 或 "DateRangeSetter"
      "props": {
        "format": "YYYY-MM-DD",       // 日期格式
        "showTime": false,             // 显示时间选择
        "disabledDate": (current) => current < Date.now() // 禁用日期逻辑
      }
    }
  },
  {
    "setter": {
      "componentName": "ArraySetter",
      "props": {
        "itemSetter": {                // 子项配置
          "componentName": "ObjectSetter",
          "props": {
            "config": {
              "items": [
                { "name": "key",   "setter": "StringSetter" },
                { "name": "value", "setter": "NumberSetter" }
              ]
            }
          }
        },
        "newItemDefault": { key: '', value: 0 }, // 新增项默认值
        "sortable": true               // 启用排序
      }
    }
  },
  {
    "setter": {
      "componentName": "ObjectSetter",
      "props": {
        "config": {                    // 对象结构定义
          "items": [
            {
              "name": "title",
              "title": "标题",
              "setter": "StringSetter"
            },
            {
              "name": "size",
              "setter": {
                "componentName": "SelectSetter",
                "props": {
                  "options": [
                    { "label": "小", "value": "small" },
                    { "label": "中", "value": "medium" }
                  ]
                }
              }
            }
          ]
        },
        "displayType": "inline"       // 显示方式：inline/block
      }
    }
  },
  {
    "setter": {
      "componentName": "VariableSetter",
      "props": {
        "support": ["string", "number", "object"], // 支持的数据类型
        "globalVariables": {           // 全局变量池
          "user": { name: "张三", age: 30 }
        },
        "showIdentifier": true         // 显示变量标识符
      }
    }
  },
  {
    "setter": {
      "componentName": "FunctionSetter",
      "props": {
        "language": "javascript",     // 语言：javascript/typescript
        "height": 200,                 // 编辑器高度
        "extraLibs": `declare function alert(msg: string): void;` // 额外类型声明
      }
    }
  }
]

