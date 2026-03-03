import type {
  Product,
  Category,
  Order,
  PaginatedResponse,
  Suggestion,
  CheckoutSession,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = `API error: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // Response body is not JSON, keep default message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function getProducts(params?: {
  category?: string;
  subcategory?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.subcategory) searchParams.set("subcategory", params.subcategory);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sort) searchParams.set("sort", params.sort);

  return fetchJSON<PaginatedResponse<Product>>(
    `${API_BASE}/products?${searchParams.toString()}`
  );
}

export async function getProductById(
  id: string
): Promise<{ data: Product }> {
  return fetchJSON<{ data: Product }>(`${API_BASE}/products/${id}`);
}

export async function getCategories(): Promise<{ data: Category[] }> {
  return fetchJSON<{ data: Category[] }>(`${API_BASE}/categories`);
}

export async function searchProducts(params?: {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.minPrice !== undefined)
    searchParams.set("minPrice", String(params.minPrice));
  if (params?.maxPrice !== undefined)
    searchParams.set("maxPrice", String(params.maxPrice));
  if (params?.availability)
    searchParams.set("availability", params.availability);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sort) searchParams.set("sort", params.sort);

  return fetchJSON<PaginatedResponse<Product>>(
    `${API_BASE}/search?${searchParams.toString()}`
  );
}

export async function getSuggestions(
  q: string
): Promise<{ suggestions: Suggestion[] }> {
  if (!q.trim()) return { suggestions: [] };
  return fetchJSON<{ suggestions: Suggestion[] }>(
    `${API_BASE}/search/suggest?q=${encodeURIComponent(q)}`
  );
}

export async function createOrder(data: {
  items: { productId: string; quantity: number }[];
  customerEmail?: string;
  customerName?: string;
}): Promise<{ data: Order }> {
  return fetchJSON<{ data: Order }>(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getOrder(id: string): Promise<{ data: Order }> {
  return fetchJSON<{ data: Order }>(`${API_BASE}/orders/${id}`);
}

export async function createCheckoutSession(data: {
  items: { productId: string; quantity: number }[];
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ data: CheckoutSession }> {
  return fetchJSON<{ data: CheckoutSession }>(`${API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function confirmCheckoutPayment(
  sessionId: string
): Promise<{ data: Order }> {
  return fetchJSON<{ data: Order }>(`${API_BASE}/checkout/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
}
