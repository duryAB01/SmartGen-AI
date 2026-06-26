export default function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const backendMsg = error?.response?.data?.message;

  if (backendMsg) return backendMsg;

  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. AI generation can take up to a minute — please try again.';
  }

  if (!error?.response) {
    if (error?.message?.toLowerCase().includes('network error')) {
      return 'Cannot reach the backend server. Make sure backend is running on port 5000 and FRONTEND_URL matches your Vite port.';
    }
    return 'Cannot connect to the backend server. Start the backend with `npm run dev` inside the backend folder.';
  }

  return fallback;
}
