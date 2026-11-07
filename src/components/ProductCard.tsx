import { useState } from 'react'
import { Magnetic } from './fx/Magnetic'
import { HoverFilm } from './fx/HoverFilm'
import { TiltCard } from './fx/TiltCard'
import type { Product } from '../data/products'
import { inr } from '../lib/api'
import { useNav } from '../lib/nav'
import { withPreview } from '../lib/preview'

/** One catalogue card. Prices are integer paise from the API, formatted with Intl — never typed in by hand. */
export function ProductCard({ product, index, plain = false, hoverFilm = true }: { product: Product; index: number; plain?: boolean; hoverFilm?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const nav = useNav()
  const href = withPreview(`/shop/${product.id}`)
  const open = () => nav.navigate(`/shop/${product.id}`)
  const body = (
    <>
      <div
        className="product-image"
        data-cursor="View"
        onClick={open}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img src={product.image} alt={`${product.name} — ${product.format}`} loading="lazy" decoding="async" />
        <img className="alt" src={product.imageAlt} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        {hoverFilm && <HoverFilm className="hover-film" src={product.motion} active={hovered} />}
        <span>{String(index + 1).padStart(2, '0')}</span>
        <em>JIMMY &amp; WAX</em>
      </div>
      <div className="product-meta">
        <p className="product-seq">{String(index + 1).padStart(2, '0')}{product.sequence ? ` · ${product.sequence}` : ''}</p>
        <p className="format">{product.format}</p>
        <h2>
          <a className="name-link" href={href} onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); open() } }}>{product.name}</a>
        </h2>
        <p className="desc">{product.description}</p>
        <div className="product-buy">
          <span className="price-chip">{inr(product.pricePaise)}{product.comparePaise ? <s className="was">{inr(product.comparePaise)}</s> : null}<small>{product.note}</small></span>
          <Magnetic strength={.2}>
            <button className="btn-brutal" type="button" disabled={!product.available} onClick={() => nav.addToCart(product)}>{product.available ? '+ Care list' : 'Unavailable'}</button>
          </Magnetic>
        </div>
      </div>
    </>
  )
  return plain ? <div className="product-card product-card--plain">{body}</div> : <TiltCard className="product-card">{body}</TiltCard>
}
