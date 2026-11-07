import { useEffect, useState, useSyncExternalStore } from "react";
import { apiPages, authedApi, session } from "../lib/api";
import { customer } from "../lib/customer";
import { useNav } from "../lib/nav";
interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
}
export function ProductCommunity({ productId }: { productId: string }) {
  const signedIn = useSyncExternalStore(session.subscribe, session.isSignedIn),
    nav = useNav();
  const [reviews, setReviews] = useState<Review[] | null>(null),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5),
    [title, setTitle] = useState(""),
    [body, setBody] = useState("");
  useEffect(() => {
    let active = true;
    setReviews(null);
    setError("");
    apiPages<Review>("/v1/products/" + productId + "/reviews?limit=50")
      .then((r) => {
        if (active) setReviews(r);
      })
      .catch(() => {
        if (active) setError("Reviews could not be loaded.");
      });
    if (signedIn)
      customer
        .wishlist()
        .then((items) => {
          if (active) setSaved(items.some((x) => x.productId === productId));
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId, signedIn]);
  return (
    <section className="checkout">
      <h2>Keep it in mind</h2>
      <button
        className="link-button"
        disabled={busy}
        onClick={async () => {
          if (!signedIn) {
            nav.openAuth("Sign in to save this object.");
            return;
          }
          setBusy(true);
          try {
            await customer.saveWishlist(productId, !saved);
            setSaved(!saved);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {saved ? "Remove from wishlist" : "Save to wishlist"}
      </button>
      <h2>Customer reviews</h2>
      {reviews === null && !error && <p role="status">Loading reviews…</p>}
      {reviews?.length === 0 && <p>No published reviews yet.</p>}
      {reviews?.map((r) => (
        <article className="co-step" key={r.id}>
          <strong>
            {r.title} · {r.rating}/5
          </strong>
          {r.verifiedPurchase && <small> · Verified purchase</small>}
          <p>{r.body}</p>
        </article>
      ))}
      {signedIn ? (
        <form
          className="co-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              await authedApi(
                "POST",
                "/v1/products/" + productId + "/reviews",
                { rating, title, body },
              );
              setNotice(
                "Review submitted for moderation. It will appear after approval.",
              );
              setTitle("");
              setBody("");
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Your review could not be confirmed.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>Write a review</h3>
          <p>Reviews are available to verified purchasers.</p>
          <label className="field">
            Rating
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}/5
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Review title
            <input
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            Your review
            <textarea
              required
              maxLength={3000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <button className="solid-button" disabled={busy}>
            Submit review
          </button>
        </form>
      ) : (
        <button
          className="link-button"
          onClick={() => nav.openAuth("Sign in to write a review.")}
        >
          Sign in to write a review
        </button>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </section>
  );
}
