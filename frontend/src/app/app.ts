import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BurdenUpdaterService } from './core/burden-updater.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('FairQ');

  constructor(_burdenUpdater: BurdenUpdaterService) {
    // Start P2 burden + 20-min check-in tick (no UI change)
  }
}
