export interface EffluentTestItem {
  id?: string | number;
  name: string;
  value: number | string;
  threshold?: number | string;
  arrow?: 'up' | 'down' | 'flat' | string;
  [key: string]: unknown;
}

export type EffluentListMap = Record<string, EffluentTestItem[]>;

export interface EffluentListPayload {
  effluentList: EffluentListMap;
}

const sampleItems = (seed: number): EffluentTestItem[] => [
  { id: 1, name: '全排', value: 1.2 + seed * 0.1, threshold: 1, arrow: 'up' },
  { id: 2, name: '特排', value: 1.2 + seed * 0.05, threshold: 100, arrow: 'flat' },
  { id: 3, name: '局排', value: 1.2 + seed * 0.02, threshold: 10, arrow: 'down' },
  { id: 4, name: '特排', value: 1.2, threshold: 100, arrow: seed % 2 === 0 ? 'up' : 'down' },
];

/** 默认 mock：多厂房流出物 map，与接口 effluentList 结构一致 */
export const DEFAULT_EFFLUENT_LIST_TEST_DATA: EffluentListPayload = {
  effluentList: {
    X12: [
      { id: 1, name: '全排', value: 0.3, threshold: 1, arrow: 'down' },
      { id: 2, name: '特排', value: 0.285, threshold: 100, arrow: 'down' },
      { id: 3, name: '局排', value: 0.285, threshold: 10, arrow: 'down' },
      { id: 4, name: '特排', value: 1000, threshold: 100, arrow: 'up' },
    ],
    X02: sampleItems(1),
    X03: [
      { id: 1, name: '全排', value: 0.3, threshold: 1, arrow: 'down' },
      { id: 2, name: '特排', value: 0.285, threshold: 100, arrow: 'down' },
      { id: 3, name: '局排', value: 0.285, threshold: 10, arrow: 'down' },
      { id: 4, name: '特排', value: 1000, threshold: 100, arrow: 'up' },
    ],
  },
};
