// Controller für die Authentifizierungslogik (Register & Login)

import bcrypt from "bcrypt";
import { User } from "../models/User.js";


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


        // Platzhalter-Token für MVP (Minimum Viable Product)
        const token = "dummy-token";

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