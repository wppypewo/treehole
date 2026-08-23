export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header
      className={`animate-rise border-b border-hairline pb-6${
        className ? ` ${className}` : ""
      }`}
    >
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="t-film text-[2rem] text-paper sm:text-[2.75rem]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-[52ch] text-sm text-paper-dim">{subtitle}</p>
      )}
    </header>
  );
}
