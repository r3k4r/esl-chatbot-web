import { breadcrumbLabels } from '~/common/data/breadcrumb-labels'
import type { Breadcrumb } from '~/common/types/dashboard-types'

/**
 * The dashboard header's trail, built from the URL. An id segment shows the
 * title its page sets with `setTitle` (e.g. the class name), or "Details" until then.
 */
export function useBreadcrumbs() {
  const route = useRoute()
  // Keyed by path, so a title never leaks onto the next page.
  const titles = useState<Record<string, string>>('breadcrumb-titles', () => ({}))

  // One argument on purpose: pages pass setTitle straight to watch().
  function setTitle(title: string | null | undefined) {
    setTitleFor(route.path, title)
  }

  /** Names a parent id segment, e.g. the class on a nested task page. */
  function setTitleFor(path: string, title: string | null | undefined) {
    if (title) titles.value = { ...titles.value, [path]: title }
  }

  const crumbs = computed<Breadcrumb[]>(() => {
    const parts = route.path.split('/').filter(Boolean)
    const params = new Set(Object.values(route.params).flat().map(String))
    return parts.map((part, i) => {
      const to = '/' + parts.slice(0, i + 1).join('/')
      const label = params.has(part)
        ? titles.value[to] ?? titles.value[route.path] ?? 'Details'
        : breadcrumbLabels[part] ?? part.charAt(0).toUpperCase() + part.slice(1)
      // The last crumb is the current page: not a link.
      return { label, to: i < parts.length - 1 ? to : undefined }
    })
  })

  return { crumbs, setTitle, setTitleFor }
}
