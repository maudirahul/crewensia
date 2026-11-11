import { api } from '../../lib/api';

export const organizerApi = {
  async getProfile() {
    const { data } = await api.get('/organizers/me');
    return data.data;
  },
  async getEvents() {
    const { data } = await api.get('/organizers/me/events');
    return data.data;
  },
  async getVolunteerProfile(volunteerId) {
    const { data } = await api.get(`/organizers/me/volunteers/${volunteerId}`);
    return data.data;
  },
  async createEvent(payload) {
    const { data } = await api.post('/events', payload);
    return data.data;
  },
  async publishEvent(eventId) {
    const { data } = await api.post(`/events/${eventId}/publish`);
    return data.data;
  },
  async getApplications(eventId) {
    const pageSize = 50;
    const { data: firstPage } = await api.get(`/organizers/me/events/${eventId}/applications`, { params: { page: 1, pageSize } });
    const pageCount = Math.ceil((firstPage.pagination?.total ?? firstPage.data.length) / pageSize);
    if (pageCount <= 1) return firstPage.data;
    const remaining = await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => api.get(`/organizers/me/events/${eventId}/applications`, { params: { page: index + 2, pageSize } })));
    return [firstPage, ...remaining.map(({ data }) => data)].flatMap((page) => page.data);
  },
  async decideApplication(applicationId, payload) {
    const { data } = await api.patch(`/applications/${applicationId}`, payload);
    return data.data;
  },
};
