import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ICepResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CepService {
  private readonly BASE_URl_VIA_CEP = 'https://viacep.com.br/ws';

  private readonly http = inject(HttpClient);

  public searchCep(cep: string): Observable<ICepResponse | null> {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return of(null);
    }

    return this.http.get<ICepResponse>(`${this.BASE_URl_VIA_CEP}/${cleanCep}/json`).pipe(
      map(response => {
        if (response.erro) {
          return null;
        }
        return response;
      }),
      catchError(() => of(null))
    );
  }
}

