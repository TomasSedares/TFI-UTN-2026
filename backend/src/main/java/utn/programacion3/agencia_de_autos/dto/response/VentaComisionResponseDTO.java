package utn.programacion3.agencia_de_autos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VentaComisionResponseDTO {

    private Long transaccion_id;

    private String marca;

    private String modelo;

    private Integer anio;

    private String patente;

    private LocalDate fecha_venta;

    private BigDecimal precio_final;

    private BigDecimal comision;
}
