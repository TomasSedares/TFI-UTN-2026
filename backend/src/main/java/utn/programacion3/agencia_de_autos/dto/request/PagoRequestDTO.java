package utn.programacion3.agencia_de_autos.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import utn.programacion3.agencia_de_autos.model.enums.MetodoPago;

import java.math.BigDecimal;

@Getter
@Setter
public class PagoRequestDTO {

    @Schema(description = "Método con el que se paga esta parte", example = "EFECTIVO",
            allowableValues = {"EFECTIVO", "TRANSFERENCIA", "PLAN_AHORRO", "CUOTA_BANCARIZADA"})
    @NotNull(message = "El método de pago no puede estar vacío")
    private MetodoPago metodoPago;

    @Schema(description = "Monto de esta parte del pago", example = "5000000", minimum = "0.01")
    @NotNull(message = "El monto no puede estar vacío")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal monto;
}
