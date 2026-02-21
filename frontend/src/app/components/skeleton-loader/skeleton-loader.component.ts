import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [class.full-width]="fullWidth">
      @if (type === 'card') {
        <div class="skeleton-card">
          <div class="skeleton-header"></div>
          <div class="skeleton-content">
            <div class="skeleton-line" style="width: 60%"></div>
            <div class="skeleton-line" style="width: 80%"></div>
            <div class="skeleton-line" style="width: 40%"></div>
          </div>
        </div>
      } @else if (type === 'table') {
        <div class="skeleton-table">
          @for (row of rowsArray; track $index) {
            <div class="skeleton-table-row">
              @for (col of columnsArray; track $index) {
                <div class="skeleton-table-cell" [style.width.%]="100 / columns"></div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="skeleton-line" [style.width.%]="width"></div>
      }
    </div>
  `,
  styles: [`
    .skeleton-container {
      display: block;
    }

    .full-width {
      width: 100%;
    }

    .skeleton-card {
      background: #FFFFFF;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    .skeleton-header {
      height: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 16px;
      width: 40%;
    }

    .skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-table {
      background: #FFFFFF;
      border-radius: 8px;
      overflow: hidden;
    }

    .skeleton-table-row {
      display: flex;
      padding: 12px 16px;
      border-bottom: 1px solid #E0E0E0;
    }

    .skeleton-table-cell {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
      margin: 0 8px;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `],
})
export class SkeletonLoaderComponent {
  @Input() type: 'line' | 'card' | 'table' = 'line';
  @Input() width: number = 100;
  @Input() fullWidth: boolean = false;
  @Input() rows: number = 5;
  @Input() columns: number = 4;

  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
  get columnsArray(): number[] {
    return Array.from({ length: this.columns }, (_, i) => i);
  }
}
