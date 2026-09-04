export type SystemDataTelemetryPoint = {
    type: string,
    version: number,
    seq: number,
    timestampUtc: Date,
    lat: number,
    lon: number,
    altitudeMetres: number,
    groundSpeedKmh: number,
    headingDegrees: number,
    batteryVolts: number,
    receivedTimeUtc: Date,
    connectionStatus: boolean,
}