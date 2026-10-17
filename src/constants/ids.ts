export function buildSparklineGradientId(participantId: string): string {
  return `spark-${participantId}`;
}

/** Forces `MatchLeaderboard` to refetch after "Run Next Round" advances a match — its own
 * `useForwardMatch` call has no other reason to re-run, since `matchId` itself doesn't change on
 * a re-run (see `MatchesPanel`'s own `refreshNonce` state). */
export function buildMatchLeaderboardKey(matchId: string, refreshNonce: number): string {
  return `${matchId}-${String(refreshNonce)}`;
}
