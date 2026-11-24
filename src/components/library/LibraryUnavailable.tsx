import Link from "next/link";
import StatusNotice from "@/components/StatusNotice";
import RefreshButton from "@/components/RefreshButton";

/**
 * 片庫三頁讀不到資料庫時的整頁狀態。
 *
 * 以前直接丟到錯誤邊界，畫面叫人「用代碼去對伺服器紀錄」；
 * 詳情頁遇到同一件事卻是白話說明加重新載入。這裡跟詳情頁同一套說法與版型。
 */
export default function LibraryUnavailable({
  labels,
}: {
  labels: { title: string; body: string; reload: string; home: string };
}) {
  return (
    <StatusNotice title={labels.title} body={labels.body}>
      <RefreshButton label={labels.reload} />
      <Link href="/" className="btn-line">
        {labels.home}
      </Link>
    </StatusNotice>
  );
}
