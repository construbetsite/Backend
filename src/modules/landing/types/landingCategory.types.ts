// types/landingCategory.types.ts

export interface LandingCategory {
  id: number;
  title: string;
  image: string;
  url: string;
  order: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ Projeção enxuta para o slider da landing page
// (exatamente os campos que o frontend renderiza)
export interface LandingCategorySlider {
  id: number;
  title: string;
  image: string;
  url: string;
  order: number;
}

export interface CreateLandingCategoryDTO {
  title: string;
  image: string;
  url: string;
  order?: number;
  status?: boolean;
}

export interface UpdateLandingCategoryDTO {
  title?: string;
  image?: string;
  url?: string;
  order?: number;
  status?: boolean;
}

export interface ListLandingCategoriesParams {
  active?: boolean;
}
