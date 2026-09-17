import type { Category } from '../features/catalog/types';

export const categories = [
  {
    id: 'electronics',
    slug: 'electronics',
    name: 'Electronics',
    description: 'Audio, charging, displays, and connected devices.',
    image:
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'home-kitchen',
    slug: 'home-kitchen',
    name: 'Home & Kitchen',
    description: 'Practical appliances for cooking, cleaning, and daily routines.',
    image:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'fashion',
    slug: 'fashion',
    name: 'Fashion',
    description: 'Everyday footwear, bags, and travel-ready essentials.',
    image:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'office',
    slug: 'office',
    name: 'Office',
    description: 'Ergonomic furniture and focused workspace accessories.',
    image:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'beauty-personal-care',
    slug: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    description: 'Daily skincare and personal styling essentials.',
    image:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'sports-outdoors',
    slug: 'sports-outdoors',
    name: 'Sports & Outdoors',
    description: 'Reliable gear for training, travel, and outdoor activity.',
    image:
      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=85',
  },
] as const satisfies readonly Category[];
