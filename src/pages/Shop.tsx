import { useEffect, useState } from "react";
import { Magnetic } from "../components/fx/Magnetic";
import { HoverFilm } from "../components/fx/HoverFilm";
import { MediaLoop } from "../components/fx/MediaLoop";
import { Reveal } from "../components/fx/Reveal";
import { SplitText } from "../components/fx/SplitText";
import { TiltCard } from "../components/fx/TiltCard";
import type { Product } from "../data/products";
import { useCatalog } from "../lib/catalog";
import { inr } from "../lib/api";
import { BlockList } from "../blocks/registry";
import { usePageSeo } from "../lib/pageSeo";
import { usePublishedBlocks } from "./Pages";
import { apiPages } from "../lib/api";
import { toProduct, type ApiProduct } from "../data/products";

function CatalogCard({
  product,
  index,
  onNavigate,
  onAdd,
}: {
  product: Product;
  index: number;
  onNavigate: (path: string) => void;
  onAdd: (product: Product) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <TiltCard className="catalog-card">
      <button
        className="catalog-visual"
        aria-label={`View ${product.name}`}
        type="button"
        onClick={() => onNavigate(`/shop/${product.id}`)}
        data-cursor="View"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img src={product.image} alt={`${product.name} — ${product.format}`} />
        <img className="alt" src={product.imageAlt} alt="" aria-hidden="true" />
        <HoverFilm
          className="hover-film"
          src={product.motion}
          active={hovered}
        />
        <span>0{index + 1}</span>
      </button>
      <div>
        <p className="sequence-note">
          {String(index + 1).padStart(2, "0")} · {product.sequence}
        </p>
        <p>
          {product.format} · {product.size}
        </p>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <div className="catalog-action">
          <strong>
            {inr(product.pricePaise)}
            {product.comparePaise ? (
              <s className="was">{inr(product.comparePaise)}</s>
            ) : null}
          </strong>
          <div className="catalog-actions">
            <button
              className="quick-add"
              type="button"
              disabled={!product.available}
              onClick={() => onAdd(product)}
              aria-label={`Add ${product.name} to care list`}
            >
              {product.available ? "+ Care list" : "Unavailable"}
            </button>
            <button
              type="button"
              onClick={() => onNavigate(`/shop/${product.id}`)}
            >
              View{" "}
              <span className="arr" aria-hidden="true">
                ↗
              </span>
            </button>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

export function Shop({
  onNavigate,
  onAdd,
}: {
  onNavigate: (path: string) => void;
  onAdd: (product: Product) => void;
}) {
  const published = usePublishedBlocks("shop");
  usePageSeo({
    key: "shop",
    title: "Shop",
    description:
      "Leather polish, kits and care sets from Jimmy & Wax, with prices inclusive of GST.",
    path: "/shop",
  });
  if (published) {
    // The published page decides the editorial blocks; the catalogue itself is always reachable.
    const hasListing = published.some(
      (b) => b.type === "web.collection_grid" || b.type === "web.product_grid",
    );
    return (
      <div className="jw-custom-page">
        <BlockList blocks={published} />
        {!hasListing && <Catalog onNavigate={onNavigate} onAdd={onAdd} />}
      </div>
    );
  }
  return <NativeShop onNavigate={onNavigate} onAdd={onAdd} />;
}

function Catalog({
  onNavigate,
  onAdd,
}: {
  onNavigate: (path: string) => void;
  onAdd: (product: Product) => void;
}) {
  const { products, status, reload } = useCatalog();
  const params = new URLSearchParams(window.location.search),
    category = params.get("category"),
    collection = params.get("collection"),
    search = params.get("q")?.toLowerCase();
  const [collectionProducts, setCollectionProducts] = useState<
    Product[] | null
  >(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setCollectionProducts(null);
    setCollectionError(null);
    if (collection) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(collection)) {
        setCollectionError("Invalid collection.");
        return;
      }
      apiPages<ApiProduct>("/v1/collections/" + collection + "/products")
        .then((items) => {
          if (active) setCollectionProducts(items.map(toProduct));
        })
        .catch(() => {
          if (active)
            setCollectionError("This collection could not be loaded.");
        });
    }
    return () => {
      active = false;
    };
  }, [collection, attempt]);
  const shown = (collection ? (collectionProducts ?? []) : products).filter(
    (p) =>
      (!category || p.categoryId === category) &&
      (!search ||
        (p.name + " " + p.description).toLowerCase().includes(search)),
  );
  return (
    <section className="catalog-grid" aria-label="The objects">
      {collectionError && (
        <p role="alert">
          {collectionError}{" "}
          <button onClick={() => setAttempt((x) => x + 1)}>Try again</button>
        </p>
      )}
      {collection && collectionProducts === null && !collectionError && (
        <p role="status">Loading collection…</p>
      )}
      {status === "ready" &&
        (!collection || collectionProducts !== null) &&
        !shown.length &&
        !collectionError && <p>No products match this selection.</p>}
      {status === "error" && products.length === 0 && (
        <p className="shop-state">
          The collection could not be loaded.{" "}
          <button className="link-button" type="button" onClick={reload}>
            Try again
          </button>
        </p>
      )}
      {status === "loading" && (
        <p className="shop-state" role="status">
          Loading the collection…
        </p>
      )}
      {shown.map((product, index) => (
        <Reveal key={product.id} delay={index * 0.08} y={40}>
          <CatalogCard
            product={product}
            index={index}
            onNavigate={onNavigate}
            onAdd={onAdd}
          />
        </Reveal>
      ))}
    </section>
  );
}

function NativeShop({
  onNavigate,
  onAdd,
}: {
  onNavigate: (path: string) => void;
  onAdd: (product: Product) => void;
}) {
  const { settings } = useCatalog();
  const policyLine = [
    settings?.taxInclusive ? "All prices include GST." : "",
    settings?.codEnabled ? "Cash on Delivery is available." : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <>
      <section className="commerce-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="kicker">The object library / 03</p>
            <SplitText
              as="h1"
              immediate
              delay={0.1}
              lines={["Care, arranged", "like a collection."]}
            />
            <Reveal delay={0.4}>
              <p>
                Practical formats in a deliberate order: begin with the
                signature polish, pair it with a cloth, then complete the set.
                {policyLine ? ` ${policyLine}` : ""}
              </p>
            </Reveal>
          </div>
          <Reveal className="hero-visual" delay={0.25}>
            <MediaLoop
              src="/media/generated/video/desktop/hero-collection-film-1080p.mp4"
              poster="/media/products/collection-still.jpg"
              alt="The full Jimmy and Wax collection — bottle, kit, brush and cloth under the studio key light"
            />
            <span>The collection · in one take</span>
          </Reveal>
        </div>
      </section>
      <Catalog onNavigate={onNavigate} onAdd={onAdd} />
      <section className="media-band" aria-label="The material in motion">
        <Reveal>
          <MediaLoop
            src="/media/generated/video/desktop/materials-macro-web-v1.mp4"
            poster="/media/generated/stills/scroll-world/polish-world-v1.webp"
            alt="Macro study of leather, walnut and brass under a warm studio light"
          />
        </Reveal>
        <Reveal className="media-band-copy" delay={0.15}>
          <p className="kicker">The material, in motion</p>
          <h2>
            Grain, brass and
            <br />a patient hand.
          </h2>
          <p>
            Every object is built around what the material already does: leather
            takes light, walnut holds it, brass returns it. The film studies
            that exchange at macro scale.
          </p>
        </Reveal>
      </section>
      <section className="note-band" aria-label="A deliberate collection">
        <img
          src="/media/products/story/twinkle-shine-care-kit-2.jpg"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="note-band-scrim" aria-hidden="true" />
        <Reveal className="note-band-copy">
          <p className="kicker">A deliberate collection</p>
          <h2>
            Less clutter.
            <br />
            More finish.
          </h2>
          <p>
            Each object has one role in the sequence, so the ritual stays easy
            to return to — clean, coat, buff, done.
          </p>
          <button type="button" onClick={() => onNavigate("/ritual")}>
            See the ritual <span aria-hidden="true">↓</span>
          </button>
        </Reveal>
      </section>
    </>
  );
}
