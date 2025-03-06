const serverURL = '/';
const businessURL = serverURL + 'api/business';
const businessIDPassword = 'id=67c48920eddaae75d4c1ac8b&password=MyVeryStrongPassword';
var qrcode = new QRCode(document.getElementById("qrcode"), {
  text: '',
  width: 500,
  height: 500,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H
});

function updateQRCode(text) {
  qrcode.clear();
  qrcode.makeCode(text);
}

document.addEventListener('DOMContentLoaded', () => {
  // fetch(businessURL + `/qrCode?${businessIDPassword}`).then(response => response.json()).then(data => updateQRCode(data.text));
  const eventSource = new EventSource(businessURL + `/eventStream?${businessIDPassword}`);
  eventSource.onmessage = event => {
    // const data = JSON.parse(event.data);
    // if (event.data === 'Connected') return;
    console.log(event.data);
    updateQRCode(event.data);
  };
});