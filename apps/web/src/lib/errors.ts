export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export const ERROR_MESSAGES: Record<string, string> = {
  '401': 'Your session has expired. Please log in again.',
  '403': "You don't have permission to perform this action.",
  '404': 'The requested resource was not found.',
  '500': 'Something went wrong on our end. Please try again.',
  'NETWORK_ERROR': 'Connection failed. Please check your internet and retry.',
  'VALIDATION_ERROR': 'Please correct the highlighted fields.',
};

export async function parseApiError(response: Response): Promise<ApiError> {
  const status = response.status.toString();
  let message = ERROR_MESSAGES[status] || ERROR_MESSAGES['500'];
  let code = status;
  let fields: Record<string, string> | undefined;

  try {
    const data = await response.json();
    if (data.error) {
      if (typeof data.error === 'string') {
        message = data.error;
      } else if (data.error.message) {
        message = data.error.message;
        code = data.error.code || status;
        fields = data.error.fields;
      }
    }
  } catch (e) {
    // Fallback to status-based message if JSON parsing fails
  }

  return { code, message, fields };
}

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES['500'];
}
