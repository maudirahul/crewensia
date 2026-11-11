import { api } from '../../lib/api';

export const eventsApi = {
  async list(params = {}) {
    const { data } = await api.get('/events', { params });
    return data;
  },
  async get(eventId) {
    const { data } = await api.get(`/events/${eventId}`);
    return data.data;
  },
  async apply(shiftId, message) {
    const { data } = await api.post(`/shifts/${shiftId}/applications`, { message });
    return data.data;
  },
};
