package utn.programacion3.agencia_de_autos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// Corre cada hora y cancela las visitas y reservas que no se concretaron en 7 días
@Component
@RequiredArgsConstructor
public class TransaccionVencimientoScheduler {

    private final TransaccionService transaccionService;

    @Scheduled(cron = "0 0 * * * *")
    public void cancelarVencidas() {
        transaccionService.cancelarVencidas();
    }
}
