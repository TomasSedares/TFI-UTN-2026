package utn.programacion3.agencia_de_autos.dto.response;

import lombok.*;
import utn.programacion3.agencia_de_autos.model.enums.EstadoTransaccion;
import utn.programacion3.agencia_de_autos.model.enums.MetodoPago;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TransaccionResponseDTO {

    private Long id;

    private String observaciones;

    private BigDecimal precio_final;

    private MetodoPago metodoPago;

    private EstadoTransaccion estadoTransaccion;

    private Long vehiculo_id;

    private String marca;

    private String modelo;

    private Integer vehiculo_anio;

    // Precio de venta publicado del vehículo (referencia para validar pagos)
    private BigDecimal precio_vehiculo;

    // Suma de todos los pagos registrados (señas + pagos de la venta)
    private BigDecimal total_pagado;

    private List<PagoResponseDTO> pagos;

    private String patente;

    private Long cliente_id;

    private String cliente_email;

    private Long vendedor_id;

    private String vendedor_nombre;

    private String vendedor_apellido;

    private String vendedor_email;

    private LocalDateTime fecha_visita;

    private LocalDate fecha_venta;
}
