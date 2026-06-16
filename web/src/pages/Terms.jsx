import { useEffect } from 'react';
import { useScrollReveal } from '../hooks/useGsap';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import PageHero from '../components/landing/PageHero';

const sections = [
  {
    title: '1. Definiciones',
    content: 'A efectos de estos Términos: \n\nUsuario: Toda persona que acceda a la página web, extensión o participe de la comunidad del canal y tenga acceso al sistema de Orbes.\n\nCreador: Hace referencia a Shuls, responsable de la administración del sistema de Orbes, sus reglas, recompensas y funcionamiento.\n\nSistema de Orbes: Herramienta digital de fidelización diseñada con fines de entretenimiento y participación comunitaria.'
  },
  {
    title: '2. Obtención de Orbes',
    content: 'Los Usuarios podrán obtener Orbes mediante distintos métodos definidos por el Creador, incluyendo, entre otros:\n\n• Visualización de transmisiones en directo.\n• Participación activa en el chat.\n• Cumplimiento de objetivos, desafíos o eventos especiales.\n• Participación en actividades dentro de la página web o extensión.\n• Bonificaciones especiales otorgadas manualmente por el Creador.\n\nLa cantidad de Orbes otorgados por cada actividad podrá modificarse en cualquier momento sin previo aviso.\n\nEl Creador se reserva el derecho de limitar, ajustar, reiniciar o eliminar Orbes obtenidos mediante errores técnicos, fallos del sistema, abuso o cualquier método considerado indebido.'
  },
  {
    title: '3. Uso y Canje de Orbes',
    content: 'Los Orbes podrán ser utilizados exclusivamente dentro del ecosistema del canal mediante las recompensas disponibles en la página web, extensión o cualquier servicio oficial asociado.\n\nLas recompensas disponibles, su costo en Orbes y su disponibilidad podrán variar en cualquier momento.\n\nEl canje de una recompensa no garantiza su disponibilidad inmediata y podrá estar sujeto a:\n\n• Stock disponible.\n• Limitaciones por usuario.\n• Restricciones temporales.\n• Validación manual por parte del Creador o sus moderadores.\n\nUna vez realizado un canje, los Orbes utilizados no serán reembolsables, salvo que el Creador decida lo contrario debido a errores del sistema o situaciones excepcionales.'
  },
  {
    title: '4. Recompensas y Premios',
    content: 'Las recompensas obtenidas mediante Orbes son beneficios comunitarios y promocionales.\n\nLos Orbes no pueden utilizarse para comprar, vender, intercambiar o apostar dinero real.\n\nEn caso de recompensas físicas, el Usuario podrá ser responsable de proporcionar información necesaria para la entrega. El Creador podrá establecer restricciones geográficas, costos de envío o condiciones adicionales previamente informadas.'
  },
  {
    title: '5. Conductas Prohibidas',
    content: 'Está estrictamente prohibido:\n\n• Utilizar bots, scripts, programas automatizados o cualquier método artificial para obtener Orbes.\n• Aprovechar errores o fallos del sistema para obtener beneficios indebidos.\n• Comprar, vender, intercambiar o transferir Orbes entre usuarios.\n• Manipular el funcionamiento de la página web, extensión o cualquier herramienta relacionada con el sistema.\n\nCualquier infracción podrá resultar en la eliminación de Orbes, suspensión del acceso al sistema o exclusión permanente de la comunidad en todas sus conexiones vinculadas.'
  },
  {
    title: '6. Modificaciones del Sistema',
    content: 'El Creador se reserva el derecho de modificar, suspender o finalizar total o parcialmente el Sistema de Orbes en cualquier momento.\n\nEsto incluye, entre otros cambios:\n\n• Modificar la forma de obtener Orbes.\n• Cambiar el valor o costo de las recompensas.\n• Agregar o eliminar recompensas.\n• Ajustar la economía general del sistema.\n• Reiniciar total o parcialmente los saldos de Orbes.\n\nEl uso continuado del sistema después de cualquier modificación implicará la aceptación de los nuevos Términos.'
  },
  {
    title: '7. Disponibilidad del Servicio',
    content: 'El funcionamiento de la página web, extensión y sistema de Orbes puede verse afectado por mantenimientos, errores técnicos, problemas de servidores o servicios externos.\n\nEl Creador no garantiza una disponibilidad continua o libre de errores del sistema.\n\nLos Orbes perdidos debido a fallos técnicos podrán ser restaurados únicamente cuando sea posible y a criterio del Creador.'
  },
  {
    title: '8. Cancelación de Cuentas y Pérdida de Orbes',
    content: 'El Creador podrá suspender o cancelar el acceso de cualquier Usuario al sistema de Orbes en caso de incumplimiento de estos Términos, comportamiento perjudicial para la comunidad o cualquier actividad considerada abusiva.\n\nLa suspensión o eliminación de una cuenta podrá implicar la pérdida total de los Orbes acumulados.'
  },
  {
    title: '9. Cambios en los Términos y Condiciones',
    content: 'Estos Términos podrán ser modificados en cualquier momento para mejorar, actualizar o adaptar el sistema.\n\nLa versión vigente será siempre la publicada en la página oficial del sistema de Orbes.'
  },
  {
    title: '10. Aceptación de los Términos',
    content: 'Al utilizar la página web, extensión o cualquier herramienta relacionada con el Sistema de Orbes, el Usuario declara haber leído, comprendido y aceptado estos Términos y Condiciones.'
  }
];

export default function Terms() {
  const containerRef = useScrollReveal('.gsap-reveal');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="bg-grid" />
      <div className="bg-noise" />
      <div className="relative z-10">
        <LandingNavbar />

        <PageHero
          eyebrow="LEGAL"
          title="Términos y condiciones"
          description="Los presentes Términos y Condiciones regulan el funcionamiento del Sistema de Orbes de Canal (en adelante, los “Orbes”), un sistema de recompensas digital disponible exclusivamente para los miembros de la comunidad del canal de Shuls mediante su página web, extensión oficial y servicios asociados."
        />

        <section ref={containerRef} className="py-24 px-6">
          <div className="max-w-3xl mx-auto bg-card rounded-[32px] p-8 sm:p-12 border border-brand/15 shadow-2xl shadow-black/50">
            
            <div className="gsap-reveal mb-12">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Los Orbes son una recompensa virtual obtenida mediante la participación dentro de la comunidad, incluyendo, entre otras acciones, la visualización de transmisiones, interacción en el chat, participación en eventos, actividades especiales o cualquier otro método habilitado por el creador.
                <br /><br />
                Los Orbes se encuentran asociados a una cuenta individual y son personales e intransferibles. No poseen valor monetario, no constituyen una moneda real, criptomoneda, activo financiero ni representan propiedad de ningún tipo.
              </p>
            </div>

            <div className="space-y-12">
              {sections.map((section, i) => (
                <div
                  key={i}
                  className="gsap-reveal"
                  data-gsap-delay={String(i * 0.06)}
                >
                  <h3 className="font-heading text-xl font-black text-foreground mb-4 border-l-4 border-brand pl-4">
                    {section.title}
                  </h3>
                  <div className="text-sm text-muted-foreground leading-relaxed pl-5 whitespace-pre-wrap">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Last updated */}
            <div className="gsap-reveal mt-16 text-center">
              <div className="border-t border-brand/10 mb-6" />
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                Última actualización: 16/06/2026 a las 19:20
              </p>
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </div>
  );
}
