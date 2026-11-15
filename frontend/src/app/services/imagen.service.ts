import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Imagen, ImagenRequest } from '../models/Imagen';
import { IMAGENES_URL } from './api_config';

@Service()
export class ImagenService {
  private readonly http = inject(HttpClient);

  listarPorVehiculo(vehiculoId: number): Observable<Imagen[]> {
    return this.http.get<Imagen[]>(`${IMAGENES_URL}/vehiculo/${vehiculoId}`);
  }

  crear(imagen: ImagenRequest): Observable<Imagen> {
    return this.http.post<Imagen>(IMAGENES_URL, imagen);
  }

  actualizar(id: number, imagen: ImagenRequest): Observable<Imagen> {
    return this.http.put<Imagen>(`${IMAGENES_URL}/${id}`, imagen);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${IMAGENES_URL}/${id}`);
  }
}
