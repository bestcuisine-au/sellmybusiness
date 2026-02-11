// Simple console-only error logger (works in all runtimes)
export function logError(error: Error | unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  
  const logEntry = `[${timestamp}] ${context ? `[${context}] ` : ''}${errorMessage}\n${errorStack}\n`;
  
  // Log to console - PM2 will capture this
  console.error(logEntry);
}

// Global error handlers
export function registerGlobalErrorHandlers() {
  if (typeof process !== 'undefined') {
    process.on('uncaughtException', (error) => {
      logError(error, 'UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason) => {
      logError(reason, 'UNHANDLED_REJECTION');
    });
  }
}
