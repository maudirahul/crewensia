import { api } from '../../lib/api';

export const authApi = {
  async signUp(payload) {
    const { data } = await api.post('/auth/signup', payload);
    return data.data;
  },
  async logIn(payload) {
    const { data } = await api.post('/auth/login', payload);
    return data.data;
  },
  async logOut() {
    await api.post('/auth/logout');
  },
  async getMe() {
    const { data } = await api.get('/me');
    return data.data.user;
  },
};
