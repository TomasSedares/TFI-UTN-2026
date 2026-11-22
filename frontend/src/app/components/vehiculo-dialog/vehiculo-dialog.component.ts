import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Imagen } from '../../models/Imagen';
import { ETIQUETA_TIPO_MODELO, Marca, Modelo } from '../../models/Opciones';
import {
  ETIQUETA_COMBUSTIBLE,
  ETIQUETA_TRANSMISION,
  EstadoVehiculo,
  TipoCombustible,
  TipoTransmision,
  VehiculoGestion,
  VehiculoRequest,
} from '../../models/Vehiculo';

export interface VehiculoDialogData {
  vehiculo: VehiculoGestion | null;
  marcas: Marca[];
  modelos: Modelo[];
  imagenesExistentes: Imagen[];
}

// Imagen en edición dentro del diálogo: las ya guardadas tienen id, las recién elegidas no
export interface ImagenEnEdicion {
  id: number | null;
  url: string;
  esPrincipal: boolean;
}

export interface VehiculoDialogResultado {
  vehiculo: VehiculoRequest;
  imagenesNuevas: ImagenEnEdicion[];
  idsImagenesAEliminar: number[];
  imagenPrincipalExistente: ImagenEnEdicion | null;
}

const TAMANIO_MAXIMO_MB = 2;

const TAMANIO_MAXIMO_BYTES = TAMANIO_MAXIMO_MB * 1024 * 1024;

// Patente argentina: vieja (ABC123) o Mercosur (AB123CD)
const PATENTE_REGEX = /^([A-Za-z]{3}\d{3}|[A-Za-z]{2}\d{3}[A-Za-z]{2})$/;

const MSG = {
  imagenMuyGrande: `Cada imagen no puede superar los ${TAMANIO_MAXIMO_MB} MB.`,
  obligatorio: 'Campo obligatorio',
  patenteInvalida: 'Formato inválido (ej: AB123CD o ABC123)',
  invalido: 'Valor inválido',
};

@Component({
  selector: 'app-vehiculo-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButton],
  styleUrl: './vehiculo-dialog.component.scss',
  templateUrl: './vehiculo-dialog.component.html',
})
export class VehiculoDialogComponent {
  protected readonly data = inject<VehiculoDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<VehiculoDialogComponent, VehiculoDialogResultado>>(MatDialogRef);
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly vehiculo = this.data.vehiculo;

  protected readonly esEdicion = this.vehiculo !== null;
  protected readonly esVendido = this.vehiculo?.estado === EstadoVehiculo.VENDIDO;
  protected readonly combustibles = Object.values(TipoCombustible);
  protected readonly transmisiones = Object.values(TipoTransmision);
  protected readonly etiquetaCombustible = ETIQUETA_COMBUSTIBLE;
  protected readonly etiquetaTransmision = ETIQUETA_TRANSMISION;

  // Solo se pueden cargar vehículos de marcas y modelos activos (el actual se conserva al editar)
  protected readonly marcasActivas = this.data.marcas.filter(
    marca => marca.activo || marca.id === this.vehiculo?.marcaId,
  );

  protected readonly imagenes = signal<ImagenEnEdicion[]>(
    this.data.imagenesExistentes.map(imagen => ({ id: imagen.id, url: imagen.url, esPrincipal: imagen.esPrincipal })),
  );
  protected readonly errorImagen = signal('');
  private readonly idsImagenesAEliminar: number[] = [];

  protected readonly formulario = this.fb.group({
    patente: [this.vehiculo?.patente ?? '', [Validators.required, Validators.pattern(PATENTE_REGEX)]],
    marcaId: this.fb.control<number | null>(this.vehiculo?.marcaId ?? null, Validators.required),
    modeloId: this.fb.control<number | null>(this.vehiculo?.modeloId ?? null, Validators.required),
    anio: this.fb.control<number | null>(this.vehiculo?.anio ?? null, Validators.required),
    kilometraje: this.fb.control<number | null>(this.vehiculo?.kilometraje ?? null, [Validators.required, Validators.min(0)]),
    precioAdquisicion: this.fb.control<number | null>(
      { value: this.vehiculo?.precioAdquisicion ?? null, disabled: this.esVendido },
      [Validators.required, Validators.min(0)],
    ),
    precioVenta: this.fb.control<number | null>(this.vehiculo?.precioVenta ?? null, [Validators.required, Validators.min(0)]),
    tipoCombustible: this.fb.control<TipoCombustible | null>(this.vehiculo?.tipoCombustible ?? null, Validators.required),
    tipoTransmision: this.fb.control<TipoTransmision | null>(this.vehiculo?.tipoTransmision ?? null, Validators.required),
    color: [this.vehiculo?.color ?? '', Validators.required],
    descripcion: [this.vehiculo?.descripcion ?? ''],
  });

  private readonly marcaSeleccionada = toSignal(this.formulario.controls.marcaId.valueChanges, {
    initialValue: this.formulario.controls.marcaId.value,
  });

  protected readonly etiquetaTipoModelo = ETIQUETA_TIPO_MODELO;

  private readonly modeloSeleccionado = toSignal(this.formulario.controls.modeloId.valueChanges, {
    initialValue: this.formulario.controls.modeloId.value,
  });

  // Modelos activos de la marca elegida (el modelo actual del vehículo se conserva al editar)
  private readonly modelosActivosDeMarca = computed(() =>
    this.data.modelos.filter(
      modelo => modelo.marcaId === this.marcaSeleccionada()
        && (modelo.activo || modelo.id === this.vehiculo?.modeloId),
    ),
  );

  // El selector muestra cada modelo una sola vez (nombre + tipo), sin importar cuántos años tenga cargados
  protected readonly modelosDeMarca = computed(() => {
    const modeloPorClave = new Map<string, Modelo>();
    for (const modelo of this.modelosActivosDeMarca()) {
      const clave = `${modelo.nombre.toLowerCase()}|${modelo.tipoModelo}`;
      const representante = modeloPorClave.get(clave);
      if (!representante || modelo.id === this.vehiculo?.modeloId) modeloPorClave.set(clave, modelo);
    }
    return [...modeloPorClave.values()];
  });

  // Mismo modelo cargado en distintos años: el elegido y sus "hermanos" (misma marca, nombre y tipo)
  private readonly modelosHermanos = computed(() => {
    const modeloElegido = this.data.modelos.find(modelo => modelo.id === this.modeloSeleccionado());
    if (!modeloElegido) return [];
    return this.modelosActivosDeMarca().filter(
      modelo => modelo.nombre.toLowerCase() === modeloElegido.nombre.toLowerCase()
        && modelo.tipoModelo === modeloElegido.tipoModelo,
    );
  });

  // Solo se pueden elegir los años que están cargados en "Modelos" para ese modelo
  protected readonly aniosDisponibles = computed(() =>
    [...new Set(this.modelosHermanos().map(modelo => modelo.anio))].sort((anioA, anioB) => anioB - anioA),
  );

  constructor() {
    this.formulario.controls.marcaId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.formulario.controls.modeloId.setValue(null));

    // Al elegir un modelo se propone su año (el más reciente si hay varios)
    this.formulario.controls.modeloId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.formulario.controls.anio.setValue(this.aniosDisponibles()[0] ?? null));
  }

  protected seleccionarArchivos(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivos = Array.from(entrada.files ?? []);
    entrada.value = '';

    for (const archivo of archivos) {
      if (archivo.size > TAMANIO_MAXIMO_BYTES) {
        this.errorImagen.set(MSG.imagenMuyGrande);
        continue;
      }
      this.errorImagen.set('');
      const lector = new FileReader();
      lector.onload = () => {
        const sinPrincipal = !this.imagenes().some(imagen => imagen.esPrincipal);
        this.imagenes.update(imagenes => [
          ...imagenes,
          { id: null, url: lector.result as string, esPrincipal: sinPrincipal },
        ]);
      };
      lector.readAsDataURL(archivo);
    }
  }

  protected marcarPrincipal(indice: number): void {
    this.imagenes.update(imagenes =>
      imagenes.map((imagen, posicion) => ({ ...imagen, esPrincipal: posicion === indice })),
    );
  }

  protected quitarImagen(indice: number): void {
    const imagenQuitada = this.imagenes()[indice];
    if (imagenQuitada.id !== null) this.idsImagenesAEliminar.push(imagenQuitada.id);

    const quedan = this.imagenes().filter((_, posicion) => posicion !== indice);
    // Si se quita la principal, la primera que quede pasa a serlo
    if (imagenQuitada.esPrincipal && quedan.length) quedan[0] = { ...quedan[0], esPrincipal: true };
    this.imagenes.set(quedan);
  }

  protected confirmar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const imagenesActuales = this.imagenes();
    const imagenesIniciales = this.data.imagenesExistentes;
    const principalActual = imagenesActuales.find(imagen => imagen.esPrincipal && imagen.id !== null) ?? null;
    const principalInicial = imagenesIniciales.find(imagen => imagen.esPrincipal) ?? null;

    const vehiculoRequest: VehiculoRequest = {
      patente: valores.patente.trim().toUpperCase(),
      anio: valores.anio!,
      precioAdquisicion: valores.precioAdquisicion!,
      precioVenta: valores.precioVenta!,
      modeloId: this.idDelModeloConElAnio(valores.modeloId!, valores.anio!),
      kilometraje: valores.kilometraje!,
      color: valores.color.trim(),
      descripcion: valores.descripcion.trim(),
      estado: this.vehiculo?.estado ?? EstadoVehiculo.DISPONIBLE,
      tipoTransmision: valores.tipoTransmision!,
      tipoCombustible: valores.tipoCombustible!,
    };

    this.dialogRef.close({
      vehiculo: vehiculoRequest,
      imagenesNuevas: imagenesActuales.filter(imagen => imagen.id === null),
      idsImagenesAEliminar: this.idsImagenesAEliminar,
      // Solo hay que actualizar una imagen ya guardada si pasó a ser la principal
      imagenPrincipalExistente: principalActual && principalActual.id !== principalInicial?.id ? principalActual : null,
    });
  }

  // Cada año de un modelo es una fila en "Modelos": se guarda el vehículo con la fila del año elegido
  private idDelModeloConElAnio(modeloIdElegido: number, anioElegido: number): number {
    const modeloDelAnio = this.modelosHermanos().find(modelo => modelo.anio === anioElegido);
    return modeloDelAnio?.id ?? modeloIdElegido;
  }

  protected cerrar(): void {
    this.dialogRef.close();
  }

  protected mensajeError(campo: keyof VehiculoDialogComponent['formulario']['controls']): string {
    const errores = this.formulario.controls[campo].errors;
    if (!errores) return '';
    if (errores['required']) return MSG.obligatorio;
    if (errores['pattern']) return MSG.patenteInvalida;
    if (errores['min']) return `El mínimo es ${errores['min'].min}`;
    if (errores['max']) return `El máximo es ${errores['max'].max}`;
    return MSG.invalido;
  }
}
