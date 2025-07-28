export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'No disponible';
  
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}