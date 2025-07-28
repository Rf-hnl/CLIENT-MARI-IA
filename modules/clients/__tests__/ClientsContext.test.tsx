/**
 * TESTS - CLIENTS MODULE
 * 
 * Tests para el contexto de clientes
 * Preparado para testing con Firebase mocking
 */

import { render, screen } from '@testing-library/react';
import { ClientsProvider, useClients } from '../context/ClientsContext';

// Componente de test para verificar el contexto
function TestComponent() {
  const { clients, isLoading, error } = useClients();
  
  return (
    <div>
      <div data-testid="clients-count">{clients.length}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
    </div>
  );
}

describe('ClientsContext', () => {
  it('provides initial values', () => {
    render(
      <ClientsProvider>
        <TestComponent />
      </ClientsProvider>
    );

    expect(screen.getByTestId('clients-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });

  it('throws error when used outside provider', () => {
    // Suprimir console.error para este test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestComponent />)).toThrow(
      'useClients must be used within a ClientsProvider'
    );

    consoleSpy.mockRestore();
  });
});

// TODO: Agregar más tests cuando se implemente Firebase
// - Test para addClient
// - Test para updateClient  
// - Test para deleteClient
// - Test para funciones de billing
// - Mock de Firebase para testing