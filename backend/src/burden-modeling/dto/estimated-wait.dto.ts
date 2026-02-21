export class EstimatedWaitDto {
  facilityId: string;
  vulnerabilityMultiplier: number;
  estimatedCtasLevel: number; // 1-5
  waitTimeMinutes: number;
}
