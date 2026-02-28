export interface CanonicalProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  availability: "in_stock" | "out_of_stock";
}

export interface CategoryGroup {
  category: string;
  subcategory: string | null;
  products: CanonicalProduct[];
}

export interface ShopifyCollection {
  id: number;
  title: string;
  handle: string;
  description?: string;
  published_at?: string;
  updated_at?: string;
  image?: unknown;
  products_count?: number;
}

export interface ShopifyProductVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  [key: string]: unknown;
}

export interface ShopifyProductImage {
  id: number;
  src: string;
  [key: string]: unknown;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html?: string | null;
  product_type?: string;
  variants: ShopifyProductVariant[];
  images: ShopifyProductImage[];
  [key: string]: unknown;
}
