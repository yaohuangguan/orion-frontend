import React, {
  Suspense,
  useEffect,
  ComponentType,
  Component,
  ReactNode,
  ComponentProps,
  LazyExoticComponent
} from 'react';

// --- 1. 类型定义 ---
type ImportFactory<T extends ComponentType<any>> = () => Promise<{ default: T }>;

interface LazyLoadOptions {
  /** 自定义 Loading 组件 */
  loading?: React.ReactNode;
  /** 自定义报错时的 Fallback 组件 */
  errorFallback?: React.ReactNode;
  /** 是否启用自动刷新重试机制 (默认 true) */
  enableRetry?: boolean;
}

// --- 2. 核心：带重试机制的导入函数 ---
function retryImport<T extends ComponentType<any>>(
  factory: ImportFactory<T>,
  retriesLeft = 1 // 默认只自动重试 1 次
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    factory()
      .then(resolve)
      .catch((error) => {
        // 判断是否是网络/Chunk加载错误
        // Chrome/Firefox/Safari 报错信息略有不同，这里覆盖主流关键字
        const isChunkLoadError =
          error.message.includes('Failed to fetch') ||
          error.message.includes('Importing a module script failed') ||
          error.name === 'ChunkLoadError';

        if (isChunkLoadError && retriesLeft > 0) {
          // 定义存储 Key，用于跨页面刷新标记状态
          const storageKey = `retry-${window.location.pathname}`;
          const hasRetried = sessionStorage.getItem(storageKey);

          if (!hasRetried) {
            console.warn(`[LazyLoader] Chunk load failed. Reloading page to fetch new version...`);
            sessionStorage.setItem(storageKey, 'true');
            // 强制刷新页面，获取最新的 index.html 和 JS hash
            window.location.reload();
            return;
          }
        }

        // 如果不是 chunk 错误，或者已经重试过了，则直接抛出异常给 ErrorBoundary
        reject(error);
      });
  });
}

// --- 3. 默认的 Loading UI (骨架屏或转圈) ---
// 你可以换成你项目中统一的 <LoadingSpinner />
const DefaultLoader = () => (
  <div className="w-full h-96 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      <span className="text-sm text-slate-400 font-medium">Loading content...</span>
    </div>
  </div>
);

// --- 4. 默认的错误 UI ---
const DefaultErrorFallback = ({ retry }: { retry: () => void }) => (
  <div className="w-full h-64 flex flex-col items-center justify-center p-6 border-2 border-dashed border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900/30 rounded-xl text-center">
    <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
      <i className="fas fa-exclamation-triangle"></i>
    </div>
    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
      Module Load Failed
    </h3>
    <p className="text-sm text-slate-500 mb-6 max-w-xs">
      Something went wrong while loading this section. It might be a network issue.
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-rose-500/20"
    >
      Try Again
    </button>
  </div>
);

// --- 5. 内部错误边界组件 ---
// Fix: Make children optional in props to avoid JSX requirement errors when children are passed as elements
interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Fix: Explicitly extend React.Component to ensure that 'state', 'props', and 'setState' are correctly identified by the compiler
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Fix: Explicitly initialize state to avoid existence errors
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[LazyLoader] Error Boundary Caught:', error, errorInfo);
  }

  handleRetry = () => {
    // 简单的重试逻辑：清除错误状态，这会触发子组件重新渲染（重新尝试加载）
    // Fix: Properly access this.setState
    this.setState({ hasError: false });
    // 清除 sessionStorage 里的重试标记，允许再次尝试刷新
    const storageKey = `retry-${window.location.pathname}`;
    sessionStorage.removeItem(storageKey);
  };

  render() {
    // Fix: Properly access this.state and this.props
    if (this.state.hasError) {
      if (React.isValidElement(this.props.fallback)) {
        return this.props.fallback;
      }
      // 默认传入 retry 函数
      return <DefaultErrorFallback retry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

/**
 * --- 6. 最终导出：高阶组件 (HOC) ---
 * 使用方法：
 * const Dashboard = createLazyComponent(() => import('./pages/Dashboard'));
 */
export function createLazyComponent<T extends ComponentType<any>>(
  factory: ImportFactory<T>,
  options: LazyLoadOptions = {}
) {
  // 使用 React.lazy 包裹我们的重试逻辑
  const LazyComponent = React.lazy(() => retryImport(factory));

  // 返回一个封装好的组件
  return (props: ComponentProps<T>) => {
    // 每次渲染时清除当前页面的重试标记 (视为成功加载)
    // 使用 setTimeout 确保组件真正 mount 后再清除，避免还没加载完就清除
    useEffect(() => {
      const storageKey = `retry-${window.location.pathname}`;
      // 如果组件成功渲染了，说明没有报错，可以清除标记，方便下次遇到错误继续重试
      setTimeout(() => sessionStorage.removeItem(storageKey), 1000);
    }, []);

    return (
      // Fix: children is now optional in ErrorBoundaryProps, allowing JSX nested elements to satisfy the contract
      <ErrorBoundary fallback={options.errorFallback}>
        <Suspense fallback={options.loading || <DefaultLoader />}>
          {/* @ts-ignore: TS 很难推断 LazyExoticComponent 的具体 Props，这里忽略 */}
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}
