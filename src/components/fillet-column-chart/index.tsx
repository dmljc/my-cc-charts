// 圆角进度柱状图
import React, { useEffect, createElement } from "react";
import {
  Chart,
  Tooltip,
  Interval,
  Axis,
  registerShape,
  Legend
} from "bizcharts";
import { destroy, init } from "../../common/iot";


registerShape('interval', 'border-radius', {
  draw(cfg: any, container) {
    const { points } = cfg;
    let path = [];
    path.push(['M', points[0].x, points[0].y]);
    path.push(['L', points[1].x, points[1].y]);
    path.push(['L', points[2].x, points[2].y]);
    path.push(['L', points[3].x, points[3].y]);
    path.push('Z');
    path = this.parsePath(path); // 将 0 - 1 转化为画布坐标

    const group = container.addGroup();
    group.addShape('rect', {
      attrs: {
        x: path[1][1], // 矩形起始点为左上角
        y: path[1][2],
        width: path[2][1] - path[1][1],
        height: path[0][2] - path[1][2],
        fill: cfg.color,
        radius: (path[2][1] - path[1][1]) / 2,
      },
    });

    return group;
  },
});;

export interface FilletColumnChartProps {
    data?: any[];
    color: string;
    width: number;
    height: number;
    legendPostion: string;
    xField: string;
    yMax: string;
    expected: string;
    actual: string;
  }

export default (props: FilletColumnChartProps) => {
    const { data, height, width, color, xField, yMax, expected, actual, legendPostion } = props;
    
    const bizRef = React.useRef(null);
    const bc: BroadcastChannel = null;


    useEffect(() => {
        init(props, bizRef, bc);
        return () => {
            destroy(props, bc);
        };
    });

    const scale = {
        expected: {
            min: 0,
            max: yMax,
            sync: 'value',
        },
        actual: {
            sync: 'value',
        },
    };

    return (
        <Chart 
            height={height} 
            width={width}
            scale={scale}
            data={data}
            autoFit 
            padding={legendPostion === 'top'? [40, 10,40, 50] : [20, 10, 40, 50]}
            onGetG2Instance={(chart: any) => {
                bizRef.current = chart;
            }}
        >
            <Interval
                color="#F1F1F1"
                shape="border-radius"
                position={`${xField}*${expected}`}
            />
            <Interval
                position={`${xField}*${actual}`}
                color={color}
                shape={[`${xField}*${actual}`, (date, val) => {
                if (val === 0) {
                    return;
                }
                // eslint-disable-next-line consistent-return
                return 'border-radius';
                }]}
            />
            <Axis name={actual} visible={false} />
            <Axis name={xField} />
            <Axis
                name={expected}
                line={false}
                tickLine={false}
                label={{
                formatter: (val) => {
                    if (val === '1200') {
                    return '';
                    }
                    return val;
                },
                }}
            />
            <Legend position={legendPostion} visible={false} />
            <Tooltip shared />
        </Chart>
    );
}

