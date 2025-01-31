import axios from 'axios';
import { showAlert } from './alert';

export const logout = async () => {
  try {
    const result = await axios({
      method: 'get',
      url: '/api/v1/users/logout',
    });
    if (result.data.status === 'success') {
      showAlert('success', 'Successfully logged out!');
      //   location.reload(true);
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  } catch (err) {
    showAlert('error', 'Error logging out. Try again!');
  }
};
