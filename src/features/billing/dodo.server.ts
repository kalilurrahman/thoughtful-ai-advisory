// Minimal Dodo Payments REST client (merchant of record) for the billing server functions.
// Plain fetch keeps the Worker bundle small; endpoints and fields follow the official
// `dodopayments` SDK. Configuration:
//   DODO_PAYMENTS_API_KEY        secret API key (server only)
//   DODO_PAYMENTS_ENVIRONMENT    "live_mode" for real payments; anything else uses test_mode
//   DODO_PAYMENTS_WEBHOOK_KEY    webhook signing secret ("whsec_…")
//   DODO_PRODUCT_*               product ids per plan and interval (see entitlements.ts)

const BASE_URLS = {
  live_mode: "https://live.dodopayments.com",
  test_mode: "https://test.dodopayments.com",
} as const;

export class DodoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DodoError";
  }
}

export function dodoConfigured(): boolean {
  return Boolean(process.env["DODO_PAYMENTS_API_KEY"]);
}

async function dodo<T>(method: "GET" | "POST", path: string, body?: object): Promise<T> {
  const key = process.env["DODO_PAYMENTS_API_KEY"];
  if (!key) throw new DodoError("Dodo Payments is not configured", 503);
  const base =
    process.env["DODO_PAYMENTS_ENVIRONMENT"] === "live_mode"
      ? BASE_URLS.live_mode
      : BASE_URLS.test_mode;
  const res = await fetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    // Log the status only: error bodies can echo customer details.
    console.error(`[billing] Dodo ${method} ${path.split("/")[1]} failed: ${res.status}`);
    throw new DodoError(`Dodo request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

export function createCustomer(input: {
  email: string;
  name: string;
  metadata: Record<string, string>;
}): Promise<{ customer_id: string }> {
  return dodo("POST", "/customers", input);
}

export function createCheckoutSession(input: {
  productId: string;
  customerId: string;
  returnUrl: string;
  metadata: Record<string, string>;
}): Promise<{ session_id: string; checkout_url?: string | null }> {
  return dodo("POST", "/checkouts", {
    product_cart: [{ product_id: input.productId, quantity: 1 }],
    customer: { customer_id: input.customerId },
    return_url: input.returnUrl,
    metadata: input.metadata,
  });
}

export function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<{ link: string }> {
  const query = new URLSearchParams({ return_url: returnUrl });
  return dodo(
    "POST",
    `/customers/${encodeURIComponent(customerId)}/customer-portal/session?${query}`,
  );
}
