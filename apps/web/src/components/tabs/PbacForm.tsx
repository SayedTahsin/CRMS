import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { handleErrorMsg } from "@/utils/error-msg"
import { trpc } from "@/utils/trpc"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useDebounce } from "@uidotdev/usehooks"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Input } from "../ui/input"

const PAGE_LIMIT = 10

const PBACForm = () => {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const queryInput = {
    page,
    limit: PAGE_LIMIT,
    q: debouncedSearchTerm,
  }

  const {
    handleSubmit: handleRolePermissionSubmit,
    reset: resetRolePermission,
    control: controlRolePermission,
  } = useForm({
    defaultValues: {
      roleId: "",
      permissionId: "",
    },
  })

  const { data: userRoles, refetch: refetchUserRoles } = useQuery(
    trpc.userRole.getAll.queryOptions(),
  )
  const { data: rolePermissions, refetch: refetchRolePermissions } = useQuery(
    trpc.rolePermission.getAll.queryOptions(),
  )

  const {
    data: result = { data: [], total: 0, hasNext: false },
    isLoading,
    isError,
    error,
  } = useQuery(trpc.user.filter.queryOptions(queryInput))

  const users = result.data || []
  const { data: roles } = useQuery(trpc.role.getAll.queryOptions())
  const { data: permissions } = useQuery(trpc.permission.getAll.queryOptions())

  const assignUserRole = useMutation(
    trpc.userRole.assign.mutationOptions({
      onSuccess: () => {
        toast.success("Role updated")
        refetchUserRoles()
        setEditingUserId(null)
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  const removeUserRole = useMutation(
    trpc.userRole.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Role removed from user")
        refetchUserRoles()
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  const assignRolePermission = useMutation(
    trpc.rolePermission.assign.mutationOptions({
      onSuccess: () => {
        toast.success("Permission assigned to role")
        refetchRolePermissions()
        resetRolePermission()
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  const removeRolePermission = useMutation(
    trpc.rolePermission.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Permission removed from role")
        refetchRolePermissions()
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  return (
    <Card>
      <CardContent className="space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="flex-1"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-red-500">
                  Error: {error?.message}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              !isError &&
              users.map((u) => {
                const assignedRoles =
                  userRoles?.filter((ur) => ur.userId === u.id) || []

                return (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell
                      onDoubleClick={() => setEditingUserId(u.id)}
                      className="cursor-pointer space-y-1"
                    >
                      {editingUserId === u.id ? (
                        <Select
                          onValueChange={(value) => {
                            const newRoleId = value
                            if (newRoleId) {
                              assignUserRole.mutate({
                                userId: u.id,
                                roleId: newRoleId,
                              })
                            }
                            setEditingUserId(null)
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {assignedRoles.length > 0 ? (
                            assignedRoles.map((ur) => {
                              const role = roles?.find(
                                (r) => r.id === ur.roleId,
                              )
                              return (
                                <span
                                  key={ur.roleId}
                                  className="flex items-center rounded bg-muted px-2 py-1 text-sm"
                                >
                                  {role?.name || ur.roleId}
                                  <button
                                    type="button"
                                    className="ml-1 text-red-500 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeUserRole.mutate({
                                        userId: u.id,
                                        roleId: ur.roleId,
                                      })
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </span>
                              )
                            })
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span>Page</span>
            <Input
              type="number"
              min={1}
              value={page}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (val > 0) setPage(val)
              }}
              className="w-14 p-1 text-center"
            />
          </div>
          <Button
            disabled={!result.hasNext || users.length === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>

        <hr className="border-muted" />

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Assign Permission to Role</h2>

          <form
            onSubmit={handleRolePermissionSubmit((data) =>
              assignRolePermission.mutate(data),
            )}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="rolePermission-role">Role</Label>
              <Controller
                name="roleId"
                control={controlRolePermission}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full rounded bg-background p-1 text-sm">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="permission">Permission</Label>
              <Controller
                name="permissionId"
                control={controlRolePermission}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full rounded bg-background p-1 text-sm">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissions?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Assign Permission</Button>
            </div>
          </form>

          <div className="space-y-2">
            <Label>Assigned Role Permissions</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permission Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolePermissions?.map((rp) => (
                  <TableRow key={`${rp.roleId}-${rp.permissionId}`}>
                    <TableCell>
                      {roles?.find((r) => r.id === rp.roleId)?.name ||
                        rp.roleId}
                    </TableCell>
                    <TableCell>
                      {permissions?.find((p) => p.id === rp.permissionId)
                        ?.name || rp.permissionId}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeRolePermission.mutate({
                            roleId: rp.roleId,
                            permissionId: rp.permissionId,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PBACForm
