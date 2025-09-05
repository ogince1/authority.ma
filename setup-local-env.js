import fs from 'fs';
import path from 'path';

const envContent = `# Supabase Local Configuration
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database URL
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# JWT Secret
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long`;

try {
  fs.writeFileSync('.env', envContent);
  console.log('✅ Fichier .env créé avec succès');
  console.log('Variables d\'environnement configurées pour Supabase local:');
  console.log('- API URL: http://127.0.0.1:54321');
  console.log('- Studio URL: http://127.0.0.1:54323');
  console.log('- Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres');
} catch (error) {
  console.error('Erreur lors de la création du fichier .env:', error);
}
