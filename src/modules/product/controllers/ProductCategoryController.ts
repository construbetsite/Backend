// controllers/ProductCategoryController.ts

import { Request, Response } from 'express';
import { ProductCategoryService } from '../services/ProductCategoryService';

export class ProductCategoryController {
  constructor(
    private readonly service: ProductCategoryService
  ) {}

  findAll = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { active, parentId } = req.query;

      const categories =
        await this.service.findAll({
          active:
            active !== undefined
              ? active === 'true'
              : undefined,

          parentId:
            parentId === undefined
              ? undefined
              : parentId === 'null'
              ? null
              : String(parentId),
        });

      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

  findById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const category =
        await this.service.findById(req.params.id as string );

      res.status(200).json(category);
    } catch (error: any) {
      res.status(404).json({
        message: error.message,
      });
    }
  };

  findBySlug = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const category =
        await this.service.findBySlug(
          req.params.slug as string
        );

      res.status(200).json(category);
    } catch (error: any) {
      res.status(404).json({
        message: error.message,
      });
    }
  };

  create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const category =
        await this.service.create(req.body);

      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      });
    }
  };

  update = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const category =
        await this.service.update(
          req.params.id as string,
          req.body
        );

      res.status(200).json(category);
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      });
    }
  };

  delete = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      await this.service.delete(req.params.id as string);

      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({
        message: error.message,
      });
    }
  };
}