import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagina } from '../models/Vehiculo';
import { AuditoriaTransaccion, AuditoriaUsuario, FiltrosAuditoria } from '../models/Transacciones';
import { AUDITORIA_URL } from './api_config';

@Service()
export class AuditoriaService {
  private readonly http = inject(HttpClient);

  listar(pagina = 0, tamanio = 10, filtros: FiltrosAuditoria = {}): Observable<Pagina<AuditoriaTransaccion>> {
    let params = new HttpParams().set('page', pagina).set('size', tamanio).set('sort', 'id,desc');
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined) params = params.set(clave, valor);
    }
    return this.http.get<Pagina<AuditoriaTransaccion>>(AUDITORIA_URL, { params });
  }

  listarUsuarios(pagina = 0, tamanio = 10): Observable<Pagina<AuditoriaUsuario>> {
    const params = new HttpParams().set('page', pagina).set('size', tamanio).set('sort', 'id,desc');
    return this.http.get<Pagina<AuditoriaUsuario>>(`${AUDITORIA_URL}/usuarios`, { params });
  }
}
