import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { ownerConfig } from "@/lib/owner-session";
import UnlockForm from "@/components/UnlockForm";

// 這一頁的內容取決於請求（語系 cookie、環境變數），不預先產生
export const dynamic = "force-dynamic";

export default async function UnlockPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const configured = ownerConfig() !== null;

  return (
    // 內容壓在下半部，像片頭的字卡。這一頁沒有第二件事要做，
    // 所以不需要把它放在正中央再左右對稱一次。
    <section className="page-shell flex min-h-[78dvh] items-end">
      <div className="w-full max-w-lg pb-[10dvh]">
        <p className="t-meta text-paper-faint">Treehole</p>
        <h1 className="t-film mt-4 text-[2rem] text-paper sm:text-4xl">
          {dict.unlock.title}
        </h1>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-paper-dim">
          {dict.unlock.hint}
        </p>

        {configured ? (
          <UnlockForm
            labels={{
              passcode: dict.unlock.passcode,
              submit: dict.unlock.submit,
              wrong: dict.unlock.wrong,
            }}
          />
        ) : (
          <p className="mt-10 border-l-2 border-curtain py-1 pl-4 text-sm leading-relaxed text-paper-dim">
            {dict.unlock.notConfigured}
          </p>
        )}
      </div>
    </section>
  );
}
