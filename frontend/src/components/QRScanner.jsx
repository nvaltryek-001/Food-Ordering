import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScanner({ onScanned }) {

  const [message, setMessage] = useState(
    "Point your camera at the restaurant table QR code."
  );

  const started = useRef(false);

  useEffect(() => {

    if (started.current) return;

    started.current = true;

    const scanner = new Html5QrcodeScanner(
      "foodsense-qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250
        }
      },
      false
    );

    scanner.render(

      (decodedText) => {

        localStorage.setItem(
          "foodsense_table_qr",
          decodedText
        );

        setMessage(
          `QR detected: ${decodedText}`
        );

        if (onScanned) {
          onScanned(decodedText);
        }

        scanner.clear().catch(() => {});
      },

      () => {}
    );

    return () => {

      scanner.clear().catch(() => {});

    };

  }, [onScanned]);

  return (

    <div className="qr-scanner-page">

      <h1>Scan Table QR</h1>

      <p>{message}</p>

      <div
        id="foodsense-qr-reader"
        style={{
          maxWidth: "500px",
          margin: "20px auto"
        }}
      />

    </div>
  );
}
