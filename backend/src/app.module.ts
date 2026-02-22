import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { ClientInfoController } from './client-info/client-info.controller';
import { WaitTimesModule } from './wait-times/wait-times.module';
import { AccessibilityProfilesModule } from './accessibility-profiles/accessibility-profiles.module';
import { BurdenModelingModule } from './burden-modeling/burden-modeling.module';
import { CheckInModule } from './check-in/check-in.module';
import { PatientsModule } from './patients/patients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WaitTimesModule,
    AccessibilityProfilesModule,
    BurdenModelingModule,
    PatientsModule,
    CheckInModule,
  ],
  controllers: [AppController, HealthController, ClientInfoController],
  providers: [AppService],
})
export class AppModule {}
