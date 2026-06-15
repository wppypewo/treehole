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
    <header className={`animate-rise${className ? ` ${className}` : ""}`}>
      {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
      )}
    </header>
  );
}
