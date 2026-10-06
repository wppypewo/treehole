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
 *
 * 錯誤跟站內其他錯誤同一個樣子：靠左、左側簾幕紅粗線，重試鍵跟在訊息旁。
 * 載入中、到底了、沒有結果是清單的句點，置中。
 * 上面一部片都沒有時不畫頂線：上方已經是篩選面板或刊頭的線，再畫會兩條並排。
 */
export default function ListStatus({
  error,
  loading,
  done,
  isEmpty,
  hasItems,
  labels,
  onRetry,
}: {
  error: string | null;
  loading: boolean;
  done: boolean;
  isEmpty: boolean;
  /** 上方清單裡有沒有片 */
  hasItems: boolean;
  labels: ListStatusLabels;
  onRetry: () => void;
}) {
  return (
    <div
      className={`text-sm text-paper-faint ${
        hasItems ? "mt-14 border-t border-hairline pt-8" : "mt-10"
      }`}
    >
      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-6 gap-y-4 border-l-2 border-curtain py-1 pl-4"
        >
          <p className="text-paper-dim">{error}</p>
          <button type="button" onClick={onRetry} className="btn-line">
            {labels.retry}
          </button>
        </div>
      ) : (
        <p role="status" className="text-center">
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
