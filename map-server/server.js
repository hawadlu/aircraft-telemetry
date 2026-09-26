const express = require("express");
const path = require("path");

const cors = require('cors');
const app = express();

app.use(
    "/maps",
    express.static(path.join(__dirname, "..", "maps", "map-data"))
);

app.use(
    cors({
        origin: "http://localhost:5173",
    })
)

app.use(
    cors({
        origin: "http://localhost:5174",
    })
)

app.listen(3000, () => {
    console.log("Map server running on http://localhost:3000");
});