// controllers/ProductController.ts

import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { CommercialType } from '../types/Product';

export class ProductController {
  constructor(
    private readonly service: ProductService
  ) {}

  findAll = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const {
        categoryId,
        commercialType,
        active,
        featured,
      } = req.query;

      const products =
        await this.service.findAll({
          categoryId: categoryId as string | undefined,

          commercialType:
            commercialType as CommercialType | undefined,

          active:
            active !== undefined
              ? active === 'true'
              : undefined,

          featured:
            featured !== undefined
              ? featured === 'true'
              : undefined,
        });

      res.status(200).json(products);
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
      const product =
        await this.service.findById(req.params.id as string);

      res.status(200).json(product);
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
      const product =
        await this.service.findBySlug(req.params.slug as string);

      res.status(200).json(product);
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
      const product =
        await this.service.create(req.body);

      res.status(201).json(product);
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
      const product =
        await this.service.update(
          req.params.id as string,
          req.body
        );

      res.status(200).json(product);
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