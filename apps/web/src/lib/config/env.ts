export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  },
} as const
