import { Module } from '@nestjs/common';
// MailerModule eliminado por Brevo HTTP API
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { enviroments } from './core/enviroments';
import { UsersModule } from './features/users/users.module';
import { RolesModule } from './features/roles/roles.module';
import { AuthModule } from './auth/auth.module';

import { ProductsModule } from './features/products/products.module';
import { EventsModule } from './features/events/events.module';
import { EventRegistrationsModule } from './features/event-registrations/event-registrations.module';
import { MembershipsModule } from './features/memberships/memberships.module';
import { ReviewsModule } from './features/reviews/reviews.module';
import { ContactsModule } from './features/contacts/contacts.module';
import { PaymentsModule } from './features/payments/payments.module';
import { TrainersModule } from './features/trainers/trainers.module';
import { MachinesModule } from './features/machines/machines.module';
import { OrdersModule } from './features/orders/orders.module';
import { FilesModule } from './features/files/files.module';
import { CategoriesModule } from './features/categories/categories.module';
import { SettingsModule } from './features/settings/settings.module';
import config from './core/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        POSTGRES_DB: Joi.string().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_HOST: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.number().required(),
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().optional(),
        GOOGLE_CALLBACK_URL: Joi.string().optional(),
        FRONTEND_URL: Joi.string().optional(),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASSWORD: Joi.string().optional(),
        STRIPE_SECRET_KEY: Joi.string().optional(),
        STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
      }),
    }),
    // MailerModule removido para usar protocolo HTTP en la nube
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads/',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ProductsModule,
    EventsModule,
    EventRegistrationsModule,
    MembershipsModule,
    ReviewsModule,
    ContactsModule,
    PaymentsModule,
    TrainersModule,
    MachinesModule,
    OrdersModule,
    FilesModule,
    CategoriesModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
