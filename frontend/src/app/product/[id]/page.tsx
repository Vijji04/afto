import { getProductById } from "@/lib/api";
import { ProductTemplate } from "@/components/templates/ProductTemplate";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  let product = null;
  try {
    const res = await getProductById(id);
    product = res.data;
  } catch {
    product = null;
  }

  return <ProductTemplate product={product} />;
}
