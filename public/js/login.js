import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const result = await axios({
      method: 'post',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (result.data.status === 'success') {
      showAlert('success', 'Successfully logged in');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
