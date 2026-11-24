import { Directive, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';

const ALTURA_BARRA_PX = 14;

// Agrega arriba de un contenedor con scroll horizontal una barra gemela, sincronizada con la de abajo
@Directive({
  selector: '[appScrollSuperior]',
})
export class ScrollSuperiorDirective implements OnDestroy {
  private readonly contenedor = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly barraSuperior = document.createElement('div');
  private readonly relleno = document.createElement('div');
  private observador: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => this.crearBarra());
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    this.barraSuperior.remove();
  }

  private crearBarra(): void {
    this.barraSuperior.style.overflowX = 'auto';
    this.barraSuperior.style.overflowY = 'hidden';
    this.barraSuperior.style.height = `${ALTURA_BARRA_PX}px`;
    this.relleno.style.height = '1px';
    this.barraSuperior.appendChild(this.relleno);
    this.contenedor.parentElement?.insertBefore(this.barraSuperior, this.contenedor);

    this.barraSuperior.addEventListener('scroll', () => this.copiarScroll(this.barraSuperior, this.contenedor));
    this.contenedor.addEventListener('scroll', () => this.copiarScroll(this.contenedor, this.barraSuperior));

    // El ancho de la barra de arriba sigue al ancho real de la tabla (cambia con los datos y el tamaño de ventana)
    this.observador = new ResizeObserver(() => this.ajustarAncho());
    this.observador.observe(this.contenedor);
    if (this.contenedor.firstElementChild) this.observador.observe(this.contenedor.firstElementChild);
    this.ajustarAncho();
  }

  private ajustarAncho(): void {
    this.relleno.style.width = `${this.contenedor.scrollWidth}px`;
    // Si la tabla entra sin scroll, la barra de arriba se oculta
    this.barraSuperior.style.display = this.contenedor.scrollWidth > this.contenedor.clientWidth ? 'block' : 'none';
  }

  private copiarScroll(origen: HTMLElement, destino: HTMLElement): void {
    // Solo se copia si difiere: así el scroll del otro lado no rebota y no se genera un bucle de eventos
    if (destino.scrollLeft !== origen.scrollLeft) destino.scrollLeft = origen.scrollLeft;
  }
}
