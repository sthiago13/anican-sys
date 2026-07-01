import { Box } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
  return (
    <Box
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--anican-bg)",
      }}
    >
      <Sidebar />
      <Box style={{ flexGrow: 1, padding: 32, maxWidth: "calc(100% - 260px)" }}>
        <Outlet />
      </Box>
    </Box>
  );
}
