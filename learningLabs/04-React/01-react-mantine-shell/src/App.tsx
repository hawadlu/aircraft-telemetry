import { useDisclosure } from '@mantine/hooks';
import {AppShell, Burger, Group, Text} from "@mantine/core";

export default function App() {
    const [opened, { toggle }] = useDisclosure();

    return (
        <AppShell
            header={{ height: 60 }}
            footer={{ height: 60 }}
            navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            aside={{ width: 300, breakpoint: 'md', collapsed: { desktop: false, mobile: true } }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md">
                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                    Header
                </Group>
            </AppShell.Header>
            <AppShell.Main>
                <Text>Main content here</Text>
            </AppShell.Main>
            <AppShell.Footer p="md">
                <Text>Raw telemetry cards will go here.</Text>
            </AppShell.Footer>
        </AppShell>
    );
}