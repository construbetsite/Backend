// types/Product.ts

export type CommercialType = 'PICKUP' | 'ECOMMERCE';

export interface Product {
  id: string;
  categoryId: string;

  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;

  shortDescription: string | null;
  description: string;

  commercialType: CommercialType;

  price: number | null;
  redirectUrl: string | null;

  imageUrl: string | null;
  imagePath: string | null;
  imageFilename: string | null;

  featured: boolean;
  displayOrder: number;
  active: boolean;

  metaTitle: string | null;
  metaDescription: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDTO {
  categoryId: string;

  name: string;
  slug?: string;
  sku?: string | null;
  brand?: string | null;

  shortDescription?: string | null;
  description: string;

  commercialType: CommercialType;

  price?: number | null;
  redirectUrl?: string | null;

  imageUrl?: string | null;
  imagePath?: string | null;
  imageFilename?: string | null;

  featured?: boolean;
  displayOrder?: number;
  active?: boolean;

  metaTitle?: string | null;
  metaDescription?: string | null;
}

/**
 * Formato leve usado na LISTAGEM de produtos (card do frontend).
 * Não inclui descrições longas, HTML, metadados nem informações de storage.
 */
export interface ProductListItem {
  id: string;
  categoryId: string | null;

  name: string;
  slug: string;

  commercialType: CommercialType;
  price: number | null;
  redirectUrl: string | null;

  imageUrl: string | null;

  featured: boolean;
  displayOrder: number;
  active: boolean;
}

export interface ListProductsParams {
  categoryId?: string;
  commercialType?: CommercialType;
  active?: boolean;
  featured?: boolean;
}

export interface UpdateProductDTO {
  categoryId?: string;

  name?: string;
  slug?: string;
  sku?: string | null;
  brand?: string | null;

  shortDescription?: string | null;
  description?: string;

  commercialType?: CommercialType;

  price?: number | null;
  redirectUrl?: string | null;

  imageUrl?: string | null;
  imagePath?: string | null;
  imageFilename?: string | null;

  featured?: boolean;
  displayOrder?: number;
  active?: boolean;

  metaTitle?: string | null;
  metaDescription?: string | null;
}