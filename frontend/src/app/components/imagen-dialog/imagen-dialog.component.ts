import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Imagen, ImagenRequest } from '../../models/Imagen';

export interface ImagenDialogData {
  imagen: Imagen | null;
  vehiculoId: number;
}

const TAMANIO_MAXIMO_MB = 2;

const TAMANIO_MAXIMO_BYTES = TAMANIO_MAXIMO_MB * 1024 * 1024;

const MSG = {
  imagenObligatoria: 'Elegí una imagen.',
  imagenMuyGrande: `La imagen no puede superar los ${TAMANIO_MAXIMO_MB} MB.`,
};

@Component({
  selector: 'app-imagen-dialog',
  imports: [FormsModule, MatDialogModule, MatSlideToggleModule, MatButton],
  styleUrl: './imagen-dialog.component.scss',
  templateUrl: './imagen-dialog.component.html',
})
export class ImagenDialogComponent {
  protected readonly data = inject<ImagenDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ImagenDialogComponent, ImagenRequest>>(MatDialogRef);

  protected readonly esEdicion = this.data.imagen !== null;
  protected readonly error = signal('');
  protected readonly url = signal(this.data.imagen?.url ?? '');
  protected esPrincipal = this.data.imagen?.esPrincipal ?? false;

  protected seleccionarArchivo(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    if (archivo.size > TAMANIO_MAXIMO_BYTES) {
      this.error.set(MSG.imagenMuyGrande);
      return;
    }

    this.error.set('');
    const lector = new FileReader();
    lector.onload = () => this.url.set(lector.result as string);
    lector.readAsDataURL(archivo);
  }

  protected confirmar(): void {
    if (!this.url()) {
      this.error.set(MSG.imagenObligatoria);
      return;
    }

    this.dialogRef.close({
      url: this.url(),
      esPrincipal: this.esPrincipal,
      vehiculoId: this.data.vehiculoId,
    });
  }

  protected cerrar(): void {
    this.dialogRef.close();
  }
}
