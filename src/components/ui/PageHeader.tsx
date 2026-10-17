export default function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="font-mono text-lg font-bold text-foreground">{title}</h1>
      <p className="text-sm mt-0.5 text-muted-2">{subtitle}</p>
    </div>
  );
}
