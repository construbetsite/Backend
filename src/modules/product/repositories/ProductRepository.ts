// repositories/ProductRepository.ts

import { supabase } from '../../../config/supabase';
import {
  Product,
  ProductListItem,
  ListProductsParams,
  CreateProductDTO,
  UpdateProductDTO,
} from '../types/Product';
import {
  ProductVitrineItem,
  mapToVitrine,
} from '../dtos/ProductVitrineDTO';

// ✅ Campos essenciais da LISTAGEM (card do frontend).
// Exclui descrição longa, textos HTML, SEO, paths de storage.
const LIST_COLUMNS =
  'id, category_id, name, slug, commercial_type, price, redirect_url, image_url, featured, display_order, active';

// ✅ Tarefa 2 — projeção MÍNIMA da vitrine (Frontend lista apenas o card).
// Sem description/short_description/meta_*/sku/brand/image_path — essas
// colunas continuam existindo no banco, mas não viajam pela rede.
const VITRINE_COLUMNS =
  'id, name, slug, commercial_type, price, redirect_url, image_url, featured, display_order, active';

// ✅ Tarefa 4 — projeção de DETALHE (página do produto no frontend).
// Inclui campos úteis para a página (descrições, metas, brand), mas
// EXCLUI campos internos de storage (image_path/image_filename) que o
// público nunca usa — isso reduz em centenas de bytes por produto.
const DETAIL_COLUMNS =
  'id, category_id, name, slug, sku, brand, short_description, description, commercial_type, price, redirect_url, image_url, featured, display_order, active, meta_title, meta_description, created_at, updated_at';

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
      // ✅ Tarefa 4: projeção leve em vez de select('*').
      // O contrato do mapRow preenche os campos ausentes com fallbacks,
      // então o payload enxuto continua compatível com o frontend.
      .select(LIST_COLUMNS)
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

  /**
   * Listagem PAGINADA com projeção leve (ListColumns → ProductListItem).
   * Retorna os itens da página + o total de registros que casam com o filtro.
   */
  async findAllPaginated(
    filters: ListProductsParams,
    offset: number,
    limit: number
  ): Promise<{ items: ProductListItem[]; total: number }> {
    let query = supabase
      .from(this.table)
      .select(LIST_COLUMNS, { count: 'exact' })
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

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      items: (data ?? []).map((row: any) => this.mapListItem(row)),
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from(this.table)
      // ✅ Tarefa 4: projeção de detalhe (sem storage internals)
      .select(DETAIL_COLUMNS)
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
      // ✅ Tarefa 4: projeção de detalhe (sem storage internals)
      .select(DETAIL_COLUMNS)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapRow(data) : null;
  }

  // ✅ Busca vários produtos por IDs (projeção leve, para exibição no blog)
  // ⚠️ Filtra apenas produtos ATIVOS (active = true) — produtos inativos ou
  // deletados não aparecem na landing page.
  async findByIds(ids: string[]): Promise<ProductListItem[]> {
    if (!ids || ids.length === 0) return [];

    const { data, error } = await supabase
      .from(this.table)
      .select(LIST_COLUMNS)
      .in('id', ids)
      .eq('active', true);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row: any) => this.mapListItem(row));
  }

  /**
   * Tarefa 2 — listagem da VITRINE (landing page).
   *
   * ➜ Projeção direta no banco: só as colunas do card viajam na rede
   *   (sem description, metas, paths, sku, brand).
   * ➜ Sem JOINs: o card não precisa de nada além da própria linha.
   * ➜ Paginação por página/cursor (offset) — nunca retorna mais que `limit`.
   */
  async findVitrine(
    offset: number,
    limit: number
  ): Promise<{ items: ProductVitrineItem[]; total: number }> {
    const { data, error, count } = await supabase
      .from(this.table)
      .select(VITRINE_COLUMNS, { count: 'exact' })
      .eq('active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return {
      items: (data ?? []).map((row: any) => mapToVitrine(row)),
      total: count || 0,
    };
  }

  // Mapeia uma linha (com LIST_COLUMNS) para o formato leve do card
  private mapListItem(row: any): ProductListItem {
    return {
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      slug: row.slug,
      commercialType: row.commercial_type,
      price: row.price,
      redirectUrl: row.redirect_url,
      imageUrl: row.image_url,
      featured: row.featured,
      displayOrder: row.display_order,
      active: row.active,
    };
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