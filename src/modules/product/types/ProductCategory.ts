// types/ProductCategory.ts

export interface ProductCategory {
  id: string;

  name: string;
  slug: string;
  description: string | null;

  imageUrl: string | null;

  parentId: string | null;

  active: boolean;
  displayOrder: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreateProductCategoryDTO {
  name: string;
  slug?: string;

  description?: string | null;

  imageUrl?: string | null;

  parentId?: string | null;

  active?: boolean;
  displayOrder?: number;
}

export interface UpdateProductCategoryDTO {
  name?: string;
  slug?: string;

  description?: string | null;

  imageUrl?: string | null;

  parentId?: string | null;

  active?: boolean;
  displayOrder?: number;
}