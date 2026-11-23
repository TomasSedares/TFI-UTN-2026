package utn.programacion3.agencia_de_autos.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import lombok.Getter;
import utn.programacion3.agencia_de_autos.model.enums.MetodoPago;

import java.time.LocalDateTime;

@Getter
public class EditarTransaccionRequestDTO {

    @Schema(description = "Nueva fecha y hora de la visita (solo para visitas pendientes)", example = "2026-11-25T10:30:00")
    @Future(message = "La fecha de visita debe ser futura")
    private LocalDateTime fechaVisita;

    @Schema(description = "Observaciones de la transacción", example = "El cliente prefiere la tarde")
    private String observaciones;

    @Schema(description = "Método de pago previsto (solo para reservas y señas)", example = "TRANSFERENCIA")
    private MetodoPago metodoPago;
}
