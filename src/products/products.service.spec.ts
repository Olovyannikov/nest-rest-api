import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Connection } from 'mongoose';
import { ProductsService } from './products.service.js';
import { Product, ProductSchema } from './schemas/product.schema.js';

describe('ProductsService', () => {
  let mongod: MongoMemoryServer;
  let testingModule: TestingModule;
  let service: ProductsService;
  let connection: Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
  }, 60_000);

  afterAll(async () => {
    await mongod.stop();
  });

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([
          { name: Product.name, schema: ProductSchema },
        ]),
      ],
      providers: [ProductsService],
    }).compile();

    service = testingModule.get(ProductsService);
    connection = testingModule.get<Connection>(getConnectionToken());
  });

  afterEach(async () => {
    await connection.dropDatabase();
    await testingModule.close();
  });

  it('сохраняет товар в базу и возвращает его', async () => {
    const created = await service.createProduct({
      title: 'Чайник',
      price: 2500,
    });

    expect(created.title).toBe('Чайник');
    expect(created.price).toBe(2500);

    const stored = await connection
      .collection('products')
      .findOne({ title: 'Чайник' });
    expect(stored?.price).toBe(2500);
  });

  it('возвращает все сохранённые товары', async () => {
    await service.createProduct({ title: 'Чайник', price: 2500 });
    await service.createProduct({ title: 'Кружка', price: 400 });

    const all = await service.getAll();

    expect(all.map((product) => product.title).sort()).toEqual([
      'Кружка',
      'Чайник',
    ]);
  });

  it('не хранит товары в памяти процесса между подключениями', async () => {
    await service.createProduct({ title: 'Чайник', price: 2500 });
    await connection.dropDatabase();

    expect(await service.getAll()).toEqual([]);
  });

  it('находит товар по id', async () => {
    const created = await service.createProduct({
      title: 'Чайник',
      price: 2500,
    });

    const found = await service.getProductById(String(created._id));

    expect(found?.title).toBe('Чайник');
  });

  it('возвращает null, если товара с таким id нет', async () => {
    const found = await service.getProductById('507f1f77bcf86cd799439011');

    expect(found).toBeNull();
  });

  it('возвращает null, если id не является корректным ObjectId', async () => {
    const found = await service.getProductById('не-objectid');

    expect(found).toBeNull();
  });
});
