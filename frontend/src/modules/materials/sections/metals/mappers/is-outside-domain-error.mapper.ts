/** True when a metals thermal-properties call failed only because T is outside the spline domain. */
export function isOutsideDomainError(error: unknown): boolean {
  const messages: string[] = [];
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string | string[] }).message;
    if (Array.isArray(message)) messages.push(...message.map(String));
    else if (message != null) messages.push(String(message));
  } else if (error instanceof Error) {
    messages.push(error.message);
  } else if (error != null) {
    messages.push(String(error));
  }
  return messages.some((text) => /outside domain/i.test(text));
}
