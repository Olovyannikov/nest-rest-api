import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Connection } from 'mongoose';
import { ProductsController } from './products.controller.js';
import { ProductsModule } from './products.module.js';

describe('ProductsController', () => {
  let mongod: MongoMemoryServer;
  let testingModule: TestingModule;
  let controller: ProductsController;
  let connection: Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
  }, 60_000);

  afterAll(async () => {
    await mongod.stop();
  });

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongod.getUri()), ProductsModule],
    }).compile();

    controller = testingModule.get(ProductsController);
    connection = testingModule.get<Connection>(getConnectionToken());
  });

  afterEach(async () => {
    await connection.dropDatabase();
    await testingModule.close();
  });

  it('отдаёт созданный товар в списке', async () => {
    await controller.createProduct({ title: 'Чайник', price: 2500 });

    const all = await controller.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Чайник');
  });

  it('отдаёт товар по id', async () => {
    const created = await controller.createProduct({
      title: 'Кружка',
      price: 400,
    });

    const found = await controller.getById(String(created._id));

    expect(found?.price).toBe(400);
  });
});
