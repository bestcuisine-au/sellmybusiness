import { registerGlobalErrorHandlers } from './lib/errorLogger';

export function register() {
  registerGlobalErrorHandlers();
  console.log('Error monitoring initialized');
}
