/** Phone tab bar (<640px), max 5 items; last is usually "More". */
export interface BottomNavProps { items: { id: string; label: string; icon: string }[]; active: string; onSelect?: (id: string) => void; }
export function BottomNav(props: BottomNavProps): JSX.Element;
