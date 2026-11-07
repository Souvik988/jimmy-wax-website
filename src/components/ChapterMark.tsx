import { Reveal } from './fx/Reveal'

/**
 * Brutalist chapter divider: boxed numeral, uppercase title, hairline rule,
 * plus ornament. The scroll's metronome — every chapter gets one.
 */
export function ChapterMark({ index, title, tone = 'dark' }: { index: string; title: string; tone?: 'dark' | 'light' }) {
  return (
    <Reveal className={`chapter-mark chapter-mark--${tone}`} aria-hidden="true">
      <span className="chapter-mark__index">{index}</span>
      <span className="chapter-mark__title">{title}</span>
      <i className="chapter-mark__rule" />
      <b className="chapter-mark__plus">+</b>
    </Reveal>
  )
}
