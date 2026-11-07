import { useEffect, useState } from "react";
import { customer, type ContentPage } from "../lib/customer";
import { useCatalog } from "../lib/catalog";
import { Markdown } from "../lib/markdown";
export function PolicyPage({ slug }: { slug: string }) {
  const [page, setPage] = useState<ContentPage | null>(null),
    [error, setError] = useState<string | null>(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setPage(null);
    setError(null);
    void (async () => {
      const index = await customer.contents();
      const match =
        index.find((x) => x.slug === slug) ??
        index.find((x) =>
          (x.slug + " " + x.title).toLowerCase().includes(slug),
        );
      const value = await customer.content(match?.slug ?? slug);
      if (active) setPage(value);
    })().catch(() => {
      if (active)
        setError(
          "This policy is not currently published. Please contact the store for the official copy.",
        );
    });
    return () => {
      active = false;
    };
  }, [slug, attempt]);
  return (
    <section className="checkout">
      <h1>{page?.title ?? slug.replaceAll("-", " ")}</h1>
      {!page && !error && <p role="status">Loading published policy…</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button
            className="link-button"
            onClick={() => setAttempt((x) => x + 1)}
          >
            Retry
          </button>
        </p>
      )}
      {page && (
        <>
          <p className="auth-note">Published version {page.version}</p>
          <Markdown source={page.bodyMd} />
        </>
      )}
    </section>
  );
}
export function Support({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { settings } = useCatalog();
  return (
    <section className="checkout">
      <h1>Help & support</h1>
      <p>
        For help with a delivery, return or payment, include your order number
        when you contact us.
      </p>
      {settings?.supportEmail && (
        <p>
          <a href={"mailto:" + settings.supportEmail}>
            {settings.supportEmail}
          </a>
        </p>
      )}
      {settings?.supportPhone && (
        <p>
          <a href={"tel:" + settings.supportPhone.replace(/[^\d+]/g, "")}>
            {settings.supportPhone}
          </a>
        </p>
      )}
      {!settings?.supportEmail && !settings?.supportPhone && (
        <p role="status">Store contact details have not been published yet.</p>
      )}
      <button className="solid-button" onClick={() => onNavigate("/orders")}>
        Find my order
      </button>
      <nav className="co-actions">
        {["terms", "privacy", "shipping", "returns"].map((slug) => (
          <button
            key={slug}
            className="link-button"
            onClick={() => onNavigate("/policies/" + slug)}
          >
            {slug}
          </button>
        ))}
      </nav>
    </section>
  );
}
