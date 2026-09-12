export type SystemDataTelemetryPoint = {
    type: string,
    version: number,
    seq: number,
    timestampUtc: string,
    lat: number,
    lon: number,
    altitudeMetres: number,
    groundSpeedKmh: number,
    headingDegrees: number,
    batteryVolts: number,
    receivedTimeUtc: string,
    connectionStatus: string,
}