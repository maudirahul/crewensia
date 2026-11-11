import { api } from '../../lib/api';

export const applicationsApi = {
  async listMine() {
    const { data } = await api.get('/me/applications');
    return data.data;
  },
  async withdraw(applicationId) {
    const { data } = await api.post(`/applications/${applicationId}/withdraw`);
    return data.data;
  },
  async notifications() {
    const { data } = await api.get('/me/notifications');
    return data.data;
  },
  async unreadNotificationCount() {
    const { data } = await api.get('/me/notifications/unread-count');
    return data.data.count;
  },
  async markNotificationRead(notificationId) {
    const { data } = await api.patch(`/me/notifications/${notificationId}/read`);
    return data.data;
  },
};
