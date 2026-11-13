import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto.js';
import { Product, ProductDocument } from './schemas/product.schema.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async getAll(): Promise<ProductDocument[]> {
    return this.productModel.find().exec();
  }

  async getProductById(id: string): Promise<ProductDocument | null> {
    // findById бросает CastError на строке, которая не является ObjectId.
    if (!isValidObjectId(id)) {
      return null;
    }

    return this.productModel.findById(id).exec();
  }

  createProduct(newProduct: CreateProductDto): Promise<ProductDocument> {
    return this.productModel.create(newProduct);
  }

  removeProduct(id: string) {
    return this.productModel.findByIdAndDelete(id);
  }

  updateProduct(id: string, productDto: UpdateProductDto) {
    return this.productModel.findByIdAndUpdate(id, productDto, {
      returnDocument: 'after',
    });
  }
}
