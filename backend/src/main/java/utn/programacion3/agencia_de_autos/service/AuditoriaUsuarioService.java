package utn.programacion3.agencia_de_autos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import utn.programacion3.agencia_de_autos.dto.response.AuditoriaUsuarioResponseDTO;
import utn.programacion3.agencia_de_autos.model.AuditoriaUsuario;
import utn.programacion3.agencia_de_autos.model.Usuario;
import utn.programacion3.agencia_de_autos.model.enums.AccionUsuario;
import utn.programacion3.agencia_de_autos.repository.AuditoriaUsuarioRepository;

@Service
@RequiredArgsConstructor
public class AuditoriaUsuarioService {

    private final AuditoriaUsuarioRepository auditoriaUsuarioRepository;

    public void registrar(Usuario usuario, AccionUsuario accion) {
        AuditoriaUsuario registro = AuditoriaUsuario.builder()
                .usuarioId(usuario.getId())
                .usuarioEmail(usuario.getEmail())
                .usuarioNombre(usuario.getNombre() + " " + usuario.getApellido())
                .accion(accion)
                .realizadoPorEmail(emailDeQuienHaceElCambio())
                .build();
        auditoriaUsuarioRepository.save(registro);
    }

    public Page<AuditoriaUsuarioResponseDTO> listar(Pageable pageable) {
        return auditoriaUsuarioRepository.findAll(pageable)
                .map(registro -> AuditoriaUsuarioResponseDTO.builder()
                        .id(registro.getId())
                        .usuarioId(registro.getUsuarioId())
                        .usuarioEmail(registro.getUsuarioEmail())
                        .usuarioNombre(registro.getUsuarioNombre())
                        .accion(registro.getAccion())
                        .realizadoPorEmail(registro.getRealizadoPorEmail())
                        .fecha(registro.getFecha())
                        .build());
    }

    private String emailDeQuienHaceElCambio() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null || autenticacion instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return autenticacion.getName();
    }
}
