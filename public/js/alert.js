export const hideAlert = () => {
  const alertEl = document.querySelector('.alert');
  alertEl?.parentElement.removeChild(alertEl);
};

export const showAlert = (type, msg) => {
  hideAlert();

  const markup = `<div class="alert alert--${type}"> ${msg}</div>`;
  const body = document.querySelector('body');

  body.insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};
