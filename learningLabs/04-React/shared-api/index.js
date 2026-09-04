const express = require('express');
const app = express();
const PORT = 3000;

// export type SystemDataTelemetryPoint = {
//     type: string,
//     version: number,
//     seq: number,
//     timestampUtc: Date,
//     lat: number,
//     lon: number,
//     altitudeMetres: number,
//     groundSpeedKmh: number,
//     headingDegrees: number,
//     batteryVolts: number,
//     receivedTimeUtc: Date,
//     connectionStatus: boolean,
// }

// Enable JSON parsing (useful if you expand to POST requests later)
app.use(express.json());

// A simple GET endpoint
app.get('/api/data', (req, res) => {
    console.log("Received get request")
    res.json({
        altitudeMetres: 1,
        batteryVolts: 1.0,
        groundSpeedKmh: 10,
        headingDegrees: 5,
        lat: -40.956993596155066,
        lon: 174.9728731092531,
        receivedTimeUtc: new Date("2026-01-01T00:01:38+00:00"),
        seq: 98,
        timestampUtc: new Date("2026-01-01T00:01:37+00:00"),
        type: "telemetry",
        version: 1,
        connectionStatus: true
    });
    return res
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
