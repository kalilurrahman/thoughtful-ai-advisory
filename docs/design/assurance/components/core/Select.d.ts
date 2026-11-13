/** Native select with label — native keeps mobile pickers accessible. */
export interface SelectProps { label?: string; options: string[]; value?: string; onChange?: (v: string) => void; style?: React.CSSProperties; }
export function Select(props: SelectProps): JSX.Element;
