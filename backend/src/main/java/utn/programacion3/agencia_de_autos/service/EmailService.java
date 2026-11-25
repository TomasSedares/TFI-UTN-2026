package utn.programacion3.agencia_de_autos.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
public class EmailService {

    private static final DateTimeFormatter FORMATO_FECHA_VISITA =
            DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", Locale.forLanguageTag("es-AR"));

    private final ObjectProvider<JavaMailSender> proveedorDeEnvioDeCorreo;
    private final String direccionRemitente;
    private final String nombreSucursal;

    public EmailService(
            ObjectProvider<JavaMailSender> proveedorDeEnvioDeCorreo,
            @Value("${spring.mail.username:}") String direccionRemitente,
            @Value("${agencia.sucursal:nuestra sucursal}") String nombreSucursal) {
        this.proveedorDeEnvioDeCorreo = proveedorDeEnvioDeCorreo;
        this.direccionRemitente = direccionRemitente;
        this.nombreSucursal = nombreSucursal;
    }

    // Se ejecuta en otro hilo (@Async): si el correo falla, la visita igual queda asignada
    @Async
    public void enviarConfirmacionDeVisita(
            String emailCliente,
            String nombreCliente,
            String nombreVendedor,
            String descripcionVehiculo,
            LocalDateTime fechaVisita,
            boolean esReprogramacion) {

        JavaMailSender envioDeCorreo = proveedorDeEnvioDeCorreo.getIfAvailable();

        // Sin credenciales configuradas el sistema funciona igual, solo que no manda correos
        if (envioDeCorreo == null || direccionRemitente.isBlank()) {
            log.warn("No se envió el correo a {}: falta configurar MAIL_USERNAME y MAIL_PASSWORD", emailCliente);
            return;
        }

        String asunto = esReprogramacion ? "Tu visita fue reprogramada" : "Tu visita fue programada";
        String cuerpo = "Hola " + nombreCliente + ".\n\n"
                + (esReprogramacion
                    ? "Tu visita fue reprogramada.\n"
                    : "Gracias por enviar tu solicitud. Tu visita fue programada.\n")
                + "\nVehículo: " + descripcionVehiculo
                + "\nFecha: " + fechaVisita.format(FORMATO_FECHA_VISITA)
                + "\nVendedor: " + nombreVendedor
                + "\nSucursal: " + nombreSucursal
                + "\n\nTe esperamos.";

        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(direccionRemitente);
            mensaje.setTo(emailCliente);
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpo);
            envioDeCorreo.send(mensaje);
            log.info("Correo de visita enviado a {}", emailCliente);
        } catch (Exception excepcion) {
            log.error("No se pudo enviar el correo de visita a {}: {}", emailCliente, excepcion.getMessage());
        }
    }
}
