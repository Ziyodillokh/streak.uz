import * as dotenv from 'dotenv';
import { IConfig } from './config.interface';
import MediaBucket from 'src/infra/shared/enum/media.enum';

dotenv.config();

function ensureEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}
// Configuration object
export default (): IConfig => ({
  port: parseInt(process.env.PORT || '4000', 10),
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  database: {
    host: ensureEnv('DB_HOST'),
    type: process.env.DB_TYPE || 'postgres',
    name: 'default',
    subscribers: [],
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: ensureEnv('DB_USERNAME'),
    password: ensureEnv('DB_PASSWORD'),
    database: ensureEnv('DB_NAME'),
    logging: false,
    autoLoadEntities: true,
    entities: ['./dist/**/*.entity.js'],
    synchronize: true,
    migrations: [`${__dirname}/../db/migrations/*{.ts,.js}`],
    migrationsTableName: 'migration',
    extra: {
      options: '-c timezone=Asia/Tashkent',
    },
  },

  jwt: {
    accessTokenSecret: ensureEnv('JWT_ACCESS_TOKEN_SECRET'),
    accessTokenExpiration: ensureEnv('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    refreshTokenSecret: ensureEnv('JWT_REFRESH_TOKEN_SECRET'),
    refreshTokenExpiration: ensureEnv('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
  },

  minIO: {
    ENDPOINT: ensureEnv('MINIO_ENDPOINT'),
    PORT: parseInt(ensureEnv('MINIO_PORT'), 10),
    ACCESSKEY: ensureEnv('MINIO_ACCESSKEY'),
    SECRETKEY: ensureEnv('MINIO_SECRETKEY'),
    BUCKET: MediaBucket.SPORTCATEGORYTYPE,
    useSSL: ensureEnv('MINIO_USE_SSL') === 'true',
  },

  googleOAuth: {
    clientID: ensureEnv('GOOGLE_CLIENT_ID'),
    clientSecret: ensureEnv('GOOGLE_CLIENT_SECRET'),
    callbackURL: ensureEnv('GOOGLE_CALLBACK_URL'),
  },

  newPasswordBytes: 4,
  codeBytes: 2,
});
