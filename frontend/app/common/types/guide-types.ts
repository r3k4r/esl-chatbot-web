/** One step of the dashboard guide (useDashboardGuide). */
export interface GuideStep {
  /** The `data-guide` value of the element to light up; none = a centred card. */
  target?: string
  title: string
  text: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  /**
   * A sidebar item. On phones the sidebar is folded into the menu, so these steps are replaced by
   * one step on the menu button that names them all.
   */
  nav?: boolean
}
