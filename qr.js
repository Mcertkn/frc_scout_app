// qr.js
function makeQR(canvas, dataObj) {
  const text = JSON.stringify(dataObj);
  // qrcode library: QRCode.toCanvas
  return new Promise((resolve, reject) => {
    QRCode.toCanvas(canvas, text, { errorCorrectionLevel: "M", margin: 1, width: 260 }, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}
