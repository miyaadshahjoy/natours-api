import axios from 'axios';
const stripe = Stripe(
  'pk_test_51QmFhRL2T4jCYhmtVsziL7XpuoqeWyVFNYmZJcc1lLB9vFNefT73elHoMKZXavjV8uYiifGYbyN667QS5VhX2Ssz005T6wCx2p'
);
import showAlert from './alert';

// FIXED:
export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });

    // 2) Create checkout form + charge credit card
    window.location.href = session.data.session.url;
  } catch (err) {
    console.log(err);
    showAlert(err.message);
  }
};
