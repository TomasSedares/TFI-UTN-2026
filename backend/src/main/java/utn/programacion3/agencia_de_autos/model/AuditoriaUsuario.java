package utn.programacion3.agencia_de_autos.model;

import jakarta.persistence.*;
import lombok.*;
import utn.programacion3.agencia_de_autos.model.enums.AccionUsuario;

import java.time.LocalDateTime;

// Historial de altas, bajas, reactivaciones y cambios de rol de usuarios
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuditoriaUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long usuarioId;

    private String usuarioEmail;

    private String usuarioNombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccionUsuario accion;

    // Email del administrador que hizo el cambio; null cuando la persona se registró sola
    private String realizadoPorEmail;

    @Builder.Default
    private LocalDateTime fecha = LocalDateTime.now();
}
