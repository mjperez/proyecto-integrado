import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { entities } from "../entity";

const globalForTypeORM = global as unknown as {
  typeormDataSource: DataSource;
};

export const AppDataSource =
  globalForTypeORM.typeormDataSource ||
  new DataSource({
    type: 'postgres',
    url: process.env.DB_URL, 
    synchronize: process.env.NODE_ENV !== 'production',
    logging: true,
    ssl: true,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
    entities: entities,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForTypeORM.typeormDataSource = AppDataSource;
}

export const initializeDB = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};