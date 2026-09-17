import type { CategoryId } from '../features/catalog/types';
import type { ProductId } from './catalog';

interface HomepageHero {
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly productId: ProductId;
}

interface ProductRailSection {
  readonly id: string;
  readonly type: 'product-rail';
  readonly title: string;
  readonly productIds: readonly ProductId[];
}

interface CategoryGridSection {
  readonly id: string;
  readonly type: 'category-grid';
  readonly title: string;
  readonly categoryIds: readonly CategoryId[];
}

export type HomepageSection = ProductRailSection | CategoryGridSection;

export interface HomepageConfig {
  readonly hero: HomepageHero;
  readonly sections: readonly HomepageSection[];
}

export const homepageConfig = {
  hero: {
    title: 'Everyday upgrades, delivered',
    subtitle: 'Discover customer favorites for home, work, and life on the go.',
    image:
      'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1800&q=85',
    productId: 'B0QW7A2N9K',
  },
  sections: [
    {
      id: 'shop-popular-categories',
      type: 'category-grid',
      title: 'Shop popular categories',
      categoryIds: ['electronics', 'home-kitchen', 'fashion', 'beauty-personal-care'],
    },
    {
      id: 'top-picks',
      type: 'product-rail',
      title: 'Top picks for you',
      productIds: ['B0QW7A2N9K', 'B0CA6QTFR2', 'B0TB24PKBL', 'B0LA7DESK2', 'B0SF32BTTL'],
    },
    {
      id: 'deals',
      type: 'product-rail',
      title: 'Deals worth a look',
      productIds: ['B0CH4R65PD', 'B0TF3S40BK', 'B0HS9RUN42', 'B0SGHD2200'],
    },
    {
      id: 'refresh-your-space',
      type: 'product-rail',
      title: 'Refresh your space',
      productIds: ['B0HB12CUP7', 'B0CV18VACC', 'B0ENMESH88', 'B0LM27QHD8'],
    },
  ],
} as const satisfies HomepageConfig;
