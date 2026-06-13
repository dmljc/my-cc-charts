// 仅用于修复 @types/react@>=16.14.60 清空全局 JSX.IntrinsicElements 的问题。
// 在需要 JSX 的组件中通过副作用 import 引入，无需修改 tsconfig / package.json。
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
