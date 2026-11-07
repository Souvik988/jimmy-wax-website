import { apiPages, authedApi, publicApi } from "./api";
export interface Profile {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  accountPhone?: string | null;
  emailVerified: boolean;
  preferences: { orderUpdates: boolean; offersAndCareTips: boolean };
}
export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: { orderId?: string };
}
export interface ContentPage {
  slug: string;
  kind: string;
  title: string;
  bodyMd: string;
  version: number;
  publishedAt?: string;
}
export interface ReturnRecord {
  id: string;
  status: string;
  reason: string;
  decisionNote: string | null;
  createdAt: string;
}
export const customer = {
  profile: () => authedApi<Profile>("GET", "/v1/me"),
  saveProfile: (fullName: string, phone: string) =>
    authedApi<Profile>("PATCH", "/v1/me", { fullName, phone: phone || null }),
  preferences: (value: Profile["preferences"]) =>
    authedApi("PUT", "/v1/me/preferences", value),
  wishlist: () =>
    apiPages<{ productId: string }>("/v1/wishlist?limit=50", true),
  saveWishlist: (id: string, saved: boolean) =>
    authedApi(
      saved ? "PUT" : "DELETE",
      "/v1/wishlist/" + encodeURIComponent(id),
    ),
  notifications: () =>
    apiPages<Notification>("/v1/notifications?limit=50", true),
  markRead: (id: string) =>
    authedApi("POST", "/v1/notifications/" + id + "/read"),
  export: () => authedApi<unknown>("GET", "/v1/auth/account/export"),
  delete: (confirmation: { password: string } | { code: string }) =>
    authedApi("POST", "/v1/auth/account/delete", confirmation),
  invoice: (id: string) =>
    authedApi<string>("GET", "/v1/orders/" + id + "/invoice.html"),
  returns: (id: string) =>
    authedApi<{ items: ReturnRecord[] }>(
      "GET",
      "/v1/orders/" + id + "/returns",
    ).then((r) => r.items),
  requestReturn: (
    id: string,
    reason: string,
    items: Array<{ orderItemId: number; quantity: number }>,
  ) =>
    authedApi<ReturnRecord>("POST", "/v1/orders/" + id + "/returns", {
      reason,
      items,
    }),
  contents: () =>
    publicApi<{ items: Array<Omit<ContentPage, "bodyMd">> }>(
      "GET",
      "/v1/content",
    ).then((r) => r.items),
  content: (slug: string) =>
    publicApi<ContentPage>("GET", "/v1/content/" + encodeURIComponent(slug)),
};
export function download(
  name: string,
  body: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([body], { type })),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
