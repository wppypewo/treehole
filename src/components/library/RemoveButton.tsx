"use client";

export interface RemoveLabels {
  remove: string;
  /** 「從這張清單移出《{title}》」 */
  removeNamed: string;
}

/**
 * 片庫清單的「移出」。按一下就移出，不再兩段式確認。
 *
 * 以前是「拿掉 → 確定拿掉／取消」：每移一部都要按兩下，
 * 而真正怕的「誤觸」其實靠復原就收得回來。現在移出後狀態列給「復原」，
 * 原本的加入日、看過日原樣放回去（見 useUndoStack），連按好幾部也能一路復原。
 */
export default function RemoveButton({
  title,
  labels,
  onRemove,
  className = "",
}: {
  title: string;
  labels: RemoveLabels;
  onRemove: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={labels.removeNamed.replace("{title}", title)}
      className={`tap-safe text-ui tracking-[0.02em] text-paper-faint transition-colors hover:text-paper ${className}`}
    >
      {labels.remove}
    </button>
  );
}
