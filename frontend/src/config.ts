// This setup allows the environment variable to be accessed consistently.
// Vite will replace `import.meta.env.VITE_API_BASE_URL` with the actual value at build time.
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    'VITE_API_BASE_URL is not set. Defaulting to http://localhost:8000. This is expected for local development.'
  );
}

export default API_URL;