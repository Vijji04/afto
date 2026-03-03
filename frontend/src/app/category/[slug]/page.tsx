import { getProducts, getCategories } from "@/lib/api";
import { CategoryTemplate } from "@/components/templates/CategoryTemplate";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const categoryName = decodeURIComponent(slug);
  const page = parseInt(query.page || "1", 10);
  const sort = query.sort || "newest";

  const [productsRes, categoriesRes] = await Promise.all([
    getProducts({ category: categoryName, page, limit: 20, sort }),
    getCategories(),
  ]);

  return (
    <CategoryTemplate
      products={productsRes.data}
      categories={categoriesRes.data}
      categoryName={categoryName}
      pagination={productsRes.pagination}
    />
  );
}
