import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChatMessage {
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface QuickReply {
  label: string;
  response: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
})
export class ChatbotComponent {
  isOpen = false;
  isMinimized = false;
  hasNewMessage = true;

  messages: ChatMessage[] = [
    {
      text: '¡Hola! 👋 Soy el asistente virtual de RealMyFit. ¿En qué puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ];

  quickReplies: QuickReply[] = [
    {
      label: '💰 Precios y membresías',
      response:
        'Tenemos 3 planes disponibles:\n\n🥉 **Plan Básico** - $49.900/mes: Acceso a zona de máquinas y cardio.\n\n🥈 **Plan Premium** - $79.900/mes: Acceso completo + clases grupales + entrenador.\n\n🥇 **Plan VIP** - $119.900/mes: Todo incluido + nutricionista + spa.\n\n¿Te gustaría más información sobre algún plan?',
    },
    {
      label: '⏰ Horarios',
      response:
        '⏰ Nuestros horarios son:\n\n📅 Lunes a Viernes: 5:00 AM - 11:00 PM\n📅 Sábados: 6:00 AM - 8:00 PM\n📅 Domingos y Festivos: 7:00 AM - 4:00 PM\n\n¡Recuerda que con el Plan VIP tienes acceso 24/7! 🔑',
    },
    {
      label: '📍 Ubicación',
      response:
        '📍 Nos encontramos en:\n\n🏢 Calle 85 #15-30, Bogotá\n(Centro Comercial Fitness Plaza, Piso 2)\n\n🚗 Contamos con parqueadero gratuito para miembros.\n🚌 Estamos a 2 cuadras de la estación de TransMilenio "Héroes".\n\n¿Necesitas indicaciones para llegar?',
    },
    {
      label: '🏋️ Entrenadores',
      response:
        '💪 Contamos con más de 50 entrenadores certificados:\n\n🎯 Entrenamiento funcional\n🏃 Cardio y resistencia\n🧘 Yoga y flexibilidad\n🥊 Artes marciales\n🏊 Natación\n\nTodos nuestros entrenadores tienen certificaciones internacionales y están disponibles para sesiones personalizadas.',
    },
    {
      label: '📋 Requisitos para inscribirme',
      response:
        '📋 Para inscribirte necesitas:\n\n✅ Documento de identidad\n✅ Certificado médico (máximo 3 meses de vigencia)\n✅ 1 foto tipo documento\n✅ Medio de pago (tarjeta o efectivo)\n\n⚡ ¡El proceso toma solo 15 minutos! Puedes también pre-registrarte en nuestra web en la sección de Membresías.',
    },
    {
      label: '🎉 Promociones actuales',
      response:
        '🎉 ¡Tenemos promociones increíbles!\n\n🔥 **Primer mes GRATIS** al inscribirte en plan anual\n👥 **2x1** trae a un amigo y ambos obtienen 30% de descuento\n🎁 **Estudiantes**: 25% de descuento con carné vigente\n📅 **Plan familiar**: Inscribe 3 o más y obtén 40% off\n\n¡No dejes pasar estas ofertas! Son por tiempo limitado. ⏳',
    },
    {
      label: '🏊 Servicios adicionales',
      response:
        '🏊 Además del gimnasio, ofrecemos:\n\n💆 Spa y sauna\n🧖 Zona húmeda (jacuzzi, turco)\n🍎 Nutricionista profesional\n💪 Evaluación física personalizada\n🧘 Sala de yoga y meditación\n🤸 Área de CrossFit\n🏀 Cancha multideportiva\n\n¡Todo para que tu experiencia sea completa!',
    },
    {
      label: '❓ Otra consulta',
      response:
        '📞 Para otras consultas puedes contactarnos:\n\n📱 WhatsApp: +57 310 123 4567\n📧 Email: info@realmyfit.com\n📞 Teléfono: (601) 555-0123\n\n🕐 Horario de atención al cliente:\nLun-Vie: 7:00 AM - 9:00 PM\nSáb-Dom: 8:00 AM - 5:00 PM\n\n¡Estaremos felices de ayudarte! 😊',
    },
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.hasNewMessage = false;
  }

  closeChat() {
    this.isOpen = false;
  }

  selectQuickReply(reply: QuickReply) {
    // Add user message
    this.messages.push({
      text: reply.label,
      sender: 'user',
      timestamp: new Date(),
    });

    // Simulate typing delay
    setTimeout(() => {
      this.messages.push({
        text: reply.response,
        sender: 'bot',
        timestamp: new Date(),
      });

      // Scroll to bottom after adding message
      setTimeout(() => this.scrollToBottom(), 50);
    }, 600);

    setTimeout(() => this.scrollToBottom(), 50);
  }

  resetChat() {
    this.messages = [
      {
        text: '¡Hola! 👋 Soy el asistente virtual de RealMyFit. ¿En qué puedo ayudarte hoy?',
        sender: 'bot',
        timestamp: new Date(),
      },
    ];
  }

  formatMessage(text: string): string {
    // Convert **bold** to <strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  private scrollToBottom() {
    const chatBody = document.querySelector('.chatbot-body');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  getTimeString(date: Date): string {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
