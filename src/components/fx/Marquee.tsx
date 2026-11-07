import { Fragment } from 'react'

/**
 * Slow editorial marquee. The row is repeated three times for a seamless
 * loop; one accessible label describes the content, the copies are hidden.
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <div className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className="marquee__item">{i % 2 === 1 ? <em>{item}</em> : item}<i /></span>
        </Fragment>
      ))}
    </div>
  )
  return (
    <div className={className ? `marquee ${className}` : 'marquee'} aria-label={items.join(', ')}>
      <div className="marquee__track">{row(false)}{row(true)}{row(true)}</div>
    </div>
  )
}
