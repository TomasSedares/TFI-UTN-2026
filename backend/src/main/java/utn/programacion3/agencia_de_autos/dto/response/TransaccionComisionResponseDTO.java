package utn.programacion3.agencia_de_autos.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
public class TransaccionComisionResponseDTO {

    private Long id;

    private BigDecimal comision_total;

    private Long vendedor_id;

    private String nombre_completo;

    private String email;

    // Ventas concretadas por el vendedor en el período, con el vehículo y la fecha
    private List<VentaComisionResponseDTO> ventas;
}
