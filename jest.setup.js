import '@testing-library/jest-dom'

// Polyfill fetch for Node.js environment
global.fetch = require('node-fetch')

// Mock Firebase modules before importing them
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  sendEmailVerification: jest.fn(),
}))

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}))

// Mock Firebase Auth
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  },
}))

// Mock Cloudinary
jest.mock('@/lib/cloudinary', () => ({
  uploadImageToCloudinary: jest.fn(),
  validateImageFile: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))