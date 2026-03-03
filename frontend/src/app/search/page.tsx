import { searchProducts, getCategories } from "@/lib/api";
import { SearchTemplate } from "@/components/templates/SearchTemplate";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = await searchParams;
  const q = query.q || "";
  const category = query.category;
  const sort = query.sort || "relevance";
  const page = parseInt(query.page || "1", 10);

  const [productsRes, categoriesRes] = await Promise.all([
    searchProducts({ q, category, sort, page, limit: 20 }),
    getCategories(),
  ]);

  return (
    <SearchTemplate
      products={productsRes.data}
      categories={categoriesRes.data}
      query={q}
      pagination={productsRes.pagination}
      sort={sort}
      selectedCategory={category}
    />
  );
}
