// Controller für die Authentifizierungslogik (Register & Login)


const users = [];   // Einfache In-Memory-"Datenbank" (nur im RAM, nach Server beenden alle Daten weg) nur für Entwicklung


// Hilfsfunktion: findet einen User anhand der E-Mail
const findUserByEmail = email => {
    return users.find(user => user.email === email);
};


export const registerUser = (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Benutzername, E-Mail und Passwort sind erforderlich"
        });
    }

    const existingUser = findUserByEmail(email);

    if (existingUser) {
        return res.status(400).json({
            message: "Ein User mit dieser E-Mail existiert bereits"
        });
    }

    const newUser = {
        id: users.length + 1,
        username,
        email,
        password
    };

    users.push(newUser);


    // Passwort nicht zurückgeben
    const { password: _, ...safeUser } = newUser;

    return res.status(201).json({
        message: "Registrierung erfolgreich",
        user: safeUser
    });
};


export const loginUser = (req, res) => {
    const { email, password } = req.body;

    const existingUser = findUserByEmail(email);

    if (!existingUser || existingUser.password !== password) {
        return res.status(401).json({
            message: "E-Mail oder Passwort ist ungültig"
        });
    }


    // Platzhalter-Token für MVP (Minimum Viable Product) - später ersetzen wir das durch echtes JWT
    const token = "dummy-token";

    const { password: _, ...safeUser } = existingUser;

    return res.status(200).json({
        message: "Login erfolgreich",
        token,
        user: safeUser
    });
};