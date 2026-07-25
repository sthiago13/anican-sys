import { useState } from "react";
import { Stack, Title, Text, Card, Group, Table, ActionIcon, Center, Loader, Badge, Tooltip } from "@mantine/core";
import { IconEdit, IconUserPlus } from "@tabler/icons-react";
import { Navigate } from "react-router-dom";
import { Button } from "../../../components/UI/Button";
import { SearchInput } from "../../../components/UI/SearchInput";
import { useAuth, type Perfil } from "../../auth/hooks/useAuth";
import { useUsers } from "../hooks/useUsers";
import { UserRoleModal } from "./UserRoleModal";
import { CreateUserModal } from "./CreateUserModal";
import { formatDate } from "../../../utils/date";

export function UsersView() {
  const { perfil: perfilActual, loading: authLoading } = useAuth();
  const { usuarios, loading: usersLoading, handleUpdateRole, handleCreateUser } = useUsers();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpened, setModalOpened] = useState(false);
  const [createUserOpened, setCreateUserOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Perfil | null>(null);

  if (authLoading) {
    return (
      <Center style={{ height: "70vh" }}>
        <Loader color="orange" size="xl" type="bars" />
      </Center>
    );
  }

  if (perfilActual?.rol !== "Administrador") {
    return <Navigate to="/" replace />;
  }

  const filteredUsuarios = usuarios.filter((u) =>
    u.nombres.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditRole = (user: Perfil) => {
    setSelectedUser(user);
    setModalOpened(true);
  };

  return (
    <Stack gap="xl" className="anican-fade-in">
      <Group justify="space-between" align="center">
        <div>
          <Title
            order={1}
            style={{
              letterSpacing: -1,
              color: "var(--anican-azul-oscuro)",
            }}
          >
            Control de Accesos
          </Title>
          <Text c="dimmed">
            Administra los roles y permisos de los voluntarios y administradores del sistema
          </Text>
        </div>
        <Button
          leftSection={<IconUserPlus size={16} />}
          onClick={() => setCreateUserOpened(true)}
        >
          Crear Usuario
        </Button>
      </Group>

      <Card withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" mb="md" align="center">
          <div style={{ flexGrow: 1, maxWidth: 350 }}>
            <SearchInput
              placeholder="Buscar usuario por nombre..."
              onSearchChange={setSearchQuery}
              style={{ width: "100%" }}
            />
          </div>
        </Group>

        {usersLoading && usuarios.length === 0 ? (
          <Center style={{ height: "40vh" }}>
            <Loader color="orange" size="xl" type="bars" />
          </Center>
        ) : (
          <div className="anican-table-container">
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: "35%" }}>Nombre Completo</Table.Th>
                  <Table.Th style={{ width: "25%" }}>Rol del Usuario</Table.Th>
                  <Table.Th style={{ width: "25%" }}>Fecha de Registro</Table.Th>
                  <Table.Th style={{ width: "15%", textAlign: "right" }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredUsuarios.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" py="xl" c="dimmed">
                        {searchQuery ? "No se encontraron usuarios que coincidan con la búsqueda." : "No hay usuarios registrados."}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredUsuarios.map((u) => {
                    const esPropioPerfil = u.id === perfilActual.id;
                    return (
                      <Table.Tr key={u.id}>
                        <Table.Td>
                          <Group gap="xs">
                            <Text size="sm" fw={600} c="var(--anican-azul-oscuro)">
                              {u.nombres}
                            </Text>
                            {esPropioPerfil && (
                              <Badge color="gray" size="xs" variant="outline">
                                Tú
                              </Badge>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={u.rol === "Administrador" ? "red" : "blue"}
                            variant="light"
                          >
                            {u.rol}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {u.created_at ? formatDate(u.created_at.split("T")[0]) : "—"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} justify="flex-end">
                            <Tooltip
                              label={esPropioPerfil ? "No puedes cambiar tu propio rol" : "Modificar rol de acceso"}
                              position="top"
                              withArrow
                            >
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditRole(u);
                                }}
                                disabled={esPropioPerfil}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Card>

      <UserRoleModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        usuario={selectedUser}
        onSave={handleUpdateRole}
      />

      <CreateUserModal
        opened={createUserOpened}
        onClose={() => setCreateUserOpened(false)}
        onSave={handleCreateUser}
      />
    </Stack>
  );
}
