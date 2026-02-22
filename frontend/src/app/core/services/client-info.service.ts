import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ClientInfo {
  clientIp: string;
}

@Injectable({ providedIn: 'root' })
export class ClientInfoService {
  private readonly api = inject(ApiService);

  getClientIp(): Observable<string> {
    return this.api.get<ClientInfo>('/client-info').pipe(
      map((res) => res?.clientIp ?? ''),
      catchError(() => of('')),
    );
  }
}
