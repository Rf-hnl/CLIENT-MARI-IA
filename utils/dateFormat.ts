export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'No disponible';
  
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper function to safely convert Firestore timestamps
export function safeFormatDate(timestamp: any): string {
  try {
    if (!timestamp) return 'Fecha no disponible';
    
    // Si es un Timestamp de Firestore
    if (timestamp && typeof timestamp.toDate === 'function') {
      return formatDate(timestamp.toDate().toISOString());
    }
    
    // Si es una fecha ya serializada
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return formatDate(date.toISOString());
    }
    
    // Si es un string de fecha
    if (typeof timestamp === 'string') {
      return formatDate(timestamp);
    }
    
    // Si es un objeto Date
    if (timestamp instanceof Date) {
      return formatDate(timestamp.toISOString());
    }
    
    return 'Fecha inválida';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error en fecha';
  }
}

// Helper function to safely convert Firestore timestamps to ISO string
export function safeToISOString(timestamp: any): string | null {
  try {
    if (!timestamp) return null;
    
    // Si es un Timestamp de Firestore
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    
    // Si es una fecha ya serializada
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toISOString();
    }
    
    // Si es un string de fecha
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    }
    
    // Si es un objeto Date
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    return null;
  } catch (error) {
    console.error('Error converting to ISO string:', error);
    return null;
  }
}