package utn.programacion3.agencia_de_autos.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import utn.programacion3.agencia_de_autos.dto.request.AsignarVisitaRequestDTO;
import utn.programacion3.agencia_de_autos.dto.request.EditarTransaccionRequestDTO;
import utn.programacion3.agencia_de_autos.dto.request.PagoRequestDTO;
import utn.programacion3.agencia_de_autos.dto.request.RegistrarPagosRequestDTO;
import utn.programacion3.agencia_de_autos.dto.request.SolicitudTransaccionRequestDTO;
import utn.programacion3.agencia_de_autos.dto.request.TransaccionFilterDTO;
import utn.programacion3.agencia_de_autos.dto.request.TransaccionRequestDTO;
import utn.programacion3.agencia_de_autos.dto.response.PagoResponseDTO;
import utn.programacion3.agencia_de_autos.dto.response.TransaccionBalanceResponseDTO;
import utn.programacion3.agencia_de_autos.dto.response.VentaComisionResponseDTO;
import utn.programacion3.agencia_de_autos.dto.response.TransaccionComisionResponseDTO;
import utn.programacion3.agencia_de_autos.dto.response.TransaccionResponseDTO;
import utn.programacion3.agencia_de_autos.exception.NegocioException;
import utn.programacion3.agencia_de_autos.exception.ResourceNotFoundException;
import utn.programacion3.agencia_de_autos.exception.TransaccionNoModificableException;
import utn.programacion3.agencia_de_autos.exception.VehiculoNoDisponibleException;
import utn.programacion3.agencia_de_autos.mapper.SolicitudTransaccionMapper;
import utn.programacion3.agencia_de_autos.mapper.TransaccionMapper;
import utn.programacion3.agencia_de_autos.model.BalanceProyeccion;
import utn.programacion3.agencia_de_autos.model.PagoTransaccion;
import utn.programacion3.agencia_de_autos.model.Transaccion;
import utn.programacion3.agencia_de_autos.model.Usuario;
import utn.programacion3.agencia_de_autos.model.Vehiculo;
import utn.programacion3.agencia_de_autos.model.enums.EstadoTransaccion;
import utn.programacion3.agencia_de_autos.model.enums.EstadoVehiculo;
import utn.programacion3.agencia_de_autos.model.enums.Rol;
import utn.programacion3.agencia_de_autos.model.enums.TipoPago;
import utn.programacion3.agencia_de_autos.repository.PagoTransaccionRepository;
import utn.programacion3.agencia_de_autos.repository.TransaccionRepository;
import utn.programacion3.agencia_de_autos.repository.TransaccionSpecification;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionRepository transaccionRepository;
    private final TransaccionMapper transaccionMapper;
    private final SolicitudTransaccionMapper solicitudTransaccionMapper;
    private final UsuarioService usuarioService;
    private final VehiculoServiceImpl vehiculoService;
    private final AuditoriaTransaccionService auditoriaTransaccionService;
    private final PagoTransaccionRepository pagoTransaccionRepository;

    // Reglas de negocio de visitas y reservas
    public static final int MAXIMO_VISITAS_POR_SEMANA = 3;
    public static final int DIAS_PARA_CONCRETAR = 7;
    public static final int DIAS_MAXIMOS_HASTA_LA_VISITA = 14;

    public static final BigDecimal comision_vendedores = new BigDecimal("0.05");   // 5%

    public static BigDecimal calcularComision(BigDecimal precio_final){
        return precio_final.multiply(TransaccionService.comision_vendedores);
    }


    @Transactional(readOnly = true)
    public Page<TransaccionResponseDTO> listarConFiltros(TransaccionFilterDTO filtros, Pageable pageable) {
        return transaccionRepository.findAll(TransaccionSpecification.conFiltros(filtros), pageable)
                .map(this::aRespuesta);
    }

    // Mapea la transacción y le agrega los pagos registrados y el total pagado
    private TransaccionResponseDTO aRespuesta(Transaccion transaccion) {
        TransaccionResponseDTO respuesta = transaccionMapper.toResponseDTO(transaccion);
        List<PagoTransaccion> pagosRegistrados = pagoTransaccionRepository
                .findByTransaccionIdOrderByIdAsc(transaccion.getId());

        respuesta.setPagos(pagosRegistrados.stream()
                .map(pago -> PagoResponseDTO.builder()
                        .id(pago.getId())
                        .metodoPago(pago.getMetodoPago())
                        .monto(pago.getMonto())
                        .tipo(pago.getTipo())
                        .fecha(pago.getFecha())
                        .build())
                .toList());
        respuesta.setTotal_pagado(pagosRegistrados.stream()
                .map(PagoTransaccion::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        return respuesta;
    }


    @Transactional
    public TransaccionResponseDTO crear(TransaccionRequestDTO dto) {

        Usuario cliente = usuarioService.buscarEntityPorId(dto.getCliente_id());
        Usuario vendedor = usuarioService.buscarEntityPorId(dto.getVendedor_id());
        Vehiculo vehiculo = vehiculoService.obtenerVehiculoEntityPorId(dto.getVehiculo_id());

        if (vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE)
            throw new VehiculoNoDisponibleException("El vehiculo requerido no está disponoble");

        Transaccion transaccion = transaccionMapper.toEntity(dto);
        transaccion.setCliente(cliente);
        transaccion.setVehiculo(vehiculo);
        transaccion.setVendedor(vendedor);
        // El precio de la transacción siempre es el precio de venta del vehículo
        transaccion.setPrecio_final(vehiculo.getPrecioVenta());
        transaccion.setFecha_reserva(LocalDateTime.now());

        vehiculoService.cambiarEstadoEntity(dto.getVehiculo_id(), EstadoVehiculo.RESERVADO);
        Transaccion transaccionGuardada = transaccionRepository.save(transaccion);
        auditoriaTransaccionService.registrarCreacion(transaccionGuardada);
        cancelarOtrasSolicitudes(transaccionGuardada);

        return aRespuesta(transaccionGuardada);
    }

    @Transactional
    public TransaccionResponseDTO solicitar(SolicitudTransaccionRequestDTO dto, String emailCliente) {

        Usuario cliente = usuarioService.buscarEntityPorEmail(emailCliente);
        Vehiculo vehiculo = vehiculoService.obtenerVehiculoEntityPorId(dto.getVehiculo_id());

        if (vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE)
            throw new VehiculoNoDisponibleException("El vehiculo requerido no está disponible");

        if (transaccionRepository.existsByClienteEmailAndEstadoTransaccion(emailCliente, EstadoTransaccion.SOLICITAR))
            throw new NegocioException("Ya tenés una visita pendiente");

        Transaccion solicitud = solicitudTransaccionMapper.toEntity(dto);
        solicitud.setCliente(cliente);
        solicitud.setVehiculo(vehiculo);

        Transaccion solicitudGuardada = transaccionRepository.save(solicitud);
        auditoriaTransaccionService.registrarCreacion(solicitudGuardada);

        return aRespuesta(solicitudGuardada);
    }

    @Transactional
    public TransaccionResponseDTO asignar(Long id, AsignarVisitaRequestDTO dto, String emailVendedor) {

        Transaccion transaccion = buscarEntityPorId(id);
        Transaccion snapshotAnterior = crearSnapshot(transaccion);
        Usuario vendedor = usuarioService.buscarEntityPorEmail(emailVendedor);

        if (transaccion.getEstadoTransaccion() != EstadoTransaccion.SOLICITAR)
            throw new TransaccionNoModificableException("Solo se pueden asignar transacciones en estado SOLICITAR");

        if (transaccion.getVendedor() != null && !transaccion.getVendedor().getId().equals(vendedor.getId()))
            throw new NegocioException("La solicitud ya está asignada a otro vendedor");

        if (dto.getFechaVisita() != null
                && dto.getFechaVisita().isAfter(LocalDateTime.now().plusDays(DIAS_MAXIMOS_HASTA_LA_VISITA)))
            throw new NegocioException("La visita no puede agendarse con más de "
                    + DIAS_MAXIMOS_HASTA_LA_VISITA + " días de anticipación");

        // Solo la primera asignación cuenta para el límite semanal; reprogramar no suma
        if (transaccion.getVendedor() == null) {
            LocalDateTime inicioDeSemana = LocalDate.now()
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                    .atStartOfDay();
            long asignacionesDeLaSemana = transaccionRepository
                    .contarAsignacionesDesde(vendedor.getId(), inicioDeSemana);
            if (asignacionesDeLaSemana >= MAXIMO_VISITAS_POR_SEMANA)
                throw new NegocioException("Ya tenés " + MAXIMO_VISITAS_POR_SEMANA
                        + " solicitudes asignadas esta semana. Probá de nuevo la semana próxima");
            transaccion.setFecha_asignacion(LocalDateTime.now());
        }

        transaccion.setVendedor(vendedor);
        if (dto.getFechaVisita() != null)
            transaccion.setFecha_visita(dto.getFechaVisita());

        auditoriaTransaccionService.registrarCambio(snapshotAnterior, transaccion);

        return aRespuesta(transaccionRepository.save(transaccion));
    }

    @Transactional
    public TransaccionResponseDTO actualizar(Long id, TransaccionRequestDTO dto) {

        Transaccion transaccion = buscarEntityPorId(id);
        Transaccion snapshotAnterior = crearSnapshot(transaccion);

        Usuario cliente = usuarioService.buscarEntityPorId(dto.getCliente_id());
        Usuario vendedor = usuarioService.buscarEntityPorId(dto.getVendedor_id());
        Vehiculo vehiculo = vehiculoService.obtenerVehiculoEntityPorId(dto.getVehiculo_id());

        transaccionMapper.updateEntityFromDto(
                dto,
                transaccion
        );
        transaccion.setCliente(cliente);
        transaccion.setVendedor(vendedor);
        transaccion.setVehiculo(vehiculo);

        EstadoTransaccion nuevoEstado = dto.getEstadoTransaccion();
        transaccion.setPrecio_final(vehiculo.getPrecioVenta());

        if ((nuevoEstado == EstadoTransaccion.SENIADO || nuevoEstado == EstadoTransaccion.VENDIDO)
                && nuevoEstado != snapshotAnterior.getEstadoTransaccion())
            throw new NegocioException("La seña y la venta se registran con sus pagos (métodos y montos)");

        if (nuevoEstado != snapshotAnterior.getEstadoTransaccion()) {
            if (snapshotAnterior.getEstadoTransaccion() == EstadoTransaccion.CANCELADO)
                throw new TransaccionNoModificableException("No se puede cambiar el estado de una Transaccion en CANCELADO");
            if (nuevoEstado == EstadoTransaccion.SOLICITAR)
                throw new TransaccionNoModificableException("No se puede volver una Transaccion al estado SOLICITAR");

            if (snapshotAnterior.getEstadoTransaccion() == EstadoTransaccion.SOLICITAR
                    && nuevoEstado != EstadoTransaccion.CANCELADO
                    && vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE)
                throw new VehiculoNoDisponibleException("El vehiculo requerido ya no está disponible");

            asignacionCambioDeEstado(transaccion, nuevoEstado);
        }

        auditoriaTransaccionService.registrarCambio(snapshotAnterior, transaccion);

        return aRespuesta(transaccionRepository.save(transaccion));
    }


    // Edición de una visita (fecha, observaciones) o de una reserva/seña (observaciones, método de pago)
    @Transactional
    public TransaccionResponseDTO editar(Long id, EditarTransaccionRequestDTO dto, String emailActor) {

        Transaccion transaccion = buscarEntityPorId(id);
        Transaccion snapshotAnterior = crearSnapshot(transaccion);
        Usuario actor = usuarioService.buscarEntityPorEmail(emailActor);
        EstadoTransaccion estadoActual = transaccion.getEstadoTransaccion();

        if (estadoActual == EstadoTransaccion.CANCELADO || estadoActual == EstadoTransaccion.VENDIDO)
            throw new TransaccionNoModificableException("No se puede editar una transacción " + estadoActual);

        boolean esAdministrador = actor.getRolUsuario() == Rol.ADMINISTRADOR;
        boolean esVendedorDeLaTransaccion = transaccion.getVendedor() != null
                && transaccion.getVendedor().getId().equals(actor.getId());
        if (!esAdministrador && !esVendedorDeLaTransaccion)
            throw new NegocioException("Solo el vendedor asignado o un administrador pueden editar esta transacción");

        if (estadoActual == EstadoTransaccion.SOLICITAR) {
            if (dto.getFechaVisita() != null) {
                if (transaccion.getVendedor() == null)
                    throw new NegocioException("Para agendar la visita primero tiene que estar asignada a un vendedor");
                if (dto.getFechaVisita().isAfter(LocalDateTime.now().plusDays(DIAS_MAXIMOS_HASTA_LA_VISITA)))
                    throw new NegocioException("La visita no puede agendarse con más de "
                            + DIAS_MAXIMOS_HASTA_LA_VISITA + " días de anticipación");
                transaccion.setFecha_visita(dto.getFechaVisita());
            }
        } else if (dto.getMetodoPago() != null) {
            transaccion.setMetodoPago(dto.getMetodoPago());
        }

        if (dto.getObservaciones() != null)
            transaccion.setObservaciones(dto.getObservaciones().trim());

        if (snapshotAnterior.getMetodoPago() != transaccion.getMetodoPago())
            auditoriaTransaccionService.registrarCambio(snapshotAnterior, transaccion);

        return aRespuesta(transaccionRepository.save(transaccion));
    }

    @Transactional(readOnly = true)
    public List<TransaccionResponseDTO> listarPorCliente(String emailCliente) {
        return transaccionRepository.findByClienteEmailOrderByIdDesc(emailCliente).stream()
                .map(this::aRespuesta)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransaccionResponseDTO buscarPorId(Long id) {
        Transaccion transaccion = transaccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaccion no encontrado con el ID: " + id));
        return aRespuesta(transaccion);
    }

    @Transactional(readOnly = true)
    public Transaccion buscarEntityPorId(Long id) {
        return transaccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaccion no encontrado con el ID: " + id));
    }

    // Cambios de estado simples (cancelar). Señar y vender pasan por sus propios métodos con pagos
    @Transactional
    public TransaccionResponseDTO cambiarEstado(Long id, EstadoTransaccion estadoTransaccion) {

        if (estadoTransaccion == EstadoTransaccion.SENIADO || estadoTransaccion == EstadoTransaccion.VENDIDO)
            throw new NegocioException("La seña y la venta se registran con sus pagos (métodos y montos)");

        Transaccion transaccion = buscarEntityPorId(id);
        Transaccion snapshotAnterior = crearSnapshot(transaccion);

        if (transaccion.getEstadoTransaccion() == EstadoTransaccion.CANCELADO) {
            throw new TransaccionNoModificableException(transaccion.getId().toString());
        }

        asignacionCambioDeEstado(transaccion, estadoTransaccion);

        auditoriaTransaccionService.registrarCambio(snapshotAnterior, transaccion);

        return aRespuesta(transaccionRepository.save(transaccion));
    }

    // Registra una seña: uno o varios pagos cuya suma no puede superar lo que falta abonar del vehículo
    @Transactional
    public TransaccionResponseDTO registrarSenia(Long id, RegistrarPagosRequestDTO dto) {

        Transaccion transaccion = buscarEntityPorId(id);
        validarQuePuedeRecibirPagos(transaccion, "señar");

        BigDecimal precioVehiculo = transaccion.getVehiculo().getPrecioVenta();
        BigDecimal montoNuevo = sumarMontos(dto);
        BigDecimal faltaAbonar = precioVehiculo.subtract(pagoTransaccionRepository.sumarMontosPorTransaccion(id));

        if (montoNuevo.compareTo(faltaAbonar) > 0)
            throw new NegocioException("Los pagos suman $" + montoNuevo.toPlainString()
                    + " y solo faltan abonar $" + faltaAbonar.toPlainString() + " del vehículo");

        Transaccion snapshotAnterior = crearSnapshot(transaccion);
        guardarPagos(transaccion, dto, TipoPago.SENIA);

        transaccion.setPrecio_final(precioVehiculo);
        transaccion.setMetodoPago(dto.getPagos().get(0).getMetodoPago());
        transaccion.setEstadoTransaccion(EstadoTransaccion.SENIADO);

        auditoriaTransaccionService.registrarCambio(snapshotAnterior, transaccion);

        return aRespuesta(transaccionRepository.save(transaccion));
    }

    // Concreta la venta: los pagos nuevos más lo ya señado tienen que cubrir exactamente el precio del vehículo
    @Transactional
    public TransaccionResponseDTO registrarVenta(Long id, RegistrarPagosRequestDTO dto) {

        Transaccion transaccion = buscarEntityPorId(id);
        validarQuePuedeRecibirPagos(transaccion, "vender");

        BigDecimal precioVehiculo = transaccion.getVehiculo().getPrecioVenta();
        BigDecimal montoNuevo = sumarMontos(dto);
        BigDecimal faltaAbonar = precioVehiculo.subtract(pagoTransaccionRepository.sumarMontosPorTransaccion(id));

        if (montoNuevo.compareTo(faltaAbonar) != 0)
            throw new NegocioException("Para concretar la venta hay que abonar exactamente $"
                    + faltaAbonar.toPlainString() + " y los pagos suman $" + montoNuevo.toPlainString());

        Transaccion snapshotAnterior = crearSnapshot(transaccion);
        guardarPagos(transaccion, dto, TipoPago.VENTA);

        transaccion.setPrecio_final(precioVehiculo);
        transaccion.setMetodoPago(dto.getPagos().get(0).getMetodoPago());
        transaccion.setFecha_venta(LocalDate.now());
        asignacionCambioDeEstado(transaccion, EstadoTransaccion.VENDIDO);

        auditoriaTransaccionService.registrarCambio(snapshotAnterior, transaccion);

        return aRespuesta(transaccionRepository.save(transaccion));
    }

    private void validarQuePuedeRecibirPagos(Transaccion transaccion, String accion) {
        EstadoTransaccion estado = transaccion.getEstadoTransaccion();
        if (estado != EstadoTransaccion.RESERVA && estado != EstadoTransaccion.SENIADO)
            throw new TransaccionNoModificableException("Solo se puede " + accion
                    + " una transacción en estado RESERVA o SENIADO");
    }

    private BigDecimal sumarMontos(RegistrarPagosRequestDTO dto) {
        return dto.getPagos().stream()
                .map(PagoRequestDTO::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void guardarPagos(Transaccion transaccion, RegistrarPagosRequestDTO dto, TipoPago tipo) {
        List<PagoTransaccion> pagosNuevos = dto.getPagos().stream()
                .map(pago -> PagoTransaccion.builder()
                        .transaccion(transaccion)
                        .metodoPago(pago.getMetodoPago())
                        .monto(pago.getMonto())
                        .tipo(tipo)
                        .build())
                .toList();
        pagoTransaccionRepository.saveAll(pagosNuevos);
    }

    // Cancela las visitas asignadas y las reservas que no avanzaron en DIAS_PARA_CONCRETAR días.
    // Las transacciones señadas no vencen porque ya hay dinero de por medio.
    @Transactional
    public void cancelarVencidas() {
        LocalDateTime limite = LocalDateTime.now().minusDays(DIAS_PARA_CONCRETAR);

        List<Transaccion> vencidas = new java.util.ArrayList<>();
        vencidas.addAll(transaccionRepository.buscarAsignadasAnterioresA(EstadoTransaccion.SOLICITAR, limite));
        vencidas.addAll(transaccionRepository.buscarReservadasAnterioresA(EstadoTransaccion.RESERVA, limite));

        for (Transaccion vencida : vencidas) {
            Transaccion snapshotAnterior = crearSnapshot(vencida);
            asignacionCambioDeEstado(vencida, EstadoTransaccion.CANCELADO);
            auditoriaTransaccionService.registrarCambio(snapshotAnterior, vencida);
        }
        transaccionRepository.saveAll(vencidas);
    }

    private void asignacionCambioDeEstado(Transaccion transaccion, EstadoTransaccion nuevoEstado) {

        Long vehiculo_id = transaccion.getVehiculo().getId();

        if (transaccion.getEstadoTransaccion() == EstadoTransaccion.VENDIDO) {
            throw new TransaccionNoModificableException("No se puede cambiar el estado de una Transaccion en VENDIDO");
        }

        if (nuevoEstado == EstadoTransaccion.VENDIDO) {
            vehiculoService.cambiarEstadoEntity(vehiculo_id, EstadoVehiculo.VENDIDO);

            // Calcula automaticamente la comision del vendedor cuando se concreta la venta
            transaccion.setComision_calculada(calcularComision(transaccion.getPrecio_final()));

        } else if (nuevoEstado == EstadoTransaccion.CANCELADO) {
            if (transaccion.getEstadoTransaccion() != EstadoTransaccion.SOLICITAR)
                vehiculoService.cambiarEstadoEntity(vehiculo_id, EstadoVehiculo.DISPONIBLE);

        } else {
            vehiculoService.cambiarEstadoEntity(vehiculo_id, EstadoVehiculo.RESERVADO);
            if (nuevoEstado == EstadoTransaccion.RESERVA && transaccion.getEstadoTransaccion() != EstadoTransaccion.RESERVA)
                transaccion.setFecha_reserva(LocalDateTime.now());
            cancelarOtrasSolicitudes(transaccion);
        }

        transaccion.setEstadoTransaccion(nuevoEstado);
    }

    private void cancelarOtrasSolicitudes(Transaccion reservada) {
        List<Transaccion> solicitudes = transaccionRepository.findByVehiculoIdAndEstadoTransaccionAndIdNot(
                reservada.getVehiculo().getId(), EstadoTransaccion.SOLICITAR, reservada.getId());

        for (Transaccion solicitud : solicitudes) {
            Transaccion snapshotAnterior = crearSnapshot(solicitud);
            solicitud.setEstadoTransaccion(EstadoTransaccion.CANCELADO);
            auditoriaTransaccionService.registrarCambio(snapshotAnterior, solicitud);
        }

        transaccionRepository.saveAll(solicitudes);
    }

    @Transactional(readOnly = true)
    public TransaccionComisionResponseDTO comisionPorVendedor(TransaccionFilterDTO filtros) {

        Usuario vendedor = usuarioService.buscarEntityPorId(filtros.getVendedor_id());
        if (vendedor.getRolUsuario() != Rol.VENDEDOR)
            throw new ResourceNotFoundException("El id solicitado no pertenece a un vendedor");

        // Las comisiones se cuentan por el día en que se concretó la venta
        List<Transaccion> ventasDelPeriodo = transaccionRepository.buscarVentasDeVendedor(
                vendedor.getId(), EstadoTransaccion.VENDIDO, filtros.getFechaDesde(), filtros.getFechaHasta());

        List<VentaComisionResponseDTO> ventas = ventasDelPeriodo.stream()
                .map(venta -> VentaComisionResponseDTO.builder()
                        .transaccion_id(venta.getId())
                        .marca(venta.getVehiculo().getModelo().getMarca().getNombre())
                        .modelo(venta.getVehiculo().getModelo().getNombre())
                        .anio(venta.getVehiculo().getAnio())
                        .patente(venta.getVehiculo().getPatente())
                        .fecha_venta(venta.getFecha_venta())
                        .precio_final(venta.getPrecio_final())
                        .comision(venta.getComision_calculada())
                        .build())
                .toList();

        BigDecimal totalComisiones = ventasDelPeriodo.stream()
                .map(Transaccion::getComision_calculada)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return TransaccionComisionResponseDTO.builder()
                .id(vendedor.getId())
                .vendedor_id(vendedor.getId())
                .nombre_completo(vendedor.getNombre() + " " + vendedor.getApellido())
                .email(vendedor.getEmail())
                .comision_total(totalComisiones)
                .ventas(ventas)
                .build();
    }


    @Transactional(readOnly = true)
    public TransaccionBalanceResponseDTO obtenerBalance(LocalDate desde, LocalDate hasta) {


        BalanceProyeccion resultado = transaccionRepository.calcularBalanceEntreFechas(desde, hasta)
                .orElse(null);


        if (resultado == null){
            return TransaccionBalanceResponseDTO.builder()
                    .precios_final_total(BigDecimal.ZERO)
                    .comisiones_total(BigDecimal.ZERO)
                    .costos_vehiculos_vendidos(BigDecimal.ZERO)
                    .ingreso_final(BigDecimal.ZERO)
                    .fecha_desde(desde)
                    .fecha_hasta(hasta)
                    .build();
        }

        BigDecimal precioTotal = resultado.getPrecioFinalTotal() != null ? resultado.getPrecioFinalTotal() : BigDecimal.ZERO;
        BigDecimal comisionesTotal = resultado.getComisionesTotal() != null ? resultado.getComisionesTotal() : BigDecimal.ZERO;
        BigDecimal costosVehiculos = resultado.getCostosVehiculos() != null ? resultado.getCostosVehiculos() : BigDecimal.ZERO;


        BigDecimal ingresoFinal = precioTotal.subtract(costosVehiculos).subtract(comisionesTotal);

        return TransaccionBalanceResponseDTO.builder()
                .precios_final_total(precioTotal)
                .comisiones_total(comisionesTotal)
                .costos_vehiculos_vendidos(costosVehiculos)
                .ingreso_final(ingresoFinal)
                .fecha_desde(desde)
                .fecha_hasta(hasta)
                .build();
    }

    private Transaccion crearSnapshot(Transaccion transaccion){
        return Transaccion.builder()
                .id(transaccion.getId())
                .estadoTransaccion(transaccion.getEstadoTransaccion())
                .precio_final(transaccion.getPrecio_final())
                .vendedor(transaccion.getVendedor())
                .cliente(transaccion.getCliente())
                .vehiculo(transaccion.getVehiculo())
                .metodoPago(transaccion.getMetodoPago())
                .build();
    }
}
