/** Segmented filter with counts — risk tiers, statuses, pillars. Scrolls horizontally on phones. */
export interface FilterTabsProps { items: { id: string; label: string; count?: number }[]; value: string; onChange?: (id: string) => void; }
export function FilterTabs(props: FilterTabsProps): JSX.Element;
