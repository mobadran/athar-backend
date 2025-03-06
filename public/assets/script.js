const serverURL = '/';
const baseURL = serverURL + 'api/dashboard';
const authURL = serverURL + 'api/auth';
const cdnURL = serverURL + 'uploads/';
const registerForm = document.getElementById('registerForm');
const imageForm = document.getElementById('imageForm');
const loginForm = document.getElementById('loginForm');
const logoutForm = document.getElementById('logoutForm');
const deleteAccountForm = document.getElementById('deleteAccountForm');
const updateImageForm = document.getElementById('updateImageForm');
const sendQrForm = document.getElementById('sendQrForm');
const userDataElement = document.getElementById('userData');
const message = document.getElementById('message');
let accessToken = '';
let userData = {};

document.addEventListener('DOMContentLoaded', async () => {
  await getAccessToken();
  await getUserData();
});

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const formData = new FormData(registerForm);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const email = formData.get('email');
    const password = formData.get('password');
    const image = formData.get('image');

    await register(name, phone, email, password, image);
    await getUserData();
  } catch (error) {
    console.error('Error during form submission:', error);
  }
});

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const phone = formData.get('phone');
  const password = formData.get('password');
  await login(phone, password);
  await getUserData();
});

logoutForm.addEventListener('submit', async e => {
  e.preventDefault();
  await logout();
  await getUserData();
});

deleteAccountForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(deleteAccountForm);
  const phone = formData.get('phone');
  const password = formData.get('password');
  await deleteAccount(phone, password);
  await getUserData();
});

updateImageForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('image', updateImageForm.image.files[0]);
  await updateImage(formData);
  await getUserData();
});

sendQrForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(sendQrForm);
  const qr = formData.get('qr');
  await sendQr(qr);
  await getUserData();
});

async function register(name, phone, email, password, image) {
  const body = { name, email, phone, password };

  const response = await fetch(`${authURL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    credentials: 'include'
  });

  if (response.status === 201) {
    await login(phone, password);
    if (image && image.name !== '') {
      const formData = new FormData();
      formData.append('image', image);
      await updateImage(formData);
    }
    message.innerText = 'User registered and logged in successfully';
    message.style.color = 'green';
  } else {
    message.innerText = 'User registration failed';
    message.style.color = 'red';
  }
}

async function login(phone, password) {
  const response = await fetch(`${authURL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone,
      password,
    }),
    credentials: 'include'
  });
  const data = await response.json();
  accessToken = data.accessToken;
}

async function logout() {
  const response = await fetch(`${authURL}/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  if (response.status === 200) {
    accessToken = '';
    userData = {};
    message.innerText = 'User logged out successfully';
    message.style.color = 'green';
  } else {
    message.innerText = 'User logout failed';
    message.style.color = 'red';
  }
}

async function deleteAccount(phone, password) {
  const response = await fetch(`${authURL}/deleteAccount?phone=${phone}&password=${password}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  if (response.status === 204) {
    message.innerText = 'Account deleted successfully';
    message.style.color = 'green';
  } else {
    message.innerText = 'Account deletion failed';
    message.style.color = 'red';
  }
}

async function updateImage(formData) {
  const response = await fetch(`${baseURL}/updateImg`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  if (response.status === 200) {
    message.innerText = 'Image updated successfully';
    message.style.color = 'green';
  } else {
    message.innerText = 'Image update failed';
    message.style.color = 'red';
  }
}

async function sendQr(qr) {
  const response = await fetch(`${baseURL}/sendQr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ text: qr })
  });

  if (response.status === 200) {
    message.innerText = 'QR sent successfully';
    message.style.color = 'green';
  } else {
    message.innerText = 'QR sending failed';
    message.style.color = 'red';
  }
}

async function getAccessToken() {
  const response = await fetch(`${authURL}/accessToken`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.status === 401) return;

  const data = await response.json();
  accessToken = data.accessToken;
}

async function getUserData() {
  const response = await fetch(`${baseURL}/userData`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (response.status === 401) return;
  const data = await response.json();
  userData = data;
  displayUserData();
}

function displayUserData() {
  if (userData.message || !userData) {
    userDataElement.innerHTML = '';
    return;
  }
  userDataElement.innerHTML = `
      <li>Name: ${userData.name}</li>
      <li>Phone: ${userData.phone}</li>
      <li>Email: ${userData.email}</li>
      <li>Points: ${userData.points}</li>
      <li>Image: <img src="${cdnURL}${userData.img}" alt="User Image" width="100"></li>
    `;
}