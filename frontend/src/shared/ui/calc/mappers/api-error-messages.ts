type NestErrorBody = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

function isNestErrorBody(error: unknown): error is NestErrorBody {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function apiErrorMessages(error: unknown): { title: string; messages: string[] } {
  if (isNestErrorBody(error)) {
    const messages = Array.isArray(error.message) ? error.message : [String(error.message ?? '')];
    const title = error.statusCode
      ? `${error.statusCode}${error.error ? ` ${error.error}` : ''}`
      : 'Request failed';
    return { title, messages: messages.filter(Boolean) };
  }
  if (error instanceof Error) return { title: 'Error', messages: [error.message] };
  return { title: 'Error', messages: [String(error)] };
}
