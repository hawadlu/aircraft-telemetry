import { Card, SimpleGrid, Text, Title } from "@mantine/core";
import type { Telemetry } from "./types";

function value(number: number | null | undefined, unit: string) {
    return number == null ? "—" : `${number} ${unit}`;
}

export default function TelemetryCards({ telemetry, status }: {
    telemetry: Telemetry | null;
    status: string;
}) {
    const heading = telemetry?.headingDegrees;
    const cards = [
        { title: "Connected", content: status },
        { title: "Altitude", content: value(telemetry?.altitudeMetres, "m") },
        {
            title: "Heading",
            content: heading == null ? "—" : `${(((Math.round(heading) % 360) + 360) % 360).toString().padStart(3, "0")}°`,
        },
        { title: "Ground Speed", content: value(telemetry?.groundSpeedKmh, "km/h") },
        { title: "Battery Volts", content: value(telemetry?.batteryVolts, "V") },
        {
            title: "Position",
            content: <>
                <Text>Lat: {telemetry?.lat ?? "—"}</Text>
                <Text>Lon: {telemetry?.lon ?? "—"}</Text>
            </>,
        },
    ];

    return (
        <section aria-label="Telemetry" style={{ marginBottom: 20 }}>
            <Title order={3} mb="sm">Telemetry</Title>
            <SimpleGrid cols={6}>
                {cards.map(card => (
                    <Card key={card.title} padding="sm" radius="sm" bg="gray.2" withBorder>
                        <Text c="red" size="sm" mb={4}>{card.title}</Text>
                        <div style={{ color: "var(--mantine-color-orange-8)", fontSize: 20, fontWeight: 700 }}>
                            {card.content}
                        </div>
                    </Card>
                ))}
            </SimpleGrid>
        </section>
    );
}
