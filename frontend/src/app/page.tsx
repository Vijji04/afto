import { getProducts, getCategories } from "@/lib/api";
import { HomeTemplate } from "@/components/templates/HomeTemplate";

export default async function HomePage() {
  const [productsRes, categoriesRes] = await Promise.all([
    getProducts({ limit: 30 }),
    getCategories(),
  ]);

  return (
    <HomeTemplate products={productsRes.data} categories={categoriesRes.data} />
  );
}
