import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // lo hace accesible sin tener que importarlo en todos los módulos
@Module({
  providers: [PrismaService], // service !
  exports: [PrismaService], //carpeta dentro de src
})
export class PrismaModule {}
