import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav
          #sidenav
          mode="side"
          [opened]="true"
          class="sidenav"
          [class.collapsed]="!sidebarOpen"
          [@sidebarAnimation]="sidebarOpen ? 'open' : 'closed'"
        >
          <div class="sidenav-header">
            <h2 class="app-title">AccessER</h2>
            <button
              mat-icon-button
              (click)="toggleSidebar()"
              matTooltip="Collapse sidebar"
              class="toggle-btn"
            >
              <mat-icon>{{ sidebarOpen ? 'chevron_left' : 'chevron_right' }}</mat-icon>
            </button>
          </div>
          <mat-nav-list>
            @for (item of navItems; track item.route) {
              <a
                mat-list-item
                [routerLink]="item.route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: false }"
                class="nav-item"
                [matTooltip]="!sidebarOpen ? item.label : ''"
              >
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                @if (sidebarOpen) {
                  <span matListItemTitle>{{ item.label }}</span>
                }
                @if (sidebarOpen && item.badge !== undefined && item.badge > 0) {
                  <span matListItemMeta>
                    <mat-chip class="badge-chip">{{ item.badge }}</mat-chip>
                  </span>
                }
              </a>
            }
          </mat-nav-list>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="main-content">
          <!-- Top Navbar -->
          <mat-toolbar class="navbar" color="primary">
            <button
              mat-icon-button
              (click)="toggleSidebar()"
              matTooltip="Toggle sidebar"
              class="menu-btn"
            >
              <mat-icon>menu</mat-icon>
            </button>

            <!-- Breadcrumbs -->
            <div class="breadcrumbs">
              @for (crumb of breadcrumbs; track crumb; let last = $last) {
                <span class="breadcrumb-item">
                  {{ crumb }}
                  @if (!last) {
                    <mat-icon class="breadcrumb-icon">chevron_right</mat-icon>
                  }
                </span>
              }
            </div>

            <span class="spacer"></span>

            <!-- Notifications -->
            <button
              mat-icon-button
              [matBadge]="notificationCount"
              [matBadgeHidden]="notificationCount === 0"
              matBadgeColor="warn"
              matTooltip="Notifications"
              class="icon-btn"
            >
              <mat-icon>notifications</mat-icon>
            </button>

            <!-- User Menu -->
            <button
              mat-icon-button
              [matMenuTriggerFor]="userMenu"
              matTooltip="User menu"
              class="user-btn"
            >
              <mat-icon>account_circle</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item>
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </button>
              <button mat-menu-item>
                <mat-icon>settings</mat-icon>
                <span>Settings</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="onSignOut.emit()">
                <mat-icon>logout</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </mat-toolbar>

          <!-- Content Area -->
          <div class="content-wrapper">
            <ng-content></ng-content>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .sidenav-container {
      flex: 1;
      height: 100vh;
    }

    .sidenav {
      width: 260px;
      background: #FFFFFF;
      border-right: 1px solid #E0E0E0;
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
      transition: width 300ms ease-in-out;
    }

    .sidenav.collapsed {
      width: 64px;
    }

    .sidenav-header {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #E0E0E0;
    }

    .app-title {
      font-size: 20px;
      font-weight: 700;
      color: #1E3A5F;
      margin: 0;
    }

    .toggle-btn {
      width: 32px;
      height: 32px;
    }

    .nav-item {
      margin: 4px 8px;
      border-radius: 8px;
      transition: background-color 0.2s;

      &.active {
        background-color: #1E3A5F;
        color: white;

        mat-icon {
          color: white;
        }
      }

      &:hover:not(.active) {
        background-color: #F4F6F9;
      }
    }

    .badge-chip {
      background-color: #2196F3;
      color: white;
      font-size: 11px;
      height: 20px;
      min-width: 20px;
      padding: 0 6px;
    }

    .navbar {
      background: #FFFFFF !important;
      color: #1A1A2E;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      height: 64px;
      padding: 0 16px;
      display: flex;
      align-items: center;
    }

    .menu-btn {
      margin-right: 16px;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #666;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
    }

    .breadcrumb-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin: 0 8px;
      color: #999;
    }

    .spacer {
      flex: 1;
    }

    .icon-btn, .user-btn {
      margin-left: 8px;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .content-wrapper {
      flex: 1;
      overflow-y: auto;
      background: #F4F6F9;
      padding: 24px;
    }
  `],
  animations: [
    trigger('sidebarAnimation', [
      state('open', style({ width: '260px' })),
      state('closed', style({ width: '64px' })),
      transition('open <=> closed', animate('300ms ease-in-out')),
    ]),
  ],
})
export class DashboardLayoutComponent {
  @Input() navItems: NavItem[] = [];
  @Input() breadcrumbs: string[] = [];
  @Input() notificationCount: number = 0;
  @Input() sidebarOpen: boolean = true;
  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Output() onSignOut = new EventEmitter<void>();

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarToggle.emit(this.sidebarOpen);
  }
}
