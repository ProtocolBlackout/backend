// Controller für Profil- und Fortschrittsdaten (MVP)


// Basis-Profildaten für eingeloggte User zurückgeben
export const getProfile = (req, res) => {
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
        console.error("Fehler bei getProfile:", error);
        return res.status(500).json({
            message: "Es ist ein Fehler beim Laden des Profils aufgetreten"
        });
    }
};


// Fortschrittsdaten für eingeloggte User zurückgeben (MVP mit Dummy-Daten)
export const getProfileProgress = (req, res) => {
    try {
        // Falls aus irgendeinem Grund kein User am Request hängt
        if (!req.user) {
            return res.status(401).json({
                message: "Nicht autorisiert"
            });
        }


        // Dummy-Daten für Fortschritt
        const progress = {
            level: 1,
            xp: 0,
            nextLevelXp: 100,
            completedGames: []
        };


        return res.status(200).json({
            message: "Fortschritt erfolgreich geladen",
            progress
        });

    } catch (error) {
        console.error("Fehler bei getProfileProgress:", error);
        return res.status(500).json({
            message: "Es ist ein Fehler beim Laden des Fortschritts aufgetreten"
        });
    }
};