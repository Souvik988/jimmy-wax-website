import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Magnetic } from "../components/fx/Magnetic";
import { Reveal } from "../components/fx/Reveal";
import { SplitText } from "../components/fx/SplitText";
import { MediaLoop } from "../components/fx/MediaLoop";
import { ObjectStory } from "../components/ObjectStory";
import type { Product } from "../data/products";
import { useCatalog } from "../lib/catalog";
import { inr } from "../lib/api";
import { useExperience } from "../lib/experience";
import { usePageSeo } from "../lib/pageSeo";
import { BlockList } from "../blocks/registry";
import { ProductCommunity } from "../components/ProductCommunity";

type View = "a" | "b" | "film";

function Gallery({ product, index }: { product: Product; index: number }) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("a");
  const label =
    view === "film"
      ? `${product.name} film`
      : `${product.name} view ${view === "a" ? 1 : 2}`;
  return (
    <div className="detail-visual">
      <AnimatePresence mode="wait" initial={false}>
        {view === "film" && product.motion ? (
          <motion.video
            key="film"
            className="detail-media"
            src={product.motion}
            poster={product.image}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35 }}
            aria-label={label}
          />
        ) : (
          <motion.img
            key={view}
            className="detail-media"
            src={view === "a" ? product.image : product.imageAlt}
            alt={
              view === "a"
                ? `${product.name} — ${product.format}`
                : `${product.name} alternate view`
            }
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35 }}
          />
        )}
      </AnimatePresence>
      <span className="detail-visual-tag">
        JIMMY &amp; WAX / OBJECT 0{index + 1}
      </span>
      <div className="gallery-thumbs" role="group" aria-label="Product views">
        <button
          type="button"
          className={view === "a" ? "is-active" : ""}
          onClick={() => setView("a")}
          aria-label="View 1"
        >
          <img src={product.image} alt="" />
        </button>
        <button
          type="button"
          className={view === "b" ? "is-active" : ""}
          onClick={() => setView("b")}
          aria-label="View 2"
        >
          <img src={product.imageAlt} alt="" />
        </button>
        {product.motion && (
          <button
            type="button"
            className={view === "film" ? "is-active" : ""}
            onClick={() => setView("film")}
            aria-label="Play film"
          >
            <img src={product.imageAlt} alt="" aria-hidden="true" />
            <i aria-hidden="true">▶</i>
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductDetail({
  product,
  onNavigate,
  onAdd,
  onVariantChange,
}: {
  product: Product;
  onNavigate: (path: string) => void;
  onAdd: (product: Product) => void;
  onVariantChange?: (id: string) => void;
}) {
  const { products, settings } = useCatalog();
  const exp = useExperience();
  // A per-product template (product:<id>) overrides the shared product template.
  const override = exp.pageDoc(`product:${product.id}`);
  const template = override ?? exp.pageDoc("product");
  const sections = template?.nativeSections;
  const show = (key: string) => {
    const s = sections?.find((x) => x.key === key);
    return s ? s.visible : true;
  };
  const blocks = template?.blocks ?? [];
  usePageSeo({
    key: "product",
    overrideKey: `product:${product.id}`,
    title: product.name,
    description: product.description,
    path: `/shop/${product.id}`,
    product,
  });
  const index = Math.max(
    0,
    products.findIndex((p) => p.id === product.id),
  );
  const pairings = products.filter((p) => p.id !== product.id);
  return (
    <>
      <section className="product-detail">
        <button
          className="back-link"
          type="button"
          onClick={() => onNavigate("/shop")}
        >
          ← Back to objects
        </button>
        <div
          className={`product-detail-grid${show("gallery") ? "" : " product-detail-grid--single"}`}
        >
          {show("gallery") && (
            <Reveal>
              <Gallery product={product} index={index} />
            </Reveal>
          )}
          <Reveal className="detail-copy" delay={0.12}>
            <p className="kicker">
              {product.sequence} · {product.format} · {product.size}
            </p>
            <SplitText as="h1" immediate delay={0.15} lines={[product.name]} />
            <p className="detail-price">
              {inr(product.pricePaise)}
              {product.comparePaise ? (
                <s className="was">{inr(product.comparePaise)}</s>
              ) : null}
              <small>
                {product.note}
                {settings?.taxInclusive ? " · inclusive of GST" : ""}
              </small>
            </p>
            {(product.variants?.length ?? 0) > 1 && (
              <label className="field">
                <span>Choose a variant</span>
                <select
                  aria-label="Product variant"
                  value={product.variantId}
                  onChange={(e) => onVariantChange?.(e.target.value)}
                >
                  {product.variants!.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} · {inr(v.pricePaise)}
                      {v.available ? "" : " · unavailable"}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {show("description") && <p>{product.description}</p>}
            <dl>
              {show("description") && (
                <div>
                  <dt>How to use</dt>
                  <dd>{product.ritual}</dd>
                </div>
              )}
              {show("delivery_estimate") && (
                <div>
                  <dt>Availability</dt>
                  <dd>
                    {product.available
                      ? `In stock${product.availableQuantity < 10 ? ` — only ${product.availableQuantity} left` : ""}.${settings?.codEnabled ? " Cash on Delivery available." : ""}${settings?.deliveryEstimate ? ` Delivery: ${settings.deliveryEstimate}.` : ""}`
                      : "Currently unavailable."}
                  </dd>
                </div>
              )}
            </dl>
            <Magnetic strength={0.2}>
              <button
                className="solid-button"
                type="button"
                disabled={!product.available}
                onClick={() => onAdd(product)}
              >
                {product.available ? "Add to care list" : "Unavailable"}{" "}
                <span className="arr" aria-hidden="true">
                  ↗
                </span>
              </button>
            </Magnetic>
          </Reveal>
        </div>

        {/* mobile purchase bar is rendered at App level (outside the route
            transition wrapper, whose transform would break position: fixed) */}

        <ProductCommunity productId={product.id} />
        {show("pairings") && show("related") && pairings.length > 0 && (
          <section className="pairing" aria-label="Complete the ritual">
            <Reveal>
              <h2>Complete the ritual</h2>
            </Reveal>
            <div className="pairing-grid">
              {pairings.map((pair, i) => (
                <Reveal key={pair.id} delay={i * 0.08}>
                  <button
                    className="pairing-card"
                    type="button"
                    onClick={() => onNavigate(`/shop/${pair.id}`)}
                  >
                    <img src={pair.image} alt="" />
                    <span>
                      <p>{pair.format}</p>
                      <h3>{pair.name}</h3>
                      <span className="go">View object ↗</span>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {product.story.length > 0 && <ObjectStory product={product} />}

        {product.motion && (
          <section className="motion-window">
            <Reveal>
              <p className="kicker">Object in light</p>
              <h2>Small movement. Exact object.</h2>
              <div className="film-frame">
                <MediaLoop
                  src={product.motion}
                  poster={product.image}
                  alt={`${product.name} presented under a warm studio light`}
                />
              </div>
              <div className="film-caption">
                <span>Product-true motion plate</span>
                <span>Loop · silent</span>
              </div>
            </Reveal>
          </section>
        )}
      </section>
      {blocks.length > 0 && <BlockList blocks={blocks} />}
    </>
  );
}
