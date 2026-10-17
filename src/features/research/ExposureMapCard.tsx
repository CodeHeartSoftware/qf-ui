import Tag from '@/components/ui/Tag.tsx';
import { colorForSlug } from '@/utils/format.ts';
import type { ExposureEntry } from '@/hooks/apiTypes.ts';

interface ExposureMapCardProps {
  dimensionKey: string;
  entries?: ExposureEntry[];
  label: string;
}

function EntryRow({ entry }: { entry: ExposureEntry }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-xs text-foreground">{entry.name}</span>
      <span className="font-mono text-[10px] text-muted-3">{entry.weight.toFixed(2)}</span>
    </div>
  );
}

const ExposureMapCard = ({ entries = [], dimensionKey, label }: ExposureMapCardProps) => {
  return (
    <div
      className="p-3"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Tag label={label} color={colorForSlug(dimensionKey)} />
        <span className="font-mono text-[10px] text-muted-4">{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-4">None found.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExposureMapCard;
