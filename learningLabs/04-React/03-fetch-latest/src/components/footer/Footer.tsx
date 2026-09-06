import {
    useQuery
} from '@tanstack/react-query'
import {Grid, Text} from '@mantine/core';
// @ts-ignore
import classes from './Footer.module.css';
import Card, {SystemDataTelemetryPoint} from "../common";


export default function Footer() {

    const getTelemetry = async ():Promise<SystemDataTelemetryPoint> => {
        const response = await fetch('/api/latest');

        console.log(response);

        if (!response.ok) {
            console.log("Error")
            throw new Error(`Telemetry request failed: ${response.status}`);
        }

        return response.json();
    }

    // Queries
    const {data, isPending, isError, error} = useQuery<SystemDataTelemetryPoint, Error>({
        queryKey: ['telemetry'],
        queryFn: getTelemetry,
        refetchInterval: 1000,
    })

    if (isPending) {
        return <span>Loading...</span>
    }

    if (isError) {
        return <span>Error: {error.message}</span>
    }


    const telemetryPoint: SystemDataTelemetryPoint | undefined = data

    if (!telemetryPoint) {
        return (
            <Text>Invalid telemetry</Text>
        )
    }

    return (
        <>
            <Text className={classes.header}>Telemetry drawer</Text>
            <Grid>
                <Grid.Col span={2}>
                    <Card title="Connected" content={String(telemetryPoint.connectionStatus)}/>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Card title="Altitude" content={telemetryPoint.altitudeMetres.toString() + "m"}/>
                </Grid.Col>
                <Grid.Col span={2}>
                    {/*Add a leading zero for headings less than 100*/}
                    <Card title='Heading' content={(telemetryPoint.headingDegrees < 100 ? telemetryPoint.headingDegrees.toString().padStart(3, '0') : telemetryPoint.headingDegrees.toString()) + "°"}/>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Card title='Ground Speed' content={telemetryPoint.groundSpeedKmh.toString() + "kmh"}/>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Card title='Battery Volts' content={telemetryPoint.batteryVolts.toString() + "v"}/>
                </Grid.Col>
            </Grid>
            <Card title = 'Raw data' content = {JSON.stringify(telemetryPoint)}/>
        </>
    )
}