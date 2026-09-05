// repositories/LandingCategoryRepository.ts

import { supabase } from '../../../config/supabase';
import {
  LandingCategory,
  LandingCategorySlider,
  CreateLandingCategoryDTO,
  UpdateLandingCategoryDTO,
} from '../types/landingCategory.types';

export class LandingCategoryRepository {
  private readonly table = 'landing_categories';

  private mapRow(row: any): LandingCategory {
    return {
      id: row.id,
      title: row.title,
      image: row.image,
      url: row.url,
      order: row.order,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ✅ Projeção enxuta para o slider da landing page
  private mapSliderRow(row: any): LandingCategorySlider {
    return {
      id: row.id,
      title: row.title,
      image: row.image,
      url: row.url,
      order: row.order,
    };
  }

  /**
   * ✅ SLIDER (público): apenas categorias ativas (status = true),
   * ordenadas por `order` ASC, com projeção enxuta para o frontend.
   */
  async findActive(): Promise<LandingCategorySlider[]> {
    const { data } = await supabase
      .from(this.table)
      .select('id, title, image, url, order')
      .eq('status', true)
      .order('order', { ascending: true });

    return (data ?? []).map((row) => this.mapSliderRow(row));
  }

  // ✅ Tarefa 4 — projeção pública (equivale ao contrato do frontend).
  private readonly PUBLIC_COLUMNS =
    'id, title, image, url, order, status';

  /**
   * Lista as categorias ordenadas pelo campo `order` (crescente).
   * Se `active` for informado, filtra por status (true = ativas).
   */
  async findAll(filters?: {
    active?: boolean;
  }): Promise<LandingCategory[]> {
    let query = supabase
      .from(this.table)
      // ✅ Tarefa 4: projeção explícita (sem SELECT *) — timestamps não trafegam
      .select(this.PUBLIC_COLUMNS)
      .order('order', { ascending: true })
      .order('title', { ascending: true });

    if (filters?.active !== undefined) {
      query = query.eq('status', filters.active);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.mapRow(row));
  }

  async findById(id: string | number): Promise<LandingCategory | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select(this.PUBLIC_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapRow(data) : null;
  }

  async create(
    data: CreateLandingCategoryDTO
  ): Promise<LandingCategory> {
    const payload = {
      title: data.title,
      image: data.image,
      url: data.url,
      order: data.order ?? 0,
      status: data.status ?? true,
    };

    const { data: row, error } = await supabase
      .from(this.table)
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapRow(row);
  }

  async update(
    id: string | number,
    data: UpdateLandingCategoryDTO
  ): Promise<LandingCategory | null> {
    const payload: Record<string, any> = {};

    if (data.title !== undefined) payload.title = data.title;
    if (data.image !== undefined) payload.image = data.image;
    if (data.url !== undefined) payload.url = data.url;
    if (data.order !== undefined) payload.order = data.order;
    if (data.status !== undefined) payload.status = data.status;

    const { data: row, error } = await supabase
      .from(this.table)
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return row ? this.mapRow(row) : null;
  }

  async delete(id: string | number): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
}
