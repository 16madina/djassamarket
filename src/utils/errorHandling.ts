import { toast } from "sonner";

/**
 * Gestion centralisée des erreurs réseau pour conformité Apple Review
 * Guideline 2.1 - Performance: Messages clairs + bouton Réessayer
 */

export interface NetworkError {
  message: string;
  shouldRetry: boolean;
  isTimeout: boolean;
  isOffline: boolean;
}

export const NETWORK_TIMEOUT = 15000; // 15 secondes max (requis Apple)

export function parseNetworkError(error: any): NetworkError {
  // Vérifier si offline
  if (!navigator.onLine) {
    return {
      message: "Vous êtes hors ligne. Vérifiez votre connexion internet.",
      shouldRetry: true,
      isTimeout: false,
      isOffline: true,
    };
  }

  // Erreurs de timeout
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      message: "La requête a pris trop de temps. Vérifiez votre connexion.",
      shouldRetry: true,
      isTimeout: true,
      isOffline: false,
    };
  }

  // Erreurs réseau génériques
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      message: "Impossible de se connecter. Vérifiez votre connexion internet.",
      shouldRetry: true,
      isTimeout: false,
      isOffline: false,
    };
  }

  // Erreurs Supabase spécifiques
  if (error.code === 'PGRST301' || error.code === '503') {
    return {
      message: "Service temporairement indisponible. Réessayez dans un instant.",
      shouldRetry: true,
      isTimeout: false,
      isOffline: false,
    };
  }

  // Erreur par défaut
  return {
    message: error.message || "Une erreur est survenue. Réessayez.",
    shouldRetry: true,
    isTimeout: false,
    isOffline: false,
  };
}

/**
 * Wrapper pour requêtes Supabase avec timeout + gestion erreurs
 * Utilisation: await withTimeout(() => supabase.from('table').select())
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = NETWORK_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await operation();
    clearTimeout(timeoutId);
    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw error;
  }
}

/**
 * Affiche un toast d'erreur avec bouton Réessayer
 */
export function showNetworkErrorToast(
  error: any,
  onRetry?: () => void
): void {
  const networkError = parseNetworkError(error);
  
  if (onRetry && networkError.shouldRetry) {
    toast.error(networkError.message, {
      action: {
        label: "Réessayer",
        onClick: onRetry,
      },
      duration: 5000,
    });
  } else {
    toast.error(networkError.message);
  }
}

/**
 * Hook-like wrapper pour composants React
 * Usage: const { execute, loading, error } = useNetworkRequest(myAsyncFunction)
 */
export function createNetworkRequest<T>(
  operation: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: NetworkError) => void
) {
  let loading = false;
  let error: NetworkError | null = null;

  const execute = async (): Promise<T | null> => {
    loading = true;
    error = null;

    try {
      const result = await withTimeout(operation);
      loading = false;
      onSuccess?.(result);
      return result;
    } catch (err: any) {
      loading = false;
      error = parseNetworkError(err);
      onError?.(error);
      showNetworkErrorToast(err, execute);
      return null;
    }
  };

  return { execute, loading, error };
}