import {
    useQuery
} from '@tanstack/react-query'
import {Grid, Text} from '@mantine/core';
// @ts-ignore
import classes from './Footer.module.css';
import Card, {SystemDataTelemetryPoint} from "../common";
import {ReactNode, useCallback, useEffect, useState} from "react";
import { LazyLog, ScrollFollow } from '@melloware/react-logviewer';
import * as React from "react";

function Panel(isError: boolean, isPending: boolean, telemetryPoint?: SystemDataTelemetryPoint): ReactNode{
    if (!isError && !isPending && telemetryPoint) {
        return (
            <>
                <Text className={classes.header}>Telemetry drawer</Text>
                <Grid>
                    <Grid.Col span={1}>
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
                    <Grid.Col span={3}>
                        <Card title='Posistion' content={
                            <>
                                <Text>Lat: {telemetryPoint.lat}</Text>
                                <Text>Lon: {telemetryPoint.lon}</Text>
                            </>
                        }/>
                    </Grid.Col>
                </Grid>
            </>
        )
    }

    return <></>
}


export default function Footer() {
    // Log successfully retrieved data
    const [logText, setLogText] = useState("=== System Log Stream Started ===\n");

    const getTelemetry = async ():Promise<SystemDataTelemetryPoint> => {
        // Store raw telemetry log here instead of passing it through every api call
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

    const telemetryPoint: SystemDataTelemetryPoint | undefined = data

    // We want to append the results of every fetch, irrestpective of the http response
    // Use-query caches results and does not serve any that are the same as the last request so we won't log those
    useEffect(() => {
        // Prevent returning undefined before the first response arrives
        if (!data) return;

        setLogText((prevLogs) => {
            const newLine = `${new Date().toISOString()} | ${JSON.stringify(data)}\n`;
            const updatedLogs = prevLogs + newLine;

            // Memory Management: Keep the terminal fast by trimming at 3,000 lines
            const lines = updatedLogs.split('\n');
            if (lines.length > 3000) {
                return lines.slice(-3000).join('\n');
            }

            return updatedLogs;
        });
    }, [data]);

    return (
        <>
            {Panel(isError, isPending, telemetryPoint)}
            <div style={{ height: '150px', width: '100%', background: '#111' }}>
                <ScrollFollow
                    startFollowing={true}
                    render={({ onScroll, follow }) => (
                        <LazyLog
                            text={logText}
                            stream={true}
                            selectableLines={true}
                            rowHeight={24}
                            onScroll={onScroll}
                            follow={follow}
                            style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
                        />
                    )}
                />
            </div>
        </>
    )
}