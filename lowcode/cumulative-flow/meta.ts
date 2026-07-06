import { ComponentMetadata, Snippet } from 'lowcode-types';
import { ChartSnippet, ChartMetaIot } from '../common/iot';

const dataSourceMeta = ChartMetaIot.filter((item) => item.name !== 'data');

const defaultData = {
    label: '累计流量',
    value: 3356,
};

const CumulativeFlowMeta: ComponentMetadata = {
    componentName: 'CumulativeFlow',
    title: '累计流量',
    category: '状态组件',
    group: '图表库',
    docUrl: '',
    screenshot: '',
    devMode: 'proCode',
    npm: {
        package: 'my-cc-charts',
        version: '0.1.0',
        exportName: 'CumulativeFlow',
        main: 'src/index.tsx',
        destructuring: true,
        subName: '',
    },
    props: [
        {
            name: 'ref',
            propType: {
                type: 'oneOfType',
                value: [
                    {
                        type: 'func',
                        params: [
                            {
                                name: 'instance',
                                propType: 'object',
                            },
                        ],
                        returns: {
                            propType: 'number',
                        },
                        raw: '(instance: unknown) => void',
                    },
                    'object',
                ],
            },
        },
        {
            name: 'key',
            propType: {
                type: 'oneOfType',
                value: ['string', 'number'],
            },
        },
        {
            name: 'style',
            propType: 'object',
        },
    ],
    configure: {
        props: [
            {
                name: 'data',
                type: 'group',
                display: 'accordion',
                title: {
                    label: '数据',
                },
                items: [
                    ...dataSourceMeta,
                    {
                        name: 'data',
                        title: {
                            label: '流量数据',
                            tip: '{ label, value }',
                        },
                        setter: 'JsonSetter',
                        condition: (target: any) => {
                            return target.getProps().getPropValue('dataType') === 'data';
                        },
                    },
                    {
                        name: 'labelField',
                        title: {
                            label: '标签字段名',
                            tip: '数据中标签对应的字段名，默认为 label',
                        },
                        setter: 'StringSetter',
                    },
                    {
                        name: 'valueField',
                        title: {
                            label: '值字段名',
                            tip: '数据中数值对应的字段名，默认为 value',
                        },
                        setter: 'StringSetter',
                    },

                ],
            },
            {
                name: '',
                type: 'group',
                display: 'accordion',
                title: {
                    label: '图形属性',
                },
                items: [
                    {
                        name: 'instantLabel',
                        title: '累计流量标签',
                        setter: 'StringSetter',
                    },
                    {
                        name: 'value',
                        title: '累计流量值',
                        setter: 'NumberSetter',
                    },
                    {
                        name: 'width',
                        title: '宽度',
                        setter: 'NumberSetter',
                    },
                    {
                        name: 'height',
                        title: '高度',
                        setter: 'NumberSetter',
                    },
                    {
                        name: 'className',
                        title: '自定义类名',
                        setter: 'StringSetter',
                    },
                ],
            },
        ],
    },
};

const snippets: Snippet[] = [
    {
        title: '累计流量',
        screenshot: '',
        schema: {
            componentName: 'CumulativeFlow',
            props: {
                ...ChartSnippet,
                instantLabel: '累计流量',
                value: 3356,
                labelField: 'label',
                valueField: 'value',
                data: defaultData,
                width: 400,
                height: 42,
            },
        },
    },
];

const hideFromLibrary = true;

export default {
    ...CumulativeFlowMeta,
    snippets: hideFromLibrary ? [] : snippets,
};
