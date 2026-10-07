/** MOB-AIR-04: Gönder is offered only for a non-blank intent (no "general recommendation"); a request burns a credit. */
export function canSendIntent(value: string, isLoading: boolean): boolean {
  return !isLoading && value.trim().length > 0;
}
