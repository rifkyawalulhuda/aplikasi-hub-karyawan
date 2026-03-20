import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const secret = process.env.JWT_SECRET || 'development_secret_key'; // default in app if not set
// Wait, I should check how the app signs tokens in employeeSession.js

async function run() {
  // Let's just generate a token manually
  const token = jwt.sign({ sub: 14 }, 'development_jwt_secret', { expiresIn: '1h' }); // guessing the secret format from standard templates
  // Actually I cannot guess the secret. Let's just read it from .env
}
run();
