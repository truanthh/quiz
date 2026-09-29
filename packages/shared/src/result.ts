export type OperationResult<T> = { success: true; data: T } | { success: false; error: string };

export const ok = <T>(data: T): OperationResult<T> => ({ success: true, data });
export const err = <T = never>(error: string): OperationResult<T> => ({ success: false, error });
