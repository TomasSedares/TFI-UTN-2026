export interface Imagen {
  id: number;
  url: string;
  esPrincipal: boolean;
  patenteVehiculo: string;
}

export interface ImagenRequest extends Pick<Imagen, 'url' | 'esPrincipal'> {
  vehiculoId: number;
}
