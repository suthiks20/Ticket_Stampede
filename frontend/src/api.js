import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

export async function getStatus() {
  const { data } = await api.get('/status');
  return data;
}

export async function resetSale(ticketCount) {
  const { data } = await api.post('/reset', { ticket_count: ticketCount });
  return data;
}

export async function buyTicket({ userId, requestId }) {
  try {
    const { data } = await api.post('/buy', {
      user_id: userId,
      request_id: requestId,
    });
    return { soldOut: false, ...data };
  } catch (error) {
    if (error.response?.status === 409 && error.response.data?.error === 'SOLD_OUT') {
      return { soldOut: true };
    }
    throw error;
  }
}
