// services/ProductCategoryService.ts

import {
  CreateProductCategoryDTO,
  ProductCategory,
  UpdateProductCategoryDTO,
} from '../types/ProductCategory';

import { ProductCategoryRepository } from '../repositories/ProductCategoryRepository';

export class ProductCategoryService {
  constructor(
    private readonly repository: ProductCategoryRepository
  ) {}

  private generateSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(filters?: {
    active?: boolean;
    parentId?: string | null;
  }): Promise<ProductCategory[]> {
    return this.repository.findAll(filters);
  }

  async findById(id: string): Promise<ProductCategory> {
    const category = await this.repository.findById(id);

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<ProductCategory> {
    const category = await this.repository.findBySlug(slug);

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    return category;
  }

  async create(
    data: CreateProductCategoryDTO
  ): Promise<ProductCategory> {
    const slug =
      data.slug?.trim() || this.generateSlug(data.name);

    const slugExists =
      await this.repository.slugExists(slug);

    if (slugExists) {
      throw new Error(
        'Já existe uma categoria utilizando este slug.'
      );
    }

    if (data.parentId) {
      const parent =
        await this.repository.findById(data.parentId);

      if (!parent) {
        throw new Error(
          'A categoria pai informada não existe.'
        );
      }
    }

    return this.repository.create({
      ...data,
      slug,
    });
  }

  async update(
    id: string,
    data: UpdateProductCategoryDTO
  ): Promise<ProductCategory> {
    await this.findById(id);

    if (data.slug) {
      const slugExists =
        await this.repository.slugExists(
          data.slug,
          id
        );

      if (slugExists) {
        throw new Error(
          'Já existe uma categoria utilizando este slug.'
        );
      }
    }

    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error(
          'Uma categoria não pode ser pai dela mesma.'
        );
      }

      const parent =
        await this.repository.findById(data.parentId);

      if (!parent) {
        throw new Error(
          'A categoria pai informada não existe.'
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