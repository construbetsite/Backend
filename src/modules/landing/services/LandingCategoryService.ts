// services/LandingCategoryService.ts

import {
  LandingCategory,
  LandingCategorySlider,
  CreateLandingCategoryDTO,
  UpdateLandingCategoryDTO,
} from '../types/landingCategory.types';
import { LandingCategoryRepository } from '../repositories/LandingCategoryRepository';
import { LandingStorageRepository } from '../repositories/LandingStorageRepository';
import { NotFoundError } from '../errors/AppError';

export class LandingCategoryService {
  private repository = new LandingCategoryRepository();
  private storage = new LandingStorageRepository();

  /**
   * ✅ SLIDER (público): categorias ativas, ordenadas por `order` ASC,
   * com projeção enxuta (id, title, image, url, order).
   */
  async findActiveForSlider(): Promise<LandingCategorySlider[]> {
    return this.repository.findActive();
  }

  async findAll(filters?: { active?: boolean }): Promise<LandingCategory[]> {
    return this.repository.findAll(filters);
  }

  async findById(id: string | number): Promise<LandingCategory> {
    const category = await this.repository.findById(id);

    if (!category) {
      throw new NotFoundError('Categoria da landing page não encontrada.');
    }

    return category;
  }

  async create(data: CreateLandingCategoryDTO): Promise<LandingCategory> {
    return this.repository.create(data);
  }

  async update(
    id: string | number,
    data: UpdateLandingCategoryDTO
  ): Promise<LandingCategory> {
    const current = await this.findById(id);

    const updated = await this.repository.update(id, data);

    if (!updated) {
      throw new NotFoundError('Categoria da landing page não encontrada.');
    }

    // ✅ Se a imagem foi trocada, remove a imagem antiga do bucket (best-effort)
    if (data.image && data.image !== current.image) {
      await this.storage.deleteByPublicUrl(current.image);
    }

    return updated;
  }

  async delete(id: string | number): Promise<void> {
    const current = await this.findById(id);

    await this.repository.delete(id);

    // ✅ Remove a imagem do bucket (best-effort, ignora erros)
    await this.storage.deleteByPublicUrl(current.image);
  }
}
