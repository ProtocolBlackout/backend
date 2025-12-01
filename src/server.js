// Startpunkt für den Server

import app from "./app.js";


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server lauscht auf Port ${PORT}`);
});