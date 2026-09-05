import { useDisclosure } from '@mantine/hooks';
import {AppShell, Burger, Group, Text} from "@mantine/core";
import Footer from "./components/footer/Footer";
import {
    QueryClient,
    QueryClientProvider
} from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppShell
                padding="xl"
            >
                <AppShell.Header>
                    <Group h="100%" px="md">
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
        </QueryClientProvider>
    );
}