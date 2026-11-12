import { api } from '../../lib/api';

export const adminApi = {
  async getEvents(params = {}) {
    const { data } = await api.get('/admin/events', { params });
    return data;
  },
  async getOrganizerVerifications(params = {}) {
    const { data } = await api.get('/admin/organizer-verifications', { params });
    return data;
  },
  async reviewOrganizer(requestId, payload) {
    const { data } = await api.patch(`/admin/organizer-verifications/${requestId}`, payload);
    return data.data;
  },
};
