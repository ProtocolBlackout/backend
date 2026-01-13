// Controller für Mailversand (Gmail API bevorzugt, SMTP als Fallback)
// Wichtig: Der Controller verschickt keine Mails mehr direkt
// Er deligiert an sendMail(...) im Service, damit die Logik zetral bleibt

import { sendMail } from "../services/mailService.js";

export const sendTestMail = async (req, res) => {
  try {
    // Empfänger für die Testmail:
    // - bevorzugt die Gmail-Adresse (GMAIL_FROM)
    // - sonst SMTP_USER (Fallback, falls ihr lokal nur SMTP testet)
    const to = process.env.GMAIL_FROM || process.env.SMTP_USER;

    if (!to) {
      return res.status(500).json({
        message:
          "Keine Empfängeradresse konfiguriert (GMAIL_FROM oder SMTP_USER fehlt)"
      });
    }

    await sendMail({
      to,
      subject: "Protocol Blackout - Mail-Test",
      text: "Wenn du das liest, funktioniert der Mailversand (Gmail API, SMTP-Fallback)."
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
