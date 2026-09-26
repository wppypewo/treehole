export interface ListStatusLabels {
  loading: string;
  noMore: string;
  retry: string;
  empty: string;
}

/**
 * 無限捲動清單底下那一行：載入中、到底了、沒有結果、或是出錯要重試。
 *
 * 這一行是自動載入唯一的回饋，所以一定要進 live region，
 * 否則用鍵盤或報讀器的人不會知道下面又多了二十部片、或是沒有了。
 * 錯誤要打斷（alert），其餘等使用者手邊的事做完再報（status）。
 */
export default function ListStatus({
  error,
  loading,
  done,
  isEmpty,
  labels,
  onRetry,
}: {
  error: string | null;
  loading: boolean;
  done: boolean;
  isEmpty: boolean;
  labels: ListStatusLabels;
  onRetry: () => void;
}) {
  return (
    <div className="mt-14 border-t border-hairline pt-8 text-center text-sm text-paper-faint">
      {error ? (
        <div role="alert" className="space-y-4">
          <p className="text-paper-dim">{error}</p>
          <button type="button" onClick={onRetry} className="btn-line">
            {labels.retry}
          </button>
        </div>
      ) : (
        <p role="status">
          {loading ? (
            <span className="animate-pulse">{labels.loading}</span>
          ) : isEmpty ? (
            labels.empty
          ) : done ? (
            labels.noMore
          ) : null}
        </p>
      )}
    </div>
  );
}
