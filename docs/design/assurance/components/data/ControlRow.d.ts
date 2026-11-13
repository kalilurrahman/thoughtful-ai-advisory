/** One control in a register / assessment list. */
export interface ControlRowProps { code: string; text: string; weight?: string; owner?: string; status?: "effective" | "partial" | "gap" | "untested" | "attested"; statusLabel?: string; evidence?: string; refs?: string[]; onClick?: () => void; selected?: boolean; }
export function ControlRow(props: ControlRowProps): JSX.Element;
