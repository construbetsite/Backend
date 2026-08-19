// repositories/ProductRepository.ts

import { supabase } from '../../../config/supabase';
import {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
} from '../types/Product';

export class ProductRepository {
  private readonly table = 'products';

  private mapRow(row: any): Product {
    return {
      id: row.id,
      categoryId: row.category_id,

      name: row.name,
      slug: row.slug,
      sku: row.sku,
      brand: row.brand,

      shortDescription: row.short_description,
      description: row.description,

      commercialType: row.commercial_type,

      price: row.price,
      redirectUrl: row.redirect_url,

      imageUrl: row.image_url,
      imagePath: row.image_path,
      imageFilename: row.image_filename,

      featured: row.featured,
      displayOrder: row.display_order,
      active: row.active,

      metaTitle: row.meta_title,
      metaDescription: row.meta_description,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(filters?: {
    categoryId?: string;
    commercialType?: 'PICKUP' | 'ECOMMERCE';
    active?: boolean;
    featured?: boolean;
  }): Promise<Product[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.commercialType) {
      query = query.eq('commercial_type', filters.commercialType);
    }

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }

    if (filters?.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row: any) => this.mapRow(row));
  }

  async findById(id: string): Promise<Product | null> {
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

  async findBySlug(slug: string): Promise<Product | null> {
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

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
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

  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from(this.table)
      .select('id')
      .eq('sku', sku);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !!data;
  }

  async create(data: CreateProductDTO): Promise<Product> {
    const payload = {
      category_id: data.categoryId,

      name: data.name,
      slug: data.slug,
      sku: data.sku ?? null,
      brand: data.brand ?? null,

      short_description: data.shortDescription ?? null,
      description: data.description,

      commercial_type: data.commercialType,

      price: data.price ?? null,
      redirect_url: data.redirectUrl ?? null,

      image_url: data.imageUrl ?? null,
      image_path: data.imagePath ?? null,
      image_filename: data.imageFilename ?? null,

      featured: data.featured ?? false,
      display_order: data.displayOrder ?? 0,
      active: data.active ?? true,

      meta_title: data.metaTitle ?? null,
      meta_description: data.metaDescription ?? null,
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
    data: UpdateProductDTO
  ): Promise<Product> {
    const payload: Record<string, any> = {};

    if (data.categoryId !== undefined) {
      payload.category_id = data.categoryId;
    }

    if (data.name !== undefined) {
      payload.name = data.name;
    }

    if (data.slug !== undefined) {
      payload.slug = data.slug;
    }

    if (data.sku !== undefined) {
      payload.sku = data.sku;
    }

    if (data.brand !== undefined) {
      payload.brand = data.brand;
    }

    if (data.shortDescription !== undefined) {
      payload.short_description = data.shortDescription;
    }

    if (data.description !== undefined) {
      payload.description = data.description;
    }

    if (data.commercialType !== undefined) {
      payload.commercial_type = data.commercialType;
    }

    if (data.price !== undefined) {
      payload.price = data.price;
    }

    if (data.redirectUrl !== undefined) {
      payload.redirect_url = data.redirectUrl;
    }

    if (data.imageUrl !== undefined) {
      payload.image_url = data.imageUrl;
    }

    if (data.imagePath !== undefined) {
      payload.image_path = data.imagePath;
    }

    if (data.imageFilename !== undefined) {
      payload.image_filename = data.imageFilename;
    }

    if (data.featured !== undefined) {
      payload.featured = data.featured;
    }

    if (data.displayOrder !== undefined) {
      payload.display_order = data.displayOrder;
    }

    if (data.active !== undefined) {
      payload.active = data.active;
    }

    if (data.metaTitle !== undefined) {
      payload.meta_title = data.metaTitle;
    }

    if (data.metaDescription !== undefined) {
      payload.meta_description = data.metaDescription;
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