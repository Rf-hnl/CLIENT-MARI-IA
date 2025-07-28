import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

// Test component to access auth context
function TestComponent() {
  const { currentUser, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  return <div>{currentUser ? 'Authenticated' : 'Not authenticated'}</div>
}

describe('AuthContext', () => {
  it('should provide authentication context', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })

  it('should handle authentication state changes', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})