import {Grid, Text} from '@mantine/core';
import classes from './Footer.module.css';
import Card, {SystemDataTelemetryPoint} from "../common";

export default function Footer() {
    const telemetry: SystemDataTelemetryPoint = {
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
    }

    return (
        <>
            <Text className={classes.header}>Telemetry drawer</Text>
            <Grid>
                <Grid.Col span={2}>
                    <Card title="Connected" content={String(telemetry.connectionStatus)}/>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Card title="Altitude" content={telemetry.altitudeMetres.toString() + "m"}/>
                </Grid.Col>
                <Grid.Col span={2}>
                    {/*Add a leading zero for headings less than 100*/}
                    <Card title='Heading' content={(telemetry.headingDegrees < 100 ? telemetry.headingDegrees.toString().padStart(3, '0') : telemetry.headingDegrees.toString()) + "°"}/>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Card title='Ground Speed' content={telemetry.groundSpeedKmh.toString() + "kmh"}/>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Card title='Battery Volts' content={telemetry.batteryVolts.toString() + "v"}/>
                </Grid.Col>
            </Grid>
            <Card title = 'Raw telemetry' content = {JSON.stringify(telemetry)}/>
        </>
    )
}