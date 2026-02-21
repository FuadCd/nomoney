import { Body, Controller, Post } from '@nestjs/common';
import { BurdenModelingService } from './burden-modeling.service';
import { ComputeBurdenDto } from './dto/compute-burden.dto';
import { EstimatedWaitDto } from './dto/estimated-wait.dto';

@Controller('burden-modeling')
export class BurdenModelingController {
  constructor(private readonly burdenService: BurdenModelingService) {}

  @Post('compute')
  computeBurden(@Body() dto: ComputeBurdenDto) {
    return this.burdenService.computeBurden(dto);
  }

  @Post('estimated-wait')
  getEstimatedWait(@Body() dto: EstimatedWaitDto) {
    return this.burdenService.getEstimatedWaitMinutes(dto);
  }
}
