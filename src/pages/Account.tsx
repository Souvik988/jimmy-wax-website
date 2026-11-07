import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { auth, session, inr } from "../lib/api";
import {
  customer,
  download,
  type Profile,
  type Notification,
} from "../lib/customer";
import { shop, type Address } from "../lib/shop";
import { useCatalog } from "../lib/catalog";
import { AddressForm } from "./Checkout";

const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "The request could not be completed.";
export function Account({
  path,
  onNavigate,
  onSignIn,
}: {
  path: string;
  onNavigate: (path: string) => void;
  onSignIn: (reason: string) => void;
}) {
  const signedIn = useSyncExternalStore(session.subscribe, session.isSignedIn);
  if (!signedIn)
    return (
      <section className="checkout">
        <h1>Your account</h1>
        <button
          className="solid-button"
          onClick={() => onSignIn("Sign in to manage your account.")}
        >
          Sign in
        </button>
      </section>
    );
  return (
    <section className="checkout">
      <h1>Your account</h1>
      <nav className="co-actions" aria-label="Account sections">
        {[
          ["/account", "Profile & security"],
          ["/account/addresses", "Addresses"],
          ["/account/wishlist", "Wishlist"],
          ["/account/notifications", "Notifications"],
          ["/orders", "Orders"],
        ].map(([url, label]) => (
          <button
            key={url}
            className="link-button"
            aria-current={path === url ? "page" : undefined}
            onClick={() => onNavigate(url!)}
          >
            {label}
          </button>
        ))}
      </nav>
      {path.endsWith("/addresses") ? (
        <Addresses />
      ) : path.endsWith("/wishlist") ? (
        <Wishlist onNavigate={onNavigate} />
      ) : path.endsWith("/notifications") ? (
        <Notifications onNavigate={onNavigate} />
      ) : (
        <ProfileSettings onNavigate={onNavigate} />
      )}
    </section>
  );
}
function AsyncPanel({
  error,
  children,
}: {
  error: string | null;
  children: ReactNode;
}) {
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {children}
    </>
  );
}
function ProfileSettings({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [proof, setProof] = useState(""),
    [confirm, setConfirm] = useState(""),
    [deletionPhone, setDeletionPhone] = useState("");
  useEffect(() => {
    let active = true;
    customer
      .profile()
      .then((p) => {
        if (active) {
          setProfile(p);
          setName(p.fullName);
          setPhone(p.phone ?? "");
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, []);
  const run = async (action: () => Promise<unknown>, success: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      await action();
      setNotice(success);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AsyncPanel error={error}>
      {!profile && !error && <p role="status">Loading account…</p>}
      {profile && (
        <>
          <form
            className="co-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(
                () => customer.saveProfile(name, phone),
                "Profile saved.",
              );
            }}
          >
            <h2>Contact details</h2>
            <label className="field">
              Full name
              <input
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="field">
              Contact phone
              <input
                value={phone}
                maxLength={20}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>
            <p>{profile.email ?? profile.accountPhone}</p>
            <button className="solid-button" disabled={busy}>
              Save profile
            </button>
          </form>
          <form
            className="co-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(
                () => customer.preferences(profile.preferences),
                "Preferences saved.",
              );
            }}
          >
            <h2>Communication preferences</h2>
            {(["orderUpdates", "offersAndCareTips"] as const).map((key) => (
              <label className="co-address" key={key}>
                <input
                  type="checkbox"
                  checked={profile.preferences[key]}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        [key]: e.target.checked,
                      },
                    })
                  }
                />
                <span>
                  {key === "orderUpdates"
                    ? "Order updates"
                    : "Offers and care tips"}
                </span>
              </label>
            ))}
            <button className="solid-button" disabled={busy}>
              Save preferences
            </button>
          </form>
          <div className="co-step">
            <h2>Account security</h2>
            {profile.email && (
              <button
                className="link-button"
                onClick={() => onNavigate("/password-reset")}
              >
                Reset password or verify email
              </button>
            )}
            <button
              className="link-button"
              disabled={busy}
              onClick={() =>
                void run(
                  async () =>
                    download(
                      "jimmy-wax-account.json",
                      JSON.stringify(await customer.export(), null, 2),
                    ),
                  "Account export downloaded.",
                )
              }
            >
              Download my data
            </button>
            <button
              className="link-button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await auth.signOut();
                  onNavigate("/shop");
                }, "Signed out.")
              }
            >
              Sign out
            </button>
          </div>
          <form
            className="co-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await customer.delete(
                  profile.email ? { password: proof } : { code: proof },
                );
                await auth.signOut();
                onNavigate("/shop");
              }, "Account deleted.");
            }}
          >
            <h2>Delete account</h2>
            <p>
              Your account data will be erased. Financial order records are
              retained. Complete or cancel open orders first.
            </p>
            {!profile.email && (
              <label className="field">
                Your registered mobile number
                <input
                  value={deletionPhone}
                  onChange={(e) => setDeletionPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
            )}
            {!profile.email && (
              <button
                className="link-button"
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => auth.requestOtp(deletionPhone),
                    "A fresh confirmation code has been requested.",
                  )
                }
              >
                Request deletion code
              </button>
            )}
            <label className="field">
              {profile.email ? "Current password" : "Fresh 6-digit code"}
              <input
                required
                type={profile.email ? "password" : "text"}
                inputMode={profile.email ? "text" : "numeric"}
                autoComplete={
                  profile.email ? "current-password" : "one-time-code"
                }
                value={proof}
                onChange={(e) => setProof(e.target.value)}
              />
            </label>
            <label className="field">
              Type DELETE to confirm
              <input
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <button
              className="solid-button"
              disabled={busy || confirm !== "DELETE"}
            >
              Permanently delete my account
            </button>
          </form>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
    </AsyncPanel>
  );
}
function Addresses() {
  const [items, setItems] = useState<Address[] | null>(null),
    [editing, setEditing] = useState<Address | true | null>(null),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const load = () =>
    shop
      .addresses()
      .then(setItems)
      .catch((e) => setError(message(e)));
  useEffect(() => {
    void load();
  }, []);
  return (
    <AsyncPanel error={error}>
      <h2>Delivery addresses</h2>
      {!items && !error && <p role="status">Loading addresses…</p>}
      {items?.map((a) => (
        <div className="co-step" key={a.id}>
          <strong>{a.recipientName}</strong>
          <p>
            {a.line1}, {a.city}, {a.state} {a.postalCode}
          </p>
          <div className="co-actions">
            <button className="link-button" onClick={() => setEditing(a)}>
              Edit address
            </button>
            <button
              className="link-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await shop.deleteAddress(a.id);
                  await load();
                } catch (e) {
                  setError(message(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete address
            </button>
          </div>
        </div>
      ))}
      {editing ? (
        <AddressForm
          initial={editing === true ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : (
        <button className="solid-button" onClick={() => setEditing(true)}>
          Add an address
        </button>
      )}
    </AsyncPanel>
  );
}
function Wishlist({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { products } = useCatalog(),
    [ids, setIds] = useState<string[] | null>(null),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    customer
      .wishlist()
      .then((items) => setIds(items.map((i) => i.productId)))
      .catch((e) => setError(message(e)));
  }, []);
  return (
    <AsyncPanel error={error}>
      <h2>Saved objects</h2>
      {ids === null && !error && <p role="status">Loading wishlist…</p>}
      {ids?.length === 0 && <p>Your wishlist is empty.</p>}
      {ids?.map((id) => {
        const p = products.find((p) => p.id === id);
        return (
          <div className="co-step" key={id}>
            <button
              className="link-button"
              onClick={() => onNavigate("/shop/" + id)}
            >
              {p?.name ?? "Product currently unavailable"}
              {p ? " · " + inr(p.pricePaise) : ""}
            </button>
            <button
              className="link-button"
              onClick={async () => {
                try {
                  await customer.saveWishlist(id, false);
                  setIds((current) => current?.filter((x) => x !== id) ?? []);
                } catch (e) {
                  setError(message(e));
                }
              }}
            >
              Remove
            </button>
          </div>
        );
      })}
    </AsyncPanel>
  );
}
function Notifications({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [items, setItems] = useState<Notification[] | null>(null),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    customer
      .notifications()
      .then(setItems)
      .catch((e) => setError(message(e)));
  }, []);
  return (
    <AsyncPanel error={error}>
      <h2>Notifications</h2>
      {items === null && !error && <p role="status">Loading notifications…</p>}
      {items?.length === 0 && <p>You are up to date.</p>}
      {items?.map((item) => (
        <article className="co-step" key={item.id}>
          <h3>
            {item.title}
            {!item.read ? " · New" : ""}
          </h3>
          <p>{item.body}</p>
          <time>{new Date(item.createdAt).toLocaleString("en-IN")}</time>
          <div className="co-actions">
            {item.data?.orderId && (
              <button
                className="link-button"
                onClick={() => onNavigate("/orders/" + item.data!.orderId)}
              >
                View order
              </button>
            )}
            {!item.read && (
              <button
                className="link-button"
                onClick={async () => {
                  try {
                    await customer.markRead(item.id);
                    setItems(
                      (current) =>
                        current?.map((n) =>
                          n.id === item.id ? { ...n, read: true } : n,
                        ) ?? [],
                    );
                  } catch (e) {
                    setError(message(e));
                  }
                }}
              >
                Mark read
              </button>
            )}
          </div>
        </article>
      ))}
    </AsyncPanel>
  );
}
