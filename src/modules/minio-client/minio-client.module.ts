import { Module } from '@nestjs/common';
import { MinioClientService } from './minio-client.service';
import { MinioModule } from 'nestjs-minio-client';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MinioModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const MinIO = configService.getOrThrow('minIO');
        return {
          endPoint: MinIO.ENDPOINT,
          port: parseInt(MinIO.PORT, 10),
          useSSL: MinIO.USE_SSL === 'true' ? true : false,
          accessKey: MinIO.ACCESSKEY,
          secretKey: MinIO.SECRETKEY,
        };
      },
    }),
  ],
  providers: [MinioClientService],
  exports: [MinioClientService],
})
export class MinioClientModule {}
