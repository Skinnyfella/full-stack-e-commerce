const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'DB_HOST',
  'DB_PORT',
  'JWT_SECRET'
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(key => console.error(`- ${key}`));
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(process.env.SUPABASE_URL);
  } catch (error) {
    console.error('Invalid SUPABASE_URL format');
    process.exit(1);
  }

  // Validate port numbers
  if (isNaN(parseInt(process.env.DB_PORT))) {
    console.error('DB_PORT must be a number');
    process.exit(1);
  }
};

module.exports = validateEnv;