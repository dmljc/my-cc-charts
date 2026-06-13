declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.sass' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.less' {
  const content: Record<string, string>;
  export default content;
}

// @types/react@>=16.14.60 将全局 JSX.IntrinsicElements 置空
// 导致 "类型"JSX.IntrinsicElements"上不存在属性"div|span|button"" 等错误
// 此处用模块增强恢复 JSX 内置元素类型
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [tagName: string]: import('react').DetailedHTMLProps<
        import('react').AllHTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
