console.log("DEBUG ENV:", process.env.DATABASE_URL);

import 'reflect-metadata';
import { DataSource } from 'typeorm';

const globalForTypeORM = global as unknown as {
  typeormDataSource: DataSource;
};

export const AppDataSource =
  globalForTypeORM.typeormDataSource ||
  new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL, 
    synchronize: process.env.NODE_ENV !== 'production',
    logging: false,
    ssl: true,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
    entities: [],
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