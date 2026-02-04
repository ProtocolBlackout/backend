// Controller für Mailversand (Gmail API bevorzugt, SMTP als Fallback)
// Wichtig: Der Controller verschickt keine Mails mehr direkt
// Er delegiert an sendMail(...) im Service, damit die Logik zentral bleibt

import { sendMail } from "../services/mailService.js";

// Helperfunktion für Mail-Validierung
const isValidEmail = (email) => {
  // sehr einfache Prüfung: irgendwas@irgendwas.irgendwas
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Kontaktformular-Mail (öffentlich, ohne Token)
export const sendContactMail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Pflichtfelder prüfen
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "Bitte fülle alle Felder aus"
      });
    }

    // E-Mail prüfen
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Bitte gib eine gültige E-Mail-Adresse ein"
      });
    }

    // Empfänger für Kontaktmails:
    // - bevorzugt die Gmail-Adresse (GMAIL_FROM)
    // - sonst SMTP_USER (Fallback, bzw wenn wir nochmal mit eigener Domain deployen wollen)
    const to = process.env.GMAIL_FROM || process.env.SMTP_USER;

    if (!to) {
      return res.status(500).json({
        message:
          "Keine Empfängeradresse konfiguriert (GMAIL_FROM oder SMTP_USER fehlt)"
      });
    }

    // Betreff muss Kontaktformular enthalten (Erwartung des Tests)
    const mailSubject = `Kontaktformular - ${subject}`;

    // Inhalt (plain text), keine undefined-Felder
    const text =
      `Neue Nachricht über das Kontaktformular:\n\n` +
      `Name: ${name}\n` +
      `E-Mail: ${email}\n` +
      `Betreff: ${subject}\n\n` +
      `Nachricht:\n${message}\n`;

    await sendMail({
      to,
      subject: mailSubject,
      text,
      replyTo: email
    });

    return res.status(200).json({
      message: "Nachricht wurde gesendet"
    });
  } catch (error) {
    console.error("Fehler bei sendContactMail:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler beim Mailversand aufgetreten"
    });
  }
};

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
