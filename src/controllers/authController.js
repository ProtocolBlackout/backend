// Controller für die Authentifizierungslogik (Register, Login, Profil & Account-Löschung)

import bcrypt from "bcrypt";
import crypto from "crypto";
import { User } from "../models/User.js";
import { signToken } from "../services/jwtService.js";
import { sendMail } from "../services/mailService.js";

// Registrierung eines neuen Users
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Pflichtfelder prüfen
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Benutzername, E-Mail und Passwort sind erforderlich"
      });
    }

    // Prüfen, ob E-Mail bereits existiert
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Ein User mit dieser E-Mail existiert bereits"
      });
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 12);

    // User in der DB anlegen
    const createdUser = await User.create({
      username,
      email,
      passwordHash
    });

    // Token für Verify-Link erzeugen (Wird später in der Verify-Route geprüft)
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // Token-Hash + Ablauf speichern (Token selbst wird nur per Mail verschickt)
    const emailVerificationTokenHash = crypto
      .createHash("sha256")
      .update(emailVerificationToken)
      .digest("hex");

    // Ablaufzeit: 24 Stunden (kann später ggf. noch angepasst werden)
    const emailVerificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    createdUser.emailVerificationTokenHash = emailVerificationTokenHash;
    createdUser.emailVerificationTokenExpires = emailVerificationTokenExpires;

    await createdUser.save();

    // Basis-URL für den Link: im Deployment per ENV setzen, lokal fallback auf localhost
    const baseUrl = process.env.BACKEND_PUBLIC_URL || "http://localhost:3000";

    // Link, den der User per Mail bekommt, um seine E-Mail zu verifizieren
    const verifyLink = `${baseUrl}/auth/verify-email?token=${emailVerificationToken}`;

    // Welcome-Mail senden (darf Registrierung nicht blockieren)
    try {
      await sendMail({
        to: createdUser.email,
        subject: "Willkommen bei Protocol Blackout",
        text:
          `Hi ${createdUser.username}!\n\n` +
          "Willkommen bei Protocol Blackout. Deine Registrierung war erfolgreich.\n\n" +
          `Bitte verifiziere deine E-Mail über diesen Link:\n${verifyLink}\n\n` +
          "Viel Spaß beim Spielen!\n" +
          "— Dein Protocol Blackout Team"
      });
    } catch (mailError) {
      console.error("Fehler beim Welcome-Mailversand:", mailError);
    }

    // Nur sichere Daten zurückgeben
    const safeUser = {
      id: createdUser._id.toString(),
      username: createdUser.username,
      email: createdUser.email
    };

    return res.status(201).json({
      message: "Registrierung erfolgreich",
      user: safeUser
    });
  } catch (error) {
    console.error("Fehler bei registerUser:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler bei der Registrierung aufgetreten"
    });
  }
};

// Login eines bestehenden Users
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // User über E-Mail suchen
    const existingUser = await User.findOne({ email });

    // Wenn User nicht existiert -> 401
    if (!existingUser) {
      return res.status(401).json({
        message: "E-Mail oder Passwort ist ungültig"
      });
    }

    // Nur verifizierte Accounts dürfen sich einloggen
    if (existingUser.isEmailVerified !== true) {
      return res.status(401).json({
        message: "Bitte verifiziere zuerst deine E-Mail-Adresse"
      });
    }

    // Passwort prüfen
    const passwordIsValid = await bcrypt.compare(
      password,
      existingUser.passwordHash
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        message: "E-Mail oder Passwort ist ungültig"
      });
    }

    // JWT für den eingeloggten User erstellen
    const token = signToken(existingUser._id.toString());

    const safeUser = {
      id: existingUser._id.toString(),
      username: existingUser.username,
      email: existingUser.email
    };

    return res.status(200).json({
      message: "Login erfolgreich",
      token,
      user: safeUser
    });
  } catch (error) {
    console.error("Fehler beim loginUser:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler beim Login aufgetreten"
    });
  }
};

// Passwort-Reset anfordern (Reset-Link per Mail verschicken)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "E-Mail ist erforderlich"
      });
    }

    const user = await User.findOne({ email });

    // Wichtig!:
    // Wir geben immer die gleiche Erfolgsmeldung zurück,
    // damit niemand prüfen kann, ob eine E-Mail bei uns registriert ist (keine E-Mail-Enumeration).
    if (user) {
      // Reset-Token erzeugen
      const passwordResetToken = crypto.randomBytes(32).toString("hex");

      // Token-Hash + Ablauf speichern (Token selbst NICHT speichern)
      const passwordResetTokenHash = crypto
        .createHash("sha256")
        .update(passwordResetToken)
        .digest("hex");

      // Ablaufzeit: 1 Stunde (kann ggf. noch angepasst werden)
      const passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

      user.passwordResetTokenHash = passwordResetTokenHash;
      user.passwordResetTokenExpires = passwordResetTokenExpires;

      await user.save();

      // Basis-URL für den Link: im Deployment per ENV setzen, lokal fallback auf localhost
      const baseUrl = process.env.BACKEND_PUBLIC_URL || "http://localhost:3000";

      // Link, den der User als Mail bekommt, um das Passwort zurückzusetzen
      // Hinweis: Die eigentliche Passwortänderung passiert später über eine separate Route.
      const resetLink = `${baseUrl}/auth/password-reset?token=${passwordResetToken}`;

      // Reset-Mail senden (darf den Request nicht blockieren)
      try {
        await sendMail({
          to: user.email,
          subject: "Passwort zurücksetzen",
          text:
            `Hi ${user.username}!\n\n` +
            "Du hast einen Passwort-Reset angefordert.\n\n" +
            `Hier ist dein Link zum Zurücksetzen:\n${resetLink}\n\n` +
            "Wenn du das nicht warst, kannst du diese Mail ignorieren.\n" +
            "— Dein Protocol Blackout Team"
        });
      } catch (mailError) {
        console.error("Fehler beim Passwort-Reset-Mailversand:", mailError);
      }
    }

    return res.status(200).json({
      message:
        "Wenn ein Account mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet"
    });
  } catch (error) {
    console.error("Fehler beim requestPasswordReset:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler beim Passwort-Reset-Request aufgetreten"
    });
  }
};

// Aktuelles User-Profil für eingeloggte User zurückgeben
export const getAuthProfile = (req, res) => {
  try {
    // Falls aus irgendeinem Grund kein User am Request hängt
    if (!req.user) {
      return res.status(401).json({
        message: "Nicht autorisiert"
      });
    }

    const safeUser = {
      id: req.user._id.toString(),
      username: req.user.username,
      email: req.user.email
    };

    return res.status(200).json({
      message: "Profil erfolgreich geladen",
      user: safeUser
    });
  } catch (error) {
    console.error("Fehler beim getAuthProfile:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler beim Laden des Profils aufgetreten"
    });
  }
};

// Profil des eingeloggten Users löschen
export const deleteAuthProfile = async (req, res) => {
  try {
    // Falls aus irgendeinem Grund kein User am Request hängt
    if (!req.user) {
      return res.status(401).json({
        message: "Nicht autorisiert"
      });
    }

    // User über die ID aus dem Token löschen
    const deletedUser = await User.findByIdAndDelete(req.user._id);

    // Falls der User nicht gefunden wurde (sollte im Normalfall nicht vorkommen)
    if (!deletedUser) {
      return res.status(404).json({
        message: "User wurde nicht gefunden"
      });
    }

    return res.status(200).json({
      message: "Profil erfolgreich gelöscht"
    });
  } catch (error) {
    console.error("Fehler beim deleteAuthProfile:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler beim Löschen des Profils aufgetreten"
    });
  }
};

// E-Mail-Adresse über Verify-Link verifizieren
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Token fehlt"
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Token ist ungültig oder abgelaufen"
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpires = null;

    await user.save();

    return res.status(200).json({
      message: "E-Mail erfolgreich verifiziert"
    });
  } catch (error) {
    console.error("Fehler bei verifyEmail:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler bei der Verifizierung aufgetreten"
    });
  }
};
