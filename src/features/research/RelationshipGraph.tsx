import { useMemo, useRef, useState } from 'react';
import { colorForSlug } from '@/utils/format';
import type { ResearchEntity, ResearchRelationship } from '@/hooks/apiTypes';

const WIDTH = 760;
const HEIGHT = 460;
const ITERATIONS = 300;
const REPULSION = 2200;
const SPRING_LENGTH = 90;
const SPRING_STRENGTH = 0.02;
const CENTER_STRENGTH = 0.01;
const DAMPING = 0.85;
const MARGIN = 30;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +zoom.toFixed(2)));
}

interface Pan {
  x: number;
  y: number;
}

/** How far the viewBox's center may drift from the canvas's own center at a given zoom, in the
 * same WIDTH/HEIGHT units the force layout itself uses — zero at `zoom <= 1` (the whole canvas
 * already fits, nothing to pan to) and growing as the zoomed-in window shrinks, so the view can
 * slide anywhere but never past the canvas's own edge. */
function maxPan(zoom: number): Pan {
  return {
    x: Math.max(0, (WIDTH - WIDTH / zoom) / 2),
    y: Math.max(0, (HEIGHT - HEIGHT / zoom) / 2),
  };
}

function clampPan(pan: Pan, zoom: number): Pan {
  const bound = maxPan(zoom);
  return {
    x: Math.min(bound.x, Math.max(-bound.x, pan.x)),
    y: Math.min(bound.y, Math.max(-bound.y, pan.y)),
  };
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** A small hand-rolled force-directed layout (repulsion between every node pair, a spring per
 * edge, a weak pull toward center) — no new charting/graph dependency for one visualization.
 * Starts from a deterministic circle, never `Math.random()` (banned outside
 * packages/rng/src/entropy.ts — see docs/adr/0004-deterministic-randomness.md), and relaxes into
 * a stable, reproducible layout over a fixed iteration count. O(n^2) per iteration is fine at the
 * scale this dataset actually is (dozens of connected entities, not thousands). */
function computeForceLayout(
  nodeIds: string[],
  edges: { from: string; to: string }[],
): Map<string, { x: number; y: number }> {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const radius = Math.min(WIDTH, HEIGHT) / 2.4;
  const n = Math.max(nodeIds.length, 1);

  const nodes: SimNode[] = nodeIds.map((id, i) => {
    const angle = (i / n) * 2 * Math.PI;
    return { id, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), vx: 0, vy: 0 };
  });
  const indexById = new Map(nodes.map((node, i) => [node.id, i]));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a === undefined || b === undefined) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = Math.max(dx * dx + dy * dy, 1);
        const dist = Math.sqrt(distSq);
        const force = REPULSION / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }
    for (const edge of edges) {
      const i = indexById.get(edge.from);
      const j = indexById.get(edge.to);
      if (i === undefined || j === undefined) continue;
      const a = nodes[i];
      const b = nodes[j];
      if (a === undefined || b === undefined) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - SPRING_LENGTH) * SPRING_STRENGTH;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }
    for (const node of nodes) {
      node.vx += (cx - node.x) * CENTER_STRENGTH;
      node.vy += (cy - node.y) * CENTER_STRENGTH;
      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x = Math.min(WIDTH - MARGIN, Math.max(MARGIN, node.x + node.vx));
      node.y = Math.min(HEIGHT - MARGIN, Math.max(MARGIN, node.y + node.vy));
    }
  }

  return new Map(nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
}

export default function RelationshipGraph({
  relationships,
  entitiesById,
}: {
  relationships: ResearchRelationship[];
  entitiesById: Map<string, ResearchEntity>;
}) {
  const [hoveredId, setHoveredId] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; pan: Pan } | null>(null);
  const canPan = zoom > 1;

  // Zooms via the SVG's own viewBox (shrinking/growing it around the canvas center, offset by
  // `pan`) rather than a CSS transform, so node/edge/label positions never need separate handling
  // for zoomed/panned vs. not.
  const viewBoxWidth = WIDTH / zoom;
  const viewBoxHeight = HEIGHT / zoom;
  const viewBoxX = WIDTH / 2 - viewBoxWidth / 2 - pan.x;
  const viewBoxY = HEIGHT / 2 - viewBoxHeight / 2 - pan.y;

  const setZoomClamped = (next: number) => {
    setZoom(next);
    setPan((prev) => clampPan(prev, next));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canPan) return;
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY, pan };
    setIsPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const start = dragStartRef.current;
    if (start === null || svgRef.current === null) return;
    const rect = svgRef.current.getBoundingClientRect();
    // Screen-pixel drag distance converted into the same WIDTH/HEIGHT units the viewBox uses —
    // the SVG renders at `rect.width`px but its viewBox spans `viewBoxWidth` units, so a 1px
    // drag on screen moves the view by `viewBoxWidth / rect.width` units, not 1 unit.
    const dx = ((e.clientX - start.clientX) * viewBoxWidth) / rect.width;
    const dy = ((e.clientY - start.clientY) * viewBoxHeight) / rect.height;
    setPan(clampPan({ x: start.pan.x + dx, y: start.pan.y + dy }, zoom));
  };

  const stopPanning = () => {
    dragStartRef.current = null;
    setIsPanning(false);
  };

  const nodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of relationships) {
      ids.add(r.fromEntityId);
      ids.add(r.toEntityId);
    }
    return [...ids];
  }, [relationships]);

  const edges = useMemo(
    () => relationships.map((r) => ({ from: r.fromEntityId, to: r.toEntityId })),
    [relationships],
  );

  const positions = useMemo(() => computeForceLayout(nodeIds, edges), [nodeIds, edges]);

  if (relationships.length === 0) {
    return <p className="font-mono text-xs text-muted-3">No relationships to graph.</p>;
  }

  return (
    <div
      style={{
        background: '#0a0a0a',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
        padding: 16,
      }}
    >
      <div className="flex items-center justify-end gap-1.5 mb-2">
        <button
          onClick={() => {
            setZoomClamped(clampZoom(zoom - ZOOM_STEP));
          }}
          className="font-mono text-xs w-6 h-6 rounded-sm cursor-pointer border border-border-2 bg-transparent text-muted-2"
        >
          −
        </button>
        <span className="font-mono text-[10px] w-10 text-center text-muted-3">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => {
            setZoomClamped(clampZoom(zoom + ZOOM_STEP));
          }}
          className="font-mono text-xs w-6 h-6 rounded-sm cursor-pointer border border-border-2 bg-transparent text-muted-2"
        >
          +
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="font-mono text-[9px] uppercase tracking-widest px-2 h-6 rounded-sm cursor-pointer border border-border-2 bg-transparent text-muted-3"
        >
          Reset
        </button>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height={HEIGHT}
        viewBox={`${String(viewBoxX)} ${String(viewBoxY)} ${String(viewBoxWidth)} ${String(viewBoxHeight)}`}
        style={{
          display: 'block',
          cursor: canPan ? (isPanning ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopPanning}
        onPointerCancel={stopPanning}
        onPointerLeave={stopPanning}
      >
        <defs>
          <marker id="rel-arrow" markerWidth="6" markerHeight="6" refX="9" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-muted-4)" />
          </marker>
        </defs>
        {relationships.map((r) => {
          const from = positions.get(r.fromEntityId);
          const to = positions.get(r.toEntityId);
          if (from === undefined || to === undefined) return null;
          const highlighted = hoveredId === r.fromEntityId || hoveredId === r.toEntityId;
          return (
            <line
              key={r.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={highlighted ? colorForSlug(r.type) : 'var(--color-border-4)'}
              strokeWidth={highlighted ? 2 : 1}
              markerEnd="url(#rel-arrow)"
            />
          );
        })}
        {nodeIds.map((id) => {
          const pos = positions.get(id);
          if (pos === undefined) return null;
          const entity = entitiesById.get(id);
          const label = entity?.name ?? id;
          const truncated = label.length > 16 ? `${label.slice(0, 15)}…` : label;
          const isHovered = hoveredId === id;
          return (
            <g
              key={id}
              onMouseEnter={() => {
                setHoveredId(id);
              }}
              onMouseLeave={() => {
                setHoveredId(undefined);
              }}
              style={{ cursor: 'default' }}
            >
              <title>{label}</title>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 7 : 5}
                fill={entity !== undefined ? colorForSlug(entity.type) : 'var(--color-muted)'}
                stroke="var(--color-background)"
                strokeWidth={1.5}
              />
              <text
                x={pos.x}
                y={pos.y - 10}
                textAnchor="middle"
                fontFamily="JetBrains Mono"
                fontSize={9}
                fill={isHovered ? 'var(--color-foreground)' : 'var(--color-muted)'}
              >
                {truncated}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="font-mono text-[10px] mt-2 text-muted-4">
        {nodeIds.length} entities · {relationships.length} relationships shown — hover a node to
        highlight its edges, use +/− to zoom{canPan ? ', drag to pan' : ''}.
      </p>
    </div>
  );
}
