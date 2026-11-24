"use client";

import { useState } from "react";

/**
 * 片庫的復原堆疊。每移出（或標為看過）一部就推一筆，「復原」從最近的一筆往回拿。
 *
 * 每一筆要帶著原本的時間（加入日、看過日、收藏日），復原時原樣送回 API，
 * 片才會回到原來的序位、日誌裡原來的那一天；不帶的話會被當成剛剛才加入。
 *
 * 堆疊只活在這一頁：換頁或重新整理就清空，跟瀏覽器的上一頁一樣不跨頁。
 */
export function useUndoStack<T>() {
  const [stack, setStack] = useState<T[]>([]);
  const [busy, setBusy] = useState(false);

  const top = stack.length > 0 ? stack[stack.length - 1] : null;

  function push(item: T) {
    setStack((prev) => [...prev, item]);
  }

  /**
   * 拿最上面那一筆去做 restore。成功才從堆疊移掉；失敗留著，人可以再按一次。
   * 回傳 true 表示成功。
   */
  async function undo(restore: (item: T, isLast: boolean) => Promise<void>) {
    if (top === null || busy) return false;
    const item = top;
    setBusy(true);
    try {
      await restore(item, stack.length === 1);
      setStack((prev) => prev.filter((x) => x !== item));
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { top, remaining: Math.max(stack.length - 1, 0), busy, push, undo };
}
