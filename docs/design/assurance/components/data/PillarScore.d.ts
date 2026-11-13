/** TILLER pillar score bar with target tick; colour derives from distance to target. */
export interface PillarScoreProps { letter: string; name: string; fn: string; score: number; target: number; tone?: string; }
export function PillarScore(props: PillarScoreProps): JSX.Element;
