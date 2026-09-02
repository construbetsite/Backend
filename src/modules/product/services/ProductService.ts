// services/ProductService.ts

import {
  CommercialType,
  CreateProductDTO,
  Product,
  ProductListItem,
  ListProductsParams,
  UpdateProductDTO,
} from '../types/Product';
import { ProductRepository } from '../repositories/ProductRepository';

export class ProductService {
  constructor(
    private readonly repository: ProductRepository
  ) {}

  private validateCommercialType(data: {
    commercialType: CommercialType;
    price?: number | null;
    redirectUrl?: string | null;
  }) {
    if (data.commercialType === 'PICKUP') {
      if (data.price === null || data.price === undefined) {
        throw new Error(
          'Produtos para retirada devem possuir preço.'
        );
      }

      if (data.price < 0) {
        throw new Error(
          'O preço do produto não pode ser negativo.'
        );
      }

      if (data.redirectUrl) {
        throw new Error(
          'Produtos para retirada não devem possuir URL de e-commerce.'
        );
      }
    }

    if (data.commercialType === 'ECOMMERCE') {
      if (!data.redirectUrl?.trim()) {
        throw new Error(
          'Produtos de e-commerce devem possuir URL de encaminhamento.'
        );
      }

      if (data.price !== null && data.price !== undefined) {
        throw new Error(
          'Produtos de e-commerce não devem possuir preço na landing page.'
        );
      }
    }
  }

  private generateSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(filters?: ListProductsParams): Promise<Product[]> {
    return this.repository.findAll(filters);
  }

  /**
   * Listagem PAGINADA (projeção leve + total).
   * `offset` é calculado a partir de page/limit/cursor pelos controllers.
   */
  async findAllPaginated(
    filters: ListProductsParams,
    offset: number,
    limit: number
  ): Promise<{ items: ProductListItem[]; total: number }> {
    return this.repository.findAllPaginated(filters, offset, limit);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repository.findById(id);

    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.repository.findBySlug(slug);

    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    return product;
  }

  async create(data: CreateProductDTO): Promise<Product> {
    const slug = data.slug?.trim() || this.generateSlug(data.name);

    // 🔥 CORREÇÃO (R5): slugExists e skuExists agora rodam em PARALELO (Promise.all).
    // Antes: 2 round-trips sequenciais ao Supabase. Agora: latência de 1 round-trip.
    // A ordem das mensagens de erro é preservada (checagens fora do Promise.all).
    const [slugTaken, skuTaken] = await Promise.all([
      this.repository.slugExists(slug),
      data.sku
        ? this.repository.skuExists(data.sku)
        : Promise.resolve(false as boolean),
    ]);

    if (slugTaken) {
      throw new Error(
        'Já existe um produto utilizando este slug.'
      );
    }

    if (skuTaken) {
      throw new Error(
        'Já existe um produto utilizando este SKU.'
      );
    }

    this.validateCommercialType({
      commercialType: data.commercialType,
      price: data.price,
      redirectUrl: data.redirectUrl,
    });

    return this.repository.create({
      ...data,
      slug,
    });
  }

  async update(
    id: string,
    data: UpdateProductDTO
  ): Promise<Product> {
    const current = await this.findById(id);

    const commercialType =
      data.commercialType ?? current.commercialType;

    const price =
      data.price !== undefined
        ? data.price
        : current.price;

    const redirectUrl =
      data.redirectUrl !== undefined
        ? data.redirectUrl
        : current.redirectUrl;

    this.validateCommercialType({
      commercialType,
      price,
      redirectUrl,
    });

    if (data.slug) {
      const slugExists = await this.repository.slugExists(
        data.slug,
        id
      );

      if (slugExists) {
        throw new Error(
          'Já existe um produto utilizando este slug.'
        );
      }
    }

    if (data.sku) {
      const skuExists = await this.repository.skuExists(
        data.sku,
        id
      );

      if (skuExists) {
        throw new Error(
          'Já existe um produto utilizando este SKU.'
        );
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);

    await this.repository.delete(id);
  }
}