import { useEffect, useState } from "react";
import type { Order } from "../lib/shop";
import { customer, download, type ReturnRecord } from "../lib/customer";
import { ApiError } from "../lib/api";
export function PostPurchase({ order }: { order: Order }) {
  const [returns, setReturns] = useState<ReturnRecord[] | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const load = () => customer.returns(order.id).then(setReturns);
  useEffect(() => {
    let active = true;
    customer
      .returns(order.id)
      .then((r) => {
        if (active) setReturns(r);
      })
      .catch(() => {
        if (active) setError("Return history could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [order.id]);
  const open = returns?.some(
    (r) => !["rejected", "closed", "cancelled", "refunded"].includes(r.status),
  );
  return (
    <section className="co-step">
      <h2>Documents & returns</h2>
      <button
        className="link-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            download(
              "invoice-" + order.orderNumber + ".html",
              await customer.invoice(order.id),
              "text/html",
            );
            setNotice("Invoice downloaded.");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Invoice unavailable.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Download invoice
      </button>
      {returns === null && !error && (
        <p role="status">Loading return history…</p>
      )}
      {returns?.map((r) => (
        <article key={r.id}>
          <strong>Return: {r.status.replaceAll("_", " ")}</strong>
          <p>{r.reason}</p>
          {r.decisionNote && <p>{r.decisionNote}</p>}
        </article>
      ))}
      {order.status === "delivered" && !open && (
        <form
          className="co-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || uncertain) return;
            setBusy(true);
            setError("");
            try {
              await customer.requestReturn(
                order.id,
                reason,
                Object.entries(quantities)
                  .filter(([, n]) => n > 0)
                  .map(([id, quantity]) => ({
                    orderItemId: Number(id),
                    quantity,
                  })),
              );
              await load();
              setNotice("Return request submitted. The store will review it.");
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Request could not be confirmed.",
              );
              setUncertain(!(e instanceof ApiError) || e.status === 0 || e.status >= 500);
              await load().catch(() => {});
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>Request a return</h3>
          <p>
            Eligibility and the return window are checked by the store. Select
            the quantities you want to return.
          </p>
          {order.lines.map((line) => (
            <label className="field" key={line.variantId}>
              {line.productName}
              <input
                aria-label={"Return quantity for " + line.productName}
                type="number"
                min={0}
                max={line.quantity}
                disabled={!line.orderItemId}
                value={quantities[line.orderItemId ?? 0] ?? 0}
                onChange={(e) =>
                  setQuantities((q) => ({
                    ...q,
                    [line.orderItemId!]: Number(e.target.value),
                  }))
                }
              />
            </label>
          ))}
          <label className="field">
            Reason
            <textarea
              required
              minLength={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            className="solid-button"
            disabled={
              busy || uncertain || !Object.values(quantities).some((n) => n > 0)
            }
          >
            Submit return request
          </button>
          {uncertain && (
            <p role="status">
              Check your return history before trying again. Reload this page to
              refresh the server record.
            </p>
          )}
        </form>
      )}
      {order.status !== "delivered" && (
        <p>
          Returns become available after delivery, subject to the published
          return policy.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          <button
            className="link-button"
            onClick={() =>
              void load()
                .then(() => setError(""))
                .catch(() => setError("Return history is still unavailable."))
            }
          >
            Refresh history
          </button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
