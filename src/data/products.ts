import { mediaUrl } from "../lib/media";
export type StoryBlock = { image: string; title: string; body: string };
export interface ProductVariant {
  id: string;
  title: string;
  pricePaise: number;
  comparePaise: number | null;
  available: boolean;
  availableQuantity: number;
}

/**
 * A storefront product = what the BACKEND says (id, name, price, stock) + how the website presents it
 * (photography, film, story). The backend is the only source of truth for name, price and availability;
 * nothing below may hard-code a price.
 */
export type Product = {
  /** Backend product id (also the URL slug). */
  id: string;
  /** Backend variant id: what the cart and checkout reference. */
  variantId: string;
  categoryId?: string;
  variants?: ProductVariant[];
  name: string;
  format: string;
  sequence: string;
  image: string;
  imageAlt: string;
  /** Optional brand film; products without one simply show stills. */
  motion?: string;
  description: string;
  /** Availability line shown where the old "proposed price" note used to be. */
  note: string;
  /** Final price in rupees (derived from integer paise). */
  price: number;
  pricePaise: number;
  comparePaise: number | null;
  size: string;
  ritual: string;
  story: StoryBlock[];
  available: boolean;
  availableQuantity: number;
};

type Presentation = Pick<
  Product,
  "format" | "sequence" | "image" | "imageAlt" | "motion" | "ritual" | "story"
>;

const storyRoot = "/media/products/story";

/** Keyed by backend product id. Products missing here still render, with a neutral presentation. */
export const PRESENTATION: Record<string, Presentation> = {
  "twinkle-shine-leather-polish": {
    format: "Leather polish bottle",
    sequence: "Begin here",
    image: "/media/generated/products/twinkle-shine-catalog-v1.webp",
    imageAlt: "/media/generated/products/twinkle-shine-catalog-v2.webp",
    motion:
      "/media/generated/video/commerce/twinkle-shine-bottle-motion-v2.mp4",
    ritual:
      "Apply a small amount, rest for one minute, then buff with a clean cloth.",
    story: [
      {
        image: `${storyRoot}/twinkle-shine-bottle-2.jpg`,
        title: "The application",
        body: "A little Twinkle Shine, dispensed onto a soft cloth — never straight onto the leather.",
      },
      {
        image: `${storyRoot}/twinkle-shine-bottle-3.jpg`,
        title: "The companions",
        body: "A clean cloth and a firm brush do the quiet work between coats.",
      },
      {
        image: `${storyRoot}/twinkle-shine-bottle-1.jpg`,
        title: "The result",
        body: "Grain fed, edges sharp, light returning along the toe.",
      },
    ],
  },
  "polish-cloth-kit": {
    format: "Polish and cloth kit",
    sequence: "A quick shine",
    image: "/media/catalog/polish-cloth-kit.jpg",
    imageAlt: "/media/catalog/polish-cloth-kit.jpg",
    ritual:
      "Apply a small amount of polish with the cloth, let it rest, then buff. Test a discreet area first.",
    story: [],
  },
  "complete-care-kit": {
    format: "Boxed leather-care set",
    sequence: "The complete set",
    image: "/media/generated/products/care-kit-catalog-v1.webp",
    imageAlt: "/media/generated/products/care-kit-catalog-v2.webp",
    motion:
      "/media/generated/video/commerce/twinkle-shine-care-kit-motion-v1.mp4",
    ritual:
      "Brush away surface dust, apply polish, then finish with the included cloth.",
    story: [
      {
        image: `${storyRoot}/twinkle-shine-care-kit-1.jpg`,
        title: "The box",
        body: "A kraft window box: polish, cloth and brush visible and within reach.",
      },
      {
        image: `${storyRoot}/twinkle-shine-care-kit-2.jpg`,
        title: "The spread",
        body: "Pouches, sponges and a note of thanks — everything the ritual asks for.",
      },
      {
        image: `${storyRoot}/twinkle-shine-care-kit-3.jpg`,
        title: "The family",
        body: "The full Twinkle Shine range, staged as it lives on the shelf.",
      },
    ],
  },
  "black-shoe-care": {
    format: "Black-shoe care set",
    sequence: "For black shoes",
    image: "/media/catalog/black-shoe-care.jpg",
    imageAlt: "/media/catalog/black-shoe-care.jpg",
    ritual:
      "Follow the directions supplied with each item and test a discreet area first.",
    story: [],
  },
};

/** Shape of one item from GET /v1/products. */
export interface ApiProduct {
  id: string;
  categoryId: string;
  name: string;
  subtitle: string;
  description: string;
  variant: ProductVariant;
  variants?: ProductVariant[];
  media?: Array<{ url?: string | null; assetPath?: string; alt?: string }>;
}

export function toProduct(a: ApiProduct): Product {
  const p = PRESENTATION[a.id];
  const v = a.variant;
  const gallery = (a.media ?? []).flatMap((m) => {
    const url = mediaUrl(m.url ?? m.assetPath);
    return url ? [url] : [];
  });
  return {
    id: a.id,
    variantId: v.id,
    variants: a.variants?.length ? a.variants : [v],
    categoryId: a.categoryId,
    name: a.name,
    format: p?.format ?? a.subtitle,
    sequence: p?.sequence ?? "",
    image: gallery[0] ?? p?.image ?? "/media/products/collection-still.jpg",
    imageAlt:
      gallery[1] ??
      gallery[0] ??
      p?.imageAlt ??
      p?.image ??
      "/media/products/collection-still.jpg",
    motion: p?.motion,
    description: a.description,
    note: v.available ? "In stock" : "Currently unavailable",
    price: v.pricePaise / 100,
    pricePaise: v.pricePaise,
    comparePaise: v.comparePaise,
    size: v.title,
    ritual: p?.ritual ?? a.description,
    story: p?.story ?? [],
    available: v.available,
    availableQuantity: v.availableQuantity,
  };
}

export function selectVariant(product: Product, id: string): Product {
  const variant = product.variants?.find((v) => v.id === id);
  return variant
    ? {
        ...product,
        variantId: variant.id,
        pricePaise: variant.pricePaise,
        price: variant.pricePaise / 100,
        comparePaise: variant.comparePaise,
        size: variant.title,
        available: variant.available,
        availableQuantity: variant.availableQuantity,
        note: variant.available ? "In stock" : "Currently unavailable",
      }
    : product;
}
