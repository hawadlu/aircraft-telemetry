const express = require("express");
const path = require("path");

const app = express();

app.use(
    "/maps",
    express.static(path.join(__dirname, "map-data"))
);

app.listen(3000, () => {
    console.log("Map server running on http://localhost:3000");
});