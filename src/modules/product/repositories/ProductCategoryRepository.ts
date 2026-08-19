// repositories/ProductCategoryRepository.ts

import { supabase } from '../../../config/supabase';
import {
  ProductCategory,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO,
} from '../types/ProductCategory';

export class ProductCategoryRepository {
  private readonly table = 'product_categories';

  private mapRow(row: any): ProductCategory {
    return {
      id: row.id,

      name: row.name,
      slug: row.slug,
      description: row.description,

      imageUrl: row.image_url,

      parentId: row.parent_id,

      active: row.active,
      displayOrder: row.display_order,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(filters?: {
    active?: boolean;
    parentId?: string | null;
  }): Promise<ProductCategory[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }

    if (filters?.parentId !== undefined) {
      if (filters.parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parentId);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.mapRow(row));
  }

  async findById(id: string): Promise<ProductCategory | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapRow(data) : null;
  }

  async findBySlug(slug: string): Promise<ProductCategory | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapRow(data) : null;
  }

  async slugExists(
    slug: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from(this.table)
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !!data;
  }

  async create(
    data: CreateProductCategoryDTO
  ): Promise<ProductCategory> {
    const payload = {
      name: data.name,
      slug: data.slug,

      description: data.description ?? null,

      image_url: data.imageUrl ?? null,

      parent_id: data.parentId ?? null,

      active: data.active ?? true,
      display_order: data.displayOrder ?? 0,
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
    id: string,
    data: UpdateProductCategoryDTO
  ): Promise<ProductCategory> {
    const payload: Record<string, any> = {};

    if (data.name !== undefined) {
      payload.name = data.name;
    }

    if (data.slug !== undefined) {
      payload.slug = data.slug;
    }

    if (data.description !== undefined) {
      payload.description = data.description;
    }

    if (data.imageUrl !== undefined) {
      payload.image_url = data.imageUrl;
    }

    if (data.parentId !== undefined) {
      payload.parent_id = data.parentId;
    }

    if (data.active !== undefined) {
      payload.active = data.active;
    }

    if (data.displayOrder !== undefined) {
      payload.display_order = data.displayOrder;
    }

    const { data: row, error } = await supabase
      .from(this.table)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapRow(row);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
}