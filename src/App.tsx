import { MantineProvider, createTheme } from "@mantine/core";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./modules/auth/hooks/useAuth";

const theme = createTheme({
  primaryColor: "orange",
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
