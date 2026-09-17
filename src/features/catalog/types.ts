export type CategoryId =
  | 'electronics'
  | 'home-kitchen'
  | 'fashion'
  | 'office'
  | 'beauty-personal-care'
  | 'sports-outdoors'
  | 'specialty';

export type ProductBadge =
  | 'best-seller'
  | 'amazon-choice'
  | 'limited-time-deal'
  | 'climate-pledge-friendly'
  | 'small-business';

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface DeliveryEstimate {
  readonly standard: string;
  readonly expedited?: string;
}

export interface ProductStock {
  readonly status: StockStatus;
  readonly message: string;
  readonly quantity?: number;
}

export interface ProductVariant {
  readonly id: string;
  readonly name: 'Color' | 'Size' | 'Style' | 'Capacity' | 'Pack';
  readonly value: string;
  readonly inStock: boolean;
  readonly priceCents?: number;
  readonly image?: string;
}

export interface Product {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly brand: string;
  readonly category: CategoryId;
  readonly searchTags?: readonly string[];
  readonly images: readonly string[];
  readonly priceCents: number;
  readonly listPriceCents: number;
  readonly rating: number;
  readonly reviewCount: number;
  readonly boughtPastMonth: number;
  readonly prime: boolean;
  readonly delivery: DeliveryEstimate;
  readonly stock: ProductStock;
  readonly badges: readonly ProductBadge[];
  readonly features: readonly string[];
  readonly specifications: Readonly<Record<string, string>>;
  readonly variants: readonly ProductVariant[];
}

export interface Category {
  readonly id: CategoryId;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
}
