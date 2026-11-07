import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GrainOverlay } from "./components/fx/GrainOverlay";
import { Cursor } from "./components/fx/Cursor";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { useCart } from "./lib/cart";
import { CatalogProvider, useCatalog } from "./lib/catalog";
import { ExperienceProvider, useExperience } from "./lib/experience";
import { inr, session } from "./lib/api";
import { NavProvider, ActionLink, type NavApi } from "./lib/nav";
import { withPreview } from "./lib/preview";
import { resolveAction } from "./lib/actions";
import { AuthDialog } from "./components/AuthDialog";
const Checkout = lazy(() =>
  import("./pages/Checkout").then((m) => ({ default: m.Checkout })),
);
const Orders = lazy(() =>
  import("./pages/Orders").then((m) => ({ default: m.Orders })),
);
const OrderDetail = lazy(() =>
  import("./pages/Orders").then((m) => ({ default: m.OrderDetail })),
);
const Account = lazy(() =>
  import("./pages/Account").then((m) => ({ default: m.Account })),
);
const AccountRecovery = lazy(() =>
  import("./pages/AccountRecovery").then((m) => ({
    default: m.AccountRecovery,
  })),
);
const PolicyPage = lazy(() =>
  import("./pages/Policies").then((m) => ({ default: m.PolicyPage })),
);
const Support = lazy(() =>
  import("./pages/Policies").then((m) => ({ default: m.Support })),
);
import { initSmoothScroll } from "./lib/smoothScroll";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Ritual } from "./pages/Ritual";
import { Story } from "./pages/Story";
import { CustomPage, NotFound } from "./pages/Pages";
import { usePageSeo } from "./lib/pageSeo";
import { selectVariant } from "./data/products";

const VEIL_KEY = "jw-veil-shown-v1";

function ArrivalVeil() {
  const reduce = useReducedMotion();
  const { chrome, preview } = useExperience();
  const cfg = chrome?.veil;
  const enabled = cfg?.enabled !== false && !preview.active;
  const duration = Math.min(3000, Math.max(500, cfg?.durationMs ?? 1500));
  const [veil, setVeil] = useState(() => {
    try {
      return !sessionStorage.getItem(VEIL_KEY);
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!veil) return;
    try {
      sessionStorage.setItem(VEIL_KEY, "1");
    } catch {
      /* private mode */
    }
    const t = setTimeout(() => setVeil(false), duration);
    return () => clearTimeout(t);
  }, [veil, duration]);
  return (
    <AnimatePresence>
      {veil && enabled && (
        <motion.div
          className="veil"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0.4 } }
              : {
                  y: "-100%",
                  transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
                }
          }
        >
          <motion.div
            className="veil__inner"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              duration: reduce ? 0 : 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <span className="veil__mark">{cfg?.mark || "W"}</span>
            <span className="veil__name">{cfg?.name || "JIMMY & WAX"}</span>
            {(cfg ? cfg.subline : "The finishing touch") ? (
              <span className="veil__sub">
                {cfg ? cfg.subline : "The finishing touch"}
              </span>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shown on every page of a Studio draft preview so nobody mistakes it for the live site. */
function PreviewRibbon() {
  const { preview, bundle } = useExperience();
  if (!preview.active) return null;
  return (
    <div className="preview-ribbon" role="status" data-testid="preview-ribbon">
      {preview.failed && !bundle
        ? "Draft preview unavailable — the link may have expired. Showing the built-in design."
        : `Draft preview${bundle?.release?.number ? ` · based on release #${bundle.release.number}` : ""}`}
    </div>
  );
}

export default function App() {
  return (
    <CatalogProvider>
      <ExperienceProvider>
        <Storefront />
      </ExperienceProvider>
    </CatalogProvider>
  );
}

const KNOWN =
  /^\/(shop|ritual|story|checkout|orders|custom|account|policies|support|password-reset)(\/|$)|^\/$/;

function Storefront() {
  const { products, settings, status: catalogStatus, error: catalogError, reload: reloadCatalog } = useCatalog();
  const { announcement, chrome, preview } = useExperience();
  const signedIn = useSyncExternalStore(session.subscribe, session.isSignedIn);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [route, setRoute] = useState(
    () => window.location.pathname + window.location.search,
  );
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [cartOpen, setCartOpen] = useState(false);
  const {
    cart,
    count: cartCount,
    error: cartError,
    addToCart,
    updateQuantity,
  } = useCart();

  // chrome.effects → smooth scroll (speed cap), cursor, grain. Built-in values apply until a bundle says otherwise.
  const fx = chrome?.effects;
  const smoothOn = fx?.smoothScroll?.enabled !== false;
  const speedCap = fx?.smoothScroll?.speedCap ?? 1;
  useEffect(
    () => (smoothOn ? initSmoothScroll(speedCap) : undefined),
    [smoothOn, speedCap],
  );

  const path = route.split("?")[0]!;
  const orderId = path.startsWith("/orders/") ? path.split("/")[2] : undefined;
  const placed =
    new URLSearchParams(window.location.search).get("placed") === "1";
  const detailId = path.startsWith("/shop/") ? path.split("/")[2] : undefined;
  const customSlug = path.startsWith("/custom/")
    ? path.split("/")[2]
    : undefined;
  const baseDetail = products.find((product) => product.id === detailId);
  const detail = baseDetail
    ? selectVariant(
        baseDetail,
        selectedVariants[baseDetail.id] ?? baseDetail.variantId,
      )
    : undefined;
  const isHome = path === "/";

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const scrollToAnchor = useCallback((id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      return;
    }
    // not on this page: go home and let the arrival scroll to it
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", withPreview(`/#${id}`));
      setRoute("/");
    }
  }, []);

  const navigate = useCallback((target: string) => {
    let url: URL;
    try {
      url = new URL(target, window.location.origin);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    const next = withPreview(url.pathname + url.search + url.hash);
    if (
      next ===
      window.location.pathname + window.location.search + window.location.hash
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.history.pushState({}, "", next);
    setRoute(url.pathname + url.search);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // arriving on a page with #anchor (from an anchor action elsewhere): scroll once the blocks have mounted
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = window.setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: "auto" }),
      600,
    );
    return () => window.clearTimeout(t);
  }, [route]);

  const openCart = useCallback(() => setCartOpen(true), []);
  const addAndOpen = useCallback(
    (product: Parameters<typeof addToCart>[0]) => {
      addToCart(product);
      setCartOpen(true);
    },
    [addToCart],
  );
  const openAuth = useCallback(
    (reason?: string) => setAuthReason(reason ?? ""),
    [],
  );
  const onAccount = useCallback(() => {
    if (session.isSignedIn()) navigate("/account");
    else openAuth();
  }, [navigate, openAuth]);
  const isCommerce =
    path === "/checkout" ||
    path === "/orders" ||
    !!orderId ||
    path.startsWith("/account") ||
    path === "/password-reset";

  const api = useMemo<NavApi>(
    () => ({
      navigate,
      openCart,
      scrollToAnchor,
      addToCart: addAndOpen,
      openAuth,
      signedIn,
    }),
    [navigate, openCart, scrollToAnchor, addAndOpen, openAuth, signedIn],
  );
  const commerceKey = detail
    ? `/shop/${detail.id}`
    : customSlug
      ? `/custom/${customSlug}`
      : path;
  const known = KNOWN.test(path);

  const body = () => {
    if (path.startsWith("/account"))
      return <Account path={path} onNavigate={navigate} onSignIn={openAuth} />;
    if (path === "/password-reset") return <AccountRecovery />;
    if (path === "/support") return <Support onNavigate={navigate} />;
    if (path.startsWith("/policies/"))
      return <PolicyPage slug={path.split("/")[2] ?? "terms"} />;
    if (path === "/checkout")
      return <Checkout onNavigate={navigate} onSignIn={openAuth} />;
    if (path === "/orders")
      return <Orders onNavigate={navigate} onSignIn={openAuth} />;
    if (orderId)
      return (
        <OrderDetail
          id={orderId}
          placed={placed}
          onNavigate={navigate}
          onSignIn={openAuth}
        />
      );
    if (customSlug) return <CustomPage slug={customSlug} />;
    if (detailId) {
      if (detail)
        return (
          <ProductDetail
            product={detail}
            onNavigate={navigate}
            onAdd={addAndOpen}
            onVariantChange={(id) =>
              setSelectedVariants((previous) => ({
                ...previous,
                [detail.id]: id,
              }))
            }
          />
        );
      return catalogStatus === "error" ? (
        <section className="checkout"><p role="alert">{catalogError}</p><button className="solid-button" onClick={reloadCatalog}>Retry loading product</button></section>
      ) : catalogStatus === "ready" ? (
        <NotFound path={path} />
      ) : (
        <p className="shop-state" role="status">
          Loading…
        </p>
      );
    }
    if (path.startsWith("/shop"))
      return <Shop onNavigate={navigate} onAdd={addAndOpen} />;
    if (path === "/ritual") return <Ritual />;
    if (path === "/story") return <Story onNavigate={navigate} />;
    return <NotFound path={path} />;
  };
  // commerce screens are private pages: keep them out of search
  usePageSeo({
    key: isCommerce ? "commerce" : "_",
    title: path === "/checkout" ? "Checkout" : "Your orders",
    path,
    noindex: true,
    ready: isCommerce,
  });

  return (
    <NavProvider value={api}>
      <PreviewRibbon />
      {announcement && !settings?.ordersPaused && (
        <div
          className={`store-banner store-banner--${announcement.tone === "promo" || announcement.tone === "warning" ? announcement.tone : "info"}`}
          role="status"
        >
          {announcement.action &&
          resolveAction(announcement.action).kind !== "none" ? (
            <ActionLink
              action={announcement.action}
              className="store-banner__link"
            >
              {announcement.text}
            </ActionLink>
          ) : (
            announcement.text
          )}
        </div>
      )}
      {settings?.ordersPaused && (
        <div className="store-banner" role="status">
          {settings.pauseMessage || "Orders are paused for a short while."}
        </div>
      )}
      <ArrivalVeil />
      {(fx?.grain ?? true) && <GrainOverlay />}
      {(fx?.cursor ?? true) && !preview.active && <Cursor />}
      {isHome ? (
        <Home
          onNavigate={navigate}
          onOpenCart={openCart}
          count={cartCount}
          onAccount={onAccount}
          signedIn={signedIn}
        />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={commerceKey}
            className="route-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: [0.33, 1, 0.68, 1] }}
          >
            <div className="commerce-shell">
              <a className="skip-link" href="#main-content">
                Skip to content
              </a>
              <Nav
                route={path}
                cartCount={cartCount}
                onNavigate={navigate}
                onOpenCart={openCart}
                onAccount={onAccount}
                signedIn={signedIn}
              />
              <main id="main-content" tabIndex={-1}>
                <Suspense
                  fallback={
                    <p className="shop-state" role="status">
                      Loading…
                    </p>
                  }
                >
                  {body()}
                </Suspense>
              </main>
              <Footer onNavigate={navigate} />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            cart={cart}
            count={cartCount}
            products={products}
            settings={settings}
            error={cartError}
            onClose={() => setCartOpen(false)}
            onUpdate={updateQuantity}
            onAdd={addToCart}
            onCheckout={() => {
              setCartOpen(false);
              navigate("/checkout");
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isHome && detail && !cartOpen && known && (
          <motion.div
            key={detail.id}
            className="pdp-mobile-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pdp-mobile-price">
              <strong>{inr(detail.pricePaise)}</strong>
              <small>
                {detail.name} · {detail.note}
              </small>
            </div>
            <button
              type="button"
              disabled={!detail.available}
              onClick={() => addAndOpen(detail)}
            >
              {detail.available ? "Add" : "Sold out"}{" "}
              <span aria-hidden="true">↗</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {authReason !== null && (
          <AuthDialog
            reason={authReason || undefined}
            onClose={() => setAuthReason(null)}
            onDone={() => setAuthReason(null)}
          />
        )}
      </AnimatePresence>
    </NavProvider>
  );
}
