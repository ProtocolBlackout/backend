// Service für Mailversand (Gmail API bevorzugt, sonst SMTP-Fallback)
// Ziel: Controller bleiben schlank. Der Controller ruft nur sendMail(...) auf
// Entscheidung, ob Gmail, oder SMTP genutzt wird, passiert hier im Service

import nodemailer from "nodemailer";
import { google } from "googleapis";

// Prüft, ob alle nötigen ENV-Variablen für Gmail API gesetzt sind
// Wenn eine fehlt, nutzen wir Gmail NICHT, sondern fallen auf SMTP zurück
const isGmailConfigured = () => {
  return (
    !!process.env.GMAIL_CLIENT_ID &&
    !!process.env.GMAIL_CLIENT_SECRET &&
    !!process.env.GMAIL_REFRESH_TOKEN &&
    !!process.env.GMAIL_REDIRECT_URI
  );
};

// Prüft, ob alle nötigen SMTP-ENV_Variablen gesetzt sind
// Das ist unser Fallback, falls Gmail nicht konfiguriert ist
const isSmtpConfigured = () => {
  return (
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_PORT &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS &&
    !!process.env.SMTP_FROM
  );
};

// Gmail API erwartet die komplette E-Mail als "rohen Text" (inkl. Header wie From/To/Subject)
// Danach muss dieser Text in ein spezielles Base64-Format umgewandelt werden,
// damit er über die API übertragen werden kann.
const buildRawEmail = ({ from, to, subject, text, html }) => {
  // Standard-Header, die jede Mail braucht
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    // MIME ist das übliche "Format" für E-Mails
    // Damit kann eine Mail z.B. Text UND HTML enthalten (oder später auch Anhänge)
    "MIME-Version: 1.0"
  ];

  let mimeBody = "";

  // Wenn html existiert, bauen wir zwei Versionen der Mail:
  // - eine einfache Text-Version (für "alte" oder sehr einfache Mailprogramme)
  // - eine HTML-Version (für moderne Mailprogramme)
  // Das Mailprogramm des Empfängers nimmt dann automatisch die passende Version
  if (html) {
    // "Boundary" ist nur eine Trennlinie, damit das Mailprogramm weiß:
    // hier endet der Text-Teil und hier beginnt der HTML_Teil
    const boundary = `pb_boundary_${Date.now()}`;

    // multipart/alternative = "zwei Varianten vom gleichen Inhalt" (Text + HTML)
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    const safeText = text || "";
    mimeBody =
      `--${boundary}\n` +
      "Content-Type: text/plain; charset=UTF-8\n\n" +
      `${safeText}\n\n` +
      `--${boundary}\n` +
      "Content-Type: text/html; charset=UTF-8\n\n" +
      `${html}\n\n` +
      `--${boundary}--`;
  } else {
    // Wenn kein HTML da ist, senden wir nur plain text
    headers.push("Content-Type: text/plain; charset=UTF-8");
    mimeBody = text || "";
  }

  // Header + Body zusammenfügen -> komplette Mail als Text
  const mimeMessage = `${headers.join("\n")}\n\n${mimeBody}`;

  // Gmail braucht "base64url":
  // Das ist einfach Base64, aber so angepasst, dass es in URLs/HTTP sicher ist
  // (Einige Zeichen werden ersetzt und am Ende werden "=" entfernt)
  const base64 = Buffer.from(mimeMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return base64;
};

// Versendet über Gmail API
// Vorteil: funktioniert auf Render zuverlässig, weil kein SMTP-Outgoing nötig ist
const sendViaGmailApi = async ({ from, to, subject, text, html }) => {
  // OAuth2 Client wird mit ClientId/Secret/RedirectUri erstellt
  // Der Refresh Token reicht aus, um automatisch Access Tokens zu holen
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  // Wichtig: Wir setzen nur den Refresh Token
  // googleapis kümmert sich dann um den Access Token (bei Bedarf)
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  // Gmail API Client
  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
  });

  // "raw" Message bauen (komplette Mail als Text -> umgewandelt für die API)
  const raw = buildRawEmail({
    from,
    to,
    subject,
    text,
    html
  });

  // userId "me" = der authentifizierte Gmail-Account
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw
    }
  });
};

// Versendet über SMTP (Nodemailer)
// SMTP ist nur unser Fallback, falls Gmail nicht konfiguriert ist
// Hinweis: In eurer aktuellen Render-Umgebung kann SMTP je nach Provider/Plan blockiert oder instabil sein
const sendViaSmtp = async ({ from, to, subject, text, html }) => {
  // Port muss eine Zahl sein (z.B. 465 oder 587)
  const smtpPort = Number(process.env.SMTP_PORT);
  if (!smtpPort) {
    throw new Error("SMTP-Port ist ungültig");
  }

  // secure true nur bei Port 465 (klassisches SMTPS)
  // Bei 587 ist es meist STARTTLS -> secure false
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Mail-Objekt bewusst ohne undefined-Felder
  const mailOptions = {
    from,
    to,
    subject,
    text
  };

  // html nur hinzufügen, wenn es wirklich existiert
  if (html) {
    mailOptions.html = html;
  }

  await transporter.sendMail(mailOptions);
};

// Öffentliche Funktion für Controller:
// - entscheidet automatisch Gmail vs SMTP
// - wirft klare Fehler, wenn gar nichts konfiguriert ist
export const sendMail = async ({ to, subject, text, html }) => {
  // Minimal-Validierung (Controller muss nicht doppelt validieren)
  if (!to || !subject) {
    throw new Error("Empfänger und Betreff sind Pflicht");
  }

  // Absender:
  // - Wenn du für Gmail einen festen From willst -> GMAIL_FROM setzen
  // - Sonst SMTP_FROM oder SMTP_USER fallback
  const from =
    process.env.GMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

  // 1) Gmail bevorzugen, wenn komplett konfiguriert
  if (isGmailConfigured()) {
    return sendViaGmailApi({
      from,
      to,
      subject,
      text,
      html
    });
  }

  // 2) Wenn Gmail nicht konfiguriert ist, warnen wir (hilft beim Debugging)
  // Wir blockieren SMTP nicht, weil es lokal/anderswo trotzdem funktioniert
  console.warn(
    "Gmail nicht konfiguriert -> SMTP-Fallback aktiv (auf Render ggf. instabil)"
  );

  // 3) Sonst SMTP-Fallback, wenn komplett konfiguriert
  if (!isSmtpConfigured()) {
    throw new Error(
      "Mail-Konfiguration ist unvollständig (weder Gmail noch SMTP)"
    );
  }

  return sendViaSmtp({
    from,
    to,
    subject,
    text,
    html
  });
};
