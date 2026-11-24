package utn.programacion3.agencia_de_autos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utn.programacion3.agencia_de_autos.dto.request.*;
import utn.programacion3.agencia_de_autos.dto.response.ReporteGananciasResponseDTO;
import utn.programacion3.agencia_de_autos.dto.response.VehiculoGestionResponseDTO;
import utn.programacion3.agencia_de_autos.dto.response.VehiculoPublicResponseDTO;
import utn.programacion3.agencia_de_autos.dto.response.VehiculoResponseDTO;
import utn.programacion3.agencia_de_autos.exception.ModeloNoEncontradoException;
import utn.programacion3.agencia_de_autos.exception.NegocioException;
import utn.programacion3.agencia_de_autos.exception.PatenteDuplicadaException;
import utn.programacion3.agencia_de_autos.exception.VehiculoNoEncontradoException;
import utn.programacion3.agencia_de_autos.mapper.VehiculoMapper;
import utn.programacion3.agencia_de_autos.model.Modelo;
import utn.programacion3.agencia_de_autos.model.Vehiculo;
import utn.programacion3.agencia_de_autos.model.enums.EstadoTransaccion;
import utn.programacion3.agencia_de_autos.model.enums.EstadoVehiculo;
import utn.programacion3.agencia_de_autos.model.enums.Rol;
import utn.programacion3.agencia_de_autos.repository.ModeloRepository;
import utn.programacion3.agencia_de_autos.repository.FavoritoRepository;
import utn.programacion3.agencia_de_autos.repository.ImagenVehiculoRepository;
import utn.programacion3.agencia_de_autos.repository.TransaccionRepository;
import utn.programacion3.agencia_de_autos.repository.VehiculoRepository;
import utn.programacion3.agencia_de_autos.repository.VehiculoSpecification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class VehiculoServiceImpl implements VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final ModeloRepository modeloRepository;
    private final VehiculoMapper vehiculoMapper;
    private final ImagenVehiculoService imagenVehiculoService;
    private final TransaccionRepository transaccionRepository;
    private final ImagenVehiculoRepository imagenVehiculoRepository;
    private final FavoritoRepository favoritoRepository;

    @Override
    public VehiculoResponseDTO crearVehiculo(VehiculoRequestDTO request) {

        if (vehiculoRepository.existsByPatente(request.getPatente())) {
            throw new PatenteDuplicadaException();
        }

        Modelo modelo = modeloRepository.findById(request.getModeloId())
                .orElseThrow(ModeloNoEncontradoException::new);

        validarModeloYMarcaActivos(modelo);

        Vehiculo vehiculo = vehiculoMapper.toEntity(request);

        vehiculo.setModelo(modelo);

        Vehiculo vehiculoGuardado = vehiculoRepository.save(vehiculo);

        return vehiculoMapper.toResponse(vehiculoGuardado);
    }

    // Un vehículo vendido vuelve a ponerse en venta: se crea uno nuevo y el anterior se archiva (su venta queda en el historial)
    @Override
    @Transactional
    public VehiculoResponseDTO reponerEnVenta(Long idVehiculoVendido, VehiculoRequestDTO request) {

        Vehiculo vehiculoVendido = vehiculoRepository.findById(idVehiculoVendido)
                .orElseThrow(VehiculoNoEncontradoException::new);

        if (vehiculoVendido.getEstado() != EstadoVehiculo.VENDIDO || Boolean.TRUE.equals(vehiculoVendido.getArchivado()))
            throw new NegocioException("Solo se puede volver a poner en venta un vehículo vendido.");

        VehiculoResponseDTO vehiculoNuevo = crearVehiculo(request);

        vehiculoVendido.setArchivado(true);
        vehiculoRepository.save(vehiculoVendido);

        return vehiculoNuevo;
    }

    private void validarModeloYMarcaActivos(Modelo modelo) {
        if (!Boolean.TRUE.equals(modelo.getMarca().getActivo())) {
            throw new NegocioException("No se pueden cargar vehículos de la marca "
                    + modelo.getMarca().getNombre() + " porque está inactiva.");
        }
        if (!Boolean.TRUE.equals(modelo.getActivo())) {
            throw new NegocioException("No se pueden cargar vehículos del modelo "
                    + modelo.getNombre() + " porque está inactivo.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Vehiculo obtenerVehiculoEntityPorId(Long id) {

        return vehiculoRepository.findById(id)
                .orElseThrow(VehiculoNoEncontradoException::new);
    }
    @Override
    @Transactional(readOnly = true)
    public VehiculoResponseDTO obtenerVehiculoPorId(Long id, Authentication authentication){
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(VehiculoNoEncontradoException::new);
        VehiculoResponseDTO dto = vehiculoMapper.toResponse(vehiculo);
        dto.setImagenes(imagenVehiculoService.obtenerTodasLasUrls(id));
        dto.setImagenPrincipalUrl(
                imagenVehiculoService.obtenerUrlPrincipal(vehiculo.getId())
        );

        boolean autenticado = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        if (autenticado) {
            dto.setEsPersonalAgencia(authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch(a -> a.equals("ROLE_" + Rol.VENDEDOR.name())
                            || a.equals("ROLE_" + Rol.ADMINISTRADOR.name())));
            dto.setTieneTransaccionActiva(
                    transaccionRepository.existsByVehiculoIdAndClienteEmailAndEstadoTransaccionNot(
                            id, authentication.getName(), EstadoTransaccion.CANCELADO)
            );
            dto.setTieneSolicitudPendiente(
                    transaccionRepository.existsByClienteEmailAndEstadoTransaccion(
                            authentication.getName(), EstadoTransaccion.SOLICITAR)
            );
        }
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehiculoPublicResponseDTO> obtenerVehiculosPublicos() {

        return vehiculoRepository.findAll()
                .stream()
                .map(vehiculoMapper::toPublicResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehiculoResponseDTO> obtenerVehiculosInternos() {

        return vehiculoRepository.findAll()
                .stream()
                .map(vehiculoMapper::toResponse)
                .toList();
    }

    @Override
    public VehiculoResponseDTO actualizarVehiculo(Long id, VehiculoRequestDTO request) {

        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(VehiculoNoEncontradoException::new);

        // Un vehículo vendido, reservado o señado tiene una operación en curso: no se edita
        if (vehiculo.getEstado() == EstadoVehiculo.VENDIDO || vehiculo.getEstado() == EstadoVehiculo.RESERVADO) {
            throw new NegocioException("No se puede editar un vehículo "
                    + (vehiculo.getEstado() == EstadoVehiculo.VENDIDO ? "vendido" : "reservado o señado") + ".");
        }

        Modelo modelo = modeloRepository.findById(request.getModeloId())
                .orElseThrow(ModeloNoEncontradoException::new);

        // Editar un vehículo que ya tenía un modelo inactivo está permitido; asignarle uno inactivo no
        if (!modelo.getId().equals(vehiculo.getModelo().getId())) {
            validarModeloYMarcaActivos(modelo);
        }

        vehiculo.setPatente(request.getPatente());
        vehiculo.setAnio(request.getAnio());
        vehiculo.setPrecioAdquisicion(request.getPrecioAdquisicion());
        vehiculo.setPrecioVenta(request.getPrecioVenta());
        vehiculo.setKilometraje(request.getKilometraje());
        vehiculo.setColor(request.getColor());
        vehiculo.setEstado(request.getEstado());
        vehiculo.setModelo(modelo);
        vehiculo.setDescripcion(request.getDescripcion());
        vehiculo.setTipoCombustible(request.getTipoCombustible());
        vehiculo.setTipoTransmision(request.getTipoTransmision());

        Vehiculo vehiculoActualizado = vehiculoRepository.save(vehiculo);

        return vehiculoMapper.toResponse(vehiculoActualizado);
    }

    @Override
    public VehiculoResponseDTO cambiarEstado(Long id, CambiarEstadoVehiculoDTO request) {

        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(VehiculoNoEncontradoException::new);

        vehiculo.setEstado(request.getEstado());

        Vehiculo vehiculoGuardado = vehiculoRepository.save(vehiculo);

        return vehiculoMapper.toResponse(vehiculoGuardado);
    }

    @Override
    public Vehiculo cambiarEstadoEntity(Long id, EstadoVehiculo estado) {

        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(VehiculoNoEncontradoException::new);

        vehiculo.setEstado(estado);

        return vehiculoRepository.save(vehiculo);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehiculoResponseDTO> buscarConFiltros(VehiculoFilterDTO filtros, Pageable pageable) {

        // Los vehículos vendidos solo los ve el personal de la agencia; el catálogo público nunca los muestra
        if (!esPersonalDeLaAgencia()) {
            filtros.setIncluirVendidos(false);
        }

        return vehiculoRepository.findAll(VehiculoSpecification.conFiltros(filtros), pageable)
                .map(vehiculo -> {
                    VehiculoResponseDTO dto = vehiculoMapper.toResponse(vehiculo);
                    dto.setImagenPrincipalUrl(
                            imagenVehiculoService.obtenerUrlPrincipal(vehiculo.getId())
                    );
                    return dto;
                });
    }

    private boolean esPersonalDeLaAgencia() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null || autenticacion instanceof AnonymousAuthenticationToken) {
            return false;
        }
        return autenticacion.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(rol -> rol.equals("ROLE_" + Rol.VENDEDOR.name())
                        || rol.equals("ROLE_" + Rol.ADMINISTRADOR.name()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehiculoGestionResponseDTO> listarParaGestion(Pageable pageable) {

        return vehiculoRepository.findByArchivadoFalse(pageable)
                .map(vehiculoMapper::toGestionResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReporteGananciasResponseDTO obtenerReporteGanancias() {

        List<Vehiculo> vehiculos = vehiculoRepository.findAll()
                .stream()
                .filter(v -> v.getEstado() == EstadoVehiculo.VENDIDO)
                .toList();

        List<ReporteGananciaVehiculoDTO> detalle = vehiculos.stream()
                .map(vehiculoMapper::toReporteGanancia)
                .toList();

        BigDecimal totalInvertido = vehiculos.stream()
                .map(Vehiculo::getPrecioAdquisicion)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalVenta = vehiculos.stream()
                .map(Vehiculo::getPrecioVenta)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal gananciaTotal = totalVenta.subtract(totalInvertido);

        return ReporteGananciasResponseDTO.builder()
                .totalInvertido(totalInvertido)
                .totalVenta(totalVenta)
                .gananciaTotal(gananciaTotal)
                .vehiculos(detalle)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ReporteStockVehiculoDTO obtenerReporteStock() {

        long disponibles = vehiculoRepository.countByEstado(EstadoVehiculo.DISPONIBLE);

        long reservados = vehiculoRepository.countByEstado(EstadoVehiculo.RESERVADO);

        long vendidos = vehiculoRepository.countByEstado(EstadoVehiculo.VENDIDO);

        long baja = vehiculoRepository.countByEstado(EstadoVehiculo.BAJA);

        return ReporteStockVehiculoDTO.builder()
                .disponibles(disponibles)
                .reservados(reservados)
                .vendidos(vendidos)
                .baja(baja)
                .total(disponibles + reservados + vendidos + baja)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehiculoResponseDTO> obtenerUltimosVehiculos(Integer cantidad) {

        Pageable pageable = PageRequest.of(
                0,
                cantidad,
                Sort.by("createdAt").descending()
        );

        return vehiculoRepository.findAll(pageable)
                .stream()
                .filter(vehiculo -> vehiculo.getEstado() != EstadoVehiculo.VENDIDO)
                .map(vehiculoMapper::toResponse)
                .toList();
    }



    @Override
    @Transactional
    public void eliminarVehiculo(Long id) {

        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(VehiculoNoEncontradoException::new);

        // Un vehículo con operaciones registradas (solicitudes, reservas, señas o ventas) no se puede borrar
        if (transaccionRepository.existsByVehiculoId(id)) {
            throw new NegocioException("No se puede eliminar el vehículo " + vehiculo.getPatente()
                    + " porque tiene transacciones asociadas (solicitudes, reservas, señas o ventas).");
        }

        // Las imágenes y los favoritos dependen del vehículo: se eliminan junto con él
        imagenVehiculoRepository.deleteByVehiculoId(id);
        favoritoRepository.deleteByVehiculoId(id);

        vehiculoRepository.delete(vehiculo);
    }


}