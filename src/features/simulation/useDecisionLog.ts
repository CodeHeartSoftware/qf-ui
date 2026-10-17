import { useState } from 'react';
import { useApiResource } from '@/hooks/useApiResource';
import { useForwardMatches } from '@/hooks/useForwardMatches';
import type { RoundAuditEntry } from '@/hooks/apiTypes';

/** `DecisionLog`'s state: which match and bot to show, the audit rows, and which row is open. */
export function useDecisionLog() {
  const { matches } = useForwardMatches();
  const [matchId, setMatchId] = useState<string>();
  const [participantId, setParticipantId] = useState<string>();
  const [openRound, setOpenRound] = useState<number>();

  const match = matches.find((m) => m.matchId === matchId) ?? matches[0];
  const participant =
    participantId !== undefined && match?.participantIds.includes(participantId) === true
      ? participantId
      : match?.participantIds[0];
  const { data, error, loading } = useApiResource<{ entries: RoundAuditEntry[] }>(
    match !== undefined && participant !== undefined
      ? `/api/forward-matches/${encodeURIComponent(match.matchId)}/audit?participantId=${encodeURIComponent(participant)}`
      : null,
  );

  return {
    matches,
    match,
    selectMatch: (id: string) => {
      setMatchId(id);
      setParticipantId(undefined);
      setOpenRound(undefined);
    },
    participant,
    selectParticipant: (id: string) => {
      setParticipantId(id);
      setOpenRound(undefined);
    },
    entries: data?.entries ?? [],
    error,
    loading,
    openRound,
    toggleRound: (roundIndex: number) => {
      setOpenRound((r) => (r === roundIndex ? undefined : roundIndex));
    },
  };
}
