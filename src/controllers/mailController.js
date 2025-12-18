// Controller für Mailversand (SMTP / Nodemailer)

import nodemailer from "nodemailer";

export const sendTestMail = async (req, res) => {
  try {
    // Pflichtwerte aus der .env prüfen
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !process.env.SMTP_FROM
    ) {
      return res.status(500).json({
        message: "SMTP-Konfiguration ist unvollständig"
      });
    }

    // SMTP-Port als Zahl verarbeiten
    const smtpPort = Number(process.env.SMTP_PORT);
    if (!smtpPort) {
      return res.status(500).json({
        message: "SMTP-Port ist ungültig"
      });
    }

    // Nodemailer-Transporter erstellen (SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465, // Bei 465 ist die Verbindung von Anfang an verschlüsselt (bei 587 erst später)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Testmail an die eigene Mailbox senden
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: "Protocol Blackout - SMTP-Test",
      text: "Wenn du das liest, funktioniert der SMTP-Versand über Nodemailer."
    });

    return res.status(200).json({
      message: "Test-Mail wurde versendet"
    });
  } catch (error) {
    console.error("Fehler bei sendTestMail:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler beim Mailversand aufgetreten"
    });
  }
};
