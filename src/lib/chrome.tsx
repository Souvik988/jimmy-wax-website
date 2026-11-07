import { useExperience } from './experience'
import type { Action, NavLink } from './types'

/** Built-in navigation: used for any part the published `navigation` document does not supply. */
export const PAGE_LINKS: NavLink[] = [
  { id: 'nav-shop', label: 'Shop', action: { type: 'route', path: '/shop' } },
  { id: 'nav-ritual', label: 'The ritual', action: { type: 'route', path: '/ritual' } },
  { id: 'nav-story', label: 'Our standard', action: { type: 'route', path: '/story' } },
]
/** The one-page home scrolls to its chapters instead of changing page. */
export const HOME_LINKS: NavLink[] = [
  { id: 'nav-collection', label: 'Collection', action: { type: 'anchor', id: 'collection' } },
  { id: 'nav-ritual', label: 'The ritual', action: { type: 'anchor', id: 'ritual' } },
  { id: 'nav-standard', label: 'Our standard', action: { type: 'anchor', id: 'standard' } },
  { id: 'nav-stories', label: 'Stories', action: { type: 'anchor', id: 'stories' } },
  { id: 'nav-journal', label: 'Journal', action: { type: 'anchor', id: 'journal' } },
]

export function useNavLinks(where: 'home' | 'page'): { links: NavLink[]; cartLabel: string } {
  const { navigation } = useExperience()
  const links = (navigation?.links ?? []).filter((l) => l && typeof l.label === 'string' && l.action && typeof l.action === 'object' && l.label.trim())
  return {
    links: links.length ? links : where === 'home' ? HOME_LINKS : PAGE_LINKS,
    cartLabel: navigation?.cart?.label?.trim() || 'Care list',
  }
}

export function useBrand() {
  const { chrome, media } = useExperience()
  const wordmark = chrome?.brand?.wordmark?.trim() || 'JIMMY & WAX'
  const mark = chrome?.brand?.mark?.trim() || 'W'
  return {
    wordmark,
    mark,
    wordmarkImage: media(chrome?.slots?.['logo.wordmark']),
    markImage: media(chrome?.slots?.['logo.mark']),
  }
}

export type { Action }
