package utn.programacion3.agencia_de_autos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import utn.programacion3.agencia_de_autos.model.enums.MetodoPago;
import utn.programacion3.agencia_de_autos.model.enums.TipoPago;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PagoResponseDTO {

    private Long id;

    private MetodoPago metodoPago;

    private BigDecimal monto;

    private TipoPago tipo;

    private LocalDateTime fecha;
}
