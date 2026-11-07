import { Fragment, type ReactNode } from 'react'

/**
 * Minimal, safe Markdown → React renderer for Studio copy (rich_text, FAQ answers, journal notes).
 * Allow-list only: p, br, strong, em, ul/ol/li, h2–h4, blockquote, hr, a[https|mailto|tel|/internal].
 * Everything is emitted as React text nodes — there is no innerHTML and raw HTML is shown as plain text.
 */
export function safeHref(raw: string): string | null {
  const u = raw.trim()
  if (/[\u0000-\u001f\s\\<>"']/.test(u)) return null
  if (/^https:\/\/[^/]+/i.test(u)) {
    try { const p = new URL(u); return p.username || p.password ? null : p.href } catch { return null }
  }
  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(u)) return u
  if (/^tel:\+?[0-9()-]{4,20}$/i.test(u)) return u
  if (u.startsWith('/') && !u.startsWith('//')) return u
  return null
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|\[([^\]]+)\]\(([^)\s]+)\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const k = `${keyBase}-${i++}`
    if (m[2] ?? m[3]) out.push(<strong key={k}>{inline(m[2] ?? m[3]!, k)}</strong>)
    else if (m[4] ?? m[5]) out.push(<em key={k}>{inline(m[4] ?? m[5]!, k)}</em>)
    else {
      const href = safeHref(m[7]!)
      const external = href?.startsWith('https:')
      out.push(href
        ? <a key={k} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inline(m[6]!, k)}</a>
        : <Fragment key={k}>{m[6]}</Fragment>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function lines(text: string, key: string): ReactNode[] {
  const parts = text.split('\n')
  return parts.flatMap((l, i) => (i < parts.length - 1 ? [...inline(l, `${key}-${i}`), <br key={`${key}-br${i}`} />] : inline(l, `${key}-${i}`)))
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = source.replace(/\r\n?/g, '\n').trim().split(/\n{2,}/)
  const nodes: ReactNode[] = []
  blocks.forEach((raw, bi) => {
    const b = raw.trim()
    if (!b) return
    const key = `b${bi}`
    const head = /^(#{1,4})\s+(.+)$/s.exec(b)
    if (head && !b.includes('\n')) {
      const level = Math.min(4, Math.max(2, head[1]!.length + 1)) // # → h2, ## → h3, ### / #### → h4
      const Tag = (`h${level}`) as 'h2' | 'h3' | 'h4'
      nodes.push(<Tag key={key}>{inline(head[2]!, key)}</Tag>)
    } else if (/^(-{3,}|\*{3,})$/.test(b)) nodes.push(<hr key={key} />)
    else if (b.split('\n').every((l) => /^>\s?/.test(l))) nodes.push(<blockquote key={key}><p>{lines(b.split('\n').map((l) => l.replace(/^>\s?/, '')).join('\n'), key)}</p></blockquote>)
    else if (b.split('\n').every((l) => /^[-*]\s+/.test(l))) nodes.push(<ul key={key}>{b.split('\n').map((l, i) => <li key={i}>{inline(l.replace(/^[-*]\s+/, ''), `${key}-${i}`)}</li>)}</ul>)
    else if (b.split('\n').every((l) => /^\d+[.)]\s+/.test(l))) nodes.push(<ol key={key}>{b.split('\n').map((l, i) => <li key={i}>{inline(l.replace(/^\d+[.)]\s+/, ''), `${key}-${i}`)}</li>)}</ol>)
    else nodes.push(<p key={key}>{lines(b, key)}</p>)
  })
  return <div className={className ? `jw-md ${className}` : 'jw-md'}>{nodes}</div>
}

/** Plain-text paragraphs of a Markdown string (for places that draw their own paragraphs). */
export const paragraphs = (md: string): string[] => md.replace(/\r\n?/g, '\n').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
