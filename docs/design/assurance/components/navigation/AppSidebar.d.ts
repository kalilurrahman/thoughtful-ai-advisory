/** Command-navy workspace sidebar; collapsed = 72px icon rail (tablet). Uses Phosphor icon names.
 * @startingPoint section="Navigation" subtitle="Sidebar, top bar, bottom nav" viewport="700x420" */
export interface NavItem { id: string; label: string; icon: string; count?: number; alert?: boolean; }
export interface AppSidebarProps { groups: { label: string; items: NavItem[] }[]; active: string; onSelect?: (id: string) => void; collapsed?: boolean; org?: string; }
export function AppSidebar(props: AppSidebarProps): JSX.Element;
