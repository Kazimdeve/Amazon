import { catalog } from '../../data/catalog';
import { categories } from '../../data/categories';
import type { Category, CategoryId, Product } from './types';

export function findProductById(
  productId: string,
  products: readonly Product[] = catalog,
): Product | undefined {
  return products.find((product) => product.id === productId);
}

export function findCategoryById(
  categoryId: string,
  availableCategories: readonly Category[] = categories,
): Category | undefined {
  return availableCategories.find((category) => category.id === categoryId);
}

export function getProductsByCategory(
  categoryId: CategoryId,
  products: readonly Product[] = catalog,
): readonly Product[] {
  return products.filter((product) => product.category === categoryId);
}
