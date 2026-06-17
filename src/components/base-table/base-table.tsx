import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface BaseTableColumn {
  key: string;
  title: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
}

export interface BaseTableItem {
  id?: string | number;
  [key: string]: unknown;
}

export interface BaseTableProps {
  title?: string;
  columns?: BaseTableColumn[];
  data?: BaseTableItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onRowClick?: (item: BaseTableItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: BaseTableItem[]) => void;
  };
}

const defaultColumns: BaseTableColumn[] = [
  { key: 'name', title: '名称', align: 'left' },
  { key: 'mode', title: '模式', align: 'center' },
  { key: 'output', title: '输出', align: 'center' },
  { key: 'openFlow', title: '开度/流量', align: 'right' },
];

const defaultData: BaseTableItem[] = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  name: '调节阀1',
  mode: '自动',
  output: '52%',
  openFlow: '412/200',
}));

const pickRootDomProps = (props: Record<string, unknown>) => {
  const domProps: Record<string, unknown> = {};

  Object.keys(props).forEach((key) => {
    if (
      key === 'id' ||
      key === 'role' ||
      key === 'tabIndex' ||
      key.indexOf('data-') === 0 ||
      key.indexOf('aria-') === 0
    ) {
      domProps[key] = props[key];
    }
  });

  return domProps;
};

const BaseTable: React.FC<BaseTableProps> = function BaseTable(props) {
  const {
    columns = defaultColumns,
    data = defaultData,
    width = 400,
    height = 368,
    style = {},
    className = '',
    onRowClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<BaseTableItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: BaseTableItem[]) => {
          if (Array.isArray(nextData)) {
            setItems(nextData);
          }
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  const gridTemplateColumns = columns
    .map((col) => (col.width ? (typeof col.width === 'number' ? `${col.width}px` : col.width) : '1fr'))
    .join(' ');

  return (
    <div
      className={`bizpack-base-table ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-base-table-header" style={{ gridTemplateColumns }}>
        {columns.map((col) => (
          <div
            key={col.key}
            className={`bizpack-base-table-header-cell bizpack-base-table-cell-${col.align || 'left'}`}
          >
            {col.title}
          </div>
        ))}
      </div>

      <div className="bizpack-base-table-body">
        {items.map((item, index) => (
          <div
            key={item.id != null ? String(item.id) : index}
            className={`bizpack-base-table-row ${index % 2 === 0 ? 'bizpack-base-table-row-even' : 'bizpack-base-table-row-odd'}`}
            style={{ gridTemplateColumns }}
            onClick={() => {
              if (onRowClick) {
                onRowClick(item, index);
              }
            }}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className={`bizpack-base-table-cell bizpack-base-table-cell-${col.align || 'left'}`}
                title={item[col.key] != null ? String(item[col.key]) : ''}
              >
                <span className="bizpack-base-table-cell-text">
                  {item[col.key] != null ? String(item[col.key]) : '-'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

BaseTable.displayName = 'BaseTable';
export default BaseTable;
