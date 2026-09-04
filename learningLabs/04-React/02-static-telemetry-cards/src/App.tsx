import { useDisclosure } from '@mantine/hooks';
import {AppShell, Burger, Group, Text} from "@mantine/core";
import Footer from "./components/footer/Footer";

export default function App() {
    const [opened, { toggle }] = useDisclosure();

    return (
        <AppShell
            padding="xl"
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
            <AppShell.Footer>
                <Footer />
            </AppShell.Footer>
        </AppShell>
    );
}