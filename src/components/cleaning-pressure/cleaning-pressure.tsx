// 清洗压力前/后端
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export type CleaningPressureTab = 'front' | 'rear';

export interface CleaningPressureItem {
  id?: string | number;
  name?: string;
  status?: string;
  pressure?: string;
  duration?: string;
}

export interface CleaningPressurePanelData {
  front?: CleaningPressureItem[];
  rear?: CleaningPressureItem[];
}

export interface CleaningPressureProps {
  activeTab?: CleaningPressureTab;
  data?: CleaningPressurePanelData;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onTabChange?: (tab: CleaningPressureTab) => void;
  onRowClick?: (item: CleaningPressureItem, index: number, tab: CleaningPressureTab) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: CleaningPressurePanelData | CleaningPressureItem[]) => void;
  };
}

const defaultRow: CleaningPressureItem = {
  id: 1,
  name: '清洗阀T1',
  status: '运行',
  pressure: '13pa',
  duration: '300s',
};

const defaultData: CleaningPressurePanelData = {
  front: [
    defaultRow,
    { ...defaultRow, id: 2 },
  ],
  rear: [
    defaultRow,
    { ...defaultRow, id: 2 },
  ],
};

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

const normalizePanelData = (panelData?: CleaningPressurePanelData): Required<CleaningPressurePanelData> => ({
  front: panelData?.front || [],
  rear: panelData?.rear || [],
});

const CleaningPressure: React.FC<CleaningPressureProps> = function CleaningPressure(props) {
  const {
    activeTab: activeTabProp = 'front',
    data = defaultData,
    width = 400,
    height = 108,
    style = {},
    className = '',
    onTabChange,
    onRowClick,
    ...otherProps
  } = props;
  const [panelData, setPanelData] = useState<Required<CleaningPressurePanelData>>(normalizePanelData(data));
  const [activeTab, setActiveTab] = useState<CleaningPressureTab>(activeTabProp);
  const activeTabRef = React.useRef(activeTab);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;
  const currentItems = activeTab === 'front' ? panelData.front : panelData.rear;

  useEffect(() => {
    setPanelData(normalizePanelData(data));
  }, [data]);

  useEffect(() => {
    setActiveTab(activeTabProp);
  }, [activeTabProp]);

  activeTabRef.current = activeTab;

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: CleaningPressurePanelData | CleaningPressureItem[]) => {
          if (Array.isArray(nextData)) {
            setPanelData((prev) => ({
              ...prev,
              [activeTabRef.current]: nextData,
            }));
            return;
          }

          setPanelData(normalizePanelData(nextData));
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  const handleTabChange = (tab: CleaningPressureTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div
      className={`bizpack-cleaning-pressure ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-cleaning-pressure-tabs">
        <button
          type="button"
          className={`bizpack-cleaning-pressure-tab ${
            activeTab === 'front' ? 'bizpack-cleaning-pressure-tab-active' : ''
          }`}
          onClick={() => handleTabChange('front')}
        >
          清洗压力前端
        </button>
        <button
          type="button"
          className={`bizpack-cleaning-pressure-tab ${
            activeTab === 'rear' ? 'bizpack-cleaning-pressure-tab-active' : ''
          }`}
          onClick={() => handleTabChange('rear')}
        >
          清洗压力后端
        </button>
      </div>

      <div className="bizpack-cleaning-pressure-list">
        {currentItems.map((item, index) => (
          <div
            key={item.id != null ? String(item.id) : index}
            className={`bizpack-cleaning-pressure-row ${
              index % 2 === 0 ? 'bizpack-cleaning-pressure-row-even' : 'bizpack-cleaning-pressure-row-odd'
            }`}
            onClick={() => {
              if (onRowClick) {
                onRowClick(item, index, activeTab);
              }
            }}
          >
            <span className="bizpack-cleaning-pressure-cell bizpack-cleaning-pressure-cell-name" title={item.name}>
              {item.name || '-'}
            </span>
            <span className="bizpack-cleaning-pressure-cell bizpack-cleaning-pressure-cell-status" title={item.status}>
              {item.status || '-'}
            </span>
            <span className="bizpack-cleaning-pressure-cell bizpack-cleaning-pressure-cell-pressure" title={item.pressure}>
              {item.pressure || '-'}
            </span>
            <span className="bizpack-cleaning-pressure-cell bizpack-cleaning-pressure-cell-duration" title={item.duration}>
              {item.duration || '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

CleaningPressure.displayName = 'CleaningPressure';
export default CleaningPressure;
