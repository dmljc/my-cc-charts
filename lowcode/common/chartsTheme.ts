export const chartsTheme = [
    {
        name: 'chartTheme',
        type: 'group',
        display: 'accordion',
        title: {
            label: '主题',
        },
        items: [    
            {
                name: 'ccs',
                title: '颜色',
                setter: {
                    componentName: 'RadioGroupSetter',
                    props: {
                        options: [
                            {
                                title: '暗色',
                                value: 'dark',
                            },
                            {
                                title: '亮色',
                                value: 'light',
                            },
                        ],
                    },
                },
                extraProps: {        
                    setValue: (target: any, value: any) => {   
                        // debugger
                        if (value === 'light') {        
                            target.getProps().setPropValue('color', '#c98f8f');              
                        } else if (value === 'dark') {        
                            target.getProps().setPropValue('color', '#664848');    
                        }         
                    },   
                },
            }
        ],
        
        },
  ];
  