import SectionLabel from '@/components/ui/SectionLabel';
import type { ResearchEntity } from '@/hooks/apiTypes';
import ExposureMapView from './ExposureMapView';
import ResearchDeltaTool from './ResearchDeltaTool';
import ThesisGroupsView from './ThesisGroupsView';

/** Three read-only views onto exactly what `@quant-fusion/quant-sdk-js` (the real quant bot's own
 * "bones" — see `bots/stock-market-4/quant-v0`) computes from a domain's research every
 * round: a security's multi-hop exposure, what a research change actually means once the
 * anti-inference rules are applied, and which tracked tickers currently represent one correlated
 * bet rather than independent positions. None of this runs a match or touches Docker — it's the
 * same pure functions, called directly, over whatever this domain's research currently records. */
export default function QuantSection({
  domain,
  entities,
}: {
  domain: string;
  entities: ResearchEntity[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionLabel>Exposure Map</SectionLabel>
        <div className="mt-2">
          <ExposureMapView domain={domain} entities={entities} />
        </div>
      </div>
      <div>
        <SectionLabel>Research Delta / Model Effects</SectionLabel>
        <div className="mt-2">
          <ResearchDeltaTool domain={domain} entities={entities} />
        </div>
      </div>
      <div>
        <SectionLabel>Thesis Groups</SectionLabel>
        <div className="mt-2">
          <ThesisGroupsView domain={domain} />
        </div>
      </div>
    </div>
  );
}
