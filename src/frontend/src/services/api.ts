import { ApiProblemDetails } from '../types/api';

const API_BASE_URL = ''; // Proxied via Vite to Gateway (http://localhost:5000)

export class ApiError extends Error {
  public status: number;
  public problemDetails?: ApiProblemDetails;

  constructor(status: number, message: string, problemDetails?: ApiProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problemDetails = problemDetails;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('rentcar_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail: ApiProblemDetails | undefined;
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      errorDetail = await response.json();
      if (errorDetail?.detail) {
        errorMessage = errorDetail.detail;
      } else if (errorDetail?.title) {
        errorMessage = errorDetail.title;
      }
    } catch {
      // not JSON
    }

    throw new ApiError(response.status, errorMessage, errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
