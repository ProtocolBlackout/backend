// Controller für die Authentifizierungslogik (Register, Login, Profil & Account-Löschung)
import bcrypt from "bcrypt";
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

    // Welcome-Mail senden (darf Registrierung nicht blockieren)
    try {
      await sendMail({
        to: createdUser.email,
        subject: "Willkommen bei Protocol Blackout",
        text:
          `Hi ${createdUser.username}!\n\n` +
          "Willkommen bei Protocol Blackout. Deine Registrierung war erfolgreich.\n\n" +
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
