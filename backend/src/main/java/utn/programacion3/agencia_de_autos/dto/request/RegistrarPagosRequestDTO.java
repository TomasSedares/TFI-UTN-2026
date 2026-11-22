package utn.programacion3.agencia_de_autos.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RegistrarPagosRequestDTO {

    @Schema(description = "Partes del pago, cada una con su método. La suma se valida contra el precio del vehículo")
    @NotEmpty(message = "Tenés que informar al menos un pago")
    @Valid
    private List<PagoRequestDTO> pagos;
}
