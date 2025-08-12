import Loader from "@/components/loader"
import AdminTab from "@/components/tabs/AdminTab"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"
import { authGuard } from "@/utils/auth-guard"
import { getTimeAgo } from "@/utils/days-ago"
import { handleErrorMsg } from "@/utils/error-msg"
import { useSetUserStore } from "@/utils/set-user-store"
import { trpc } from "@/utils/trpc"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { AlertCircle, BadgeCheck } from "lucide-react"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  beforeLoad: async () => {
    await authGuard()
  },
})

function ProfilePage() {
  const user = useSetUserStore()

  const userRoleName = user?.roleName || "Student"
  const isAdmin = ["SuperAdmin", "Chairman", "Teacher"].includes(userRoleName)
  const { data: sectiones } = useQuery(trpc.section.getAll.queryOptions())

  const { register, handleSubmit, reset, watch, control } = useForm({
    defaultValues: {
      name: "",
      email: "",
      emailVerified: false,
      username: "",
      sectionId: "",
      phone: "",
      roleId: "",
      id: "",
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user?.name,
        email: user?.email,
        id: user?.id,
        emailVerified: user?.emailVerified,
        username: user?.username || "",
        sectionId: user?.sectionId || "",
        phone: user?.phone || "",
        roleId: user?.roleId || "",
      })
    }
  }, [user, reset])

  const updateUser = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully.")
      },
      onError: (error) => {
        toast.error(handleErrorMsg(error))
      },
    }),
  )

  const onSubmit = handleSubmit((data) => {
    const updatedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== ""),
    )
    updateUser.mutate({
      ...updatedData,
      id: user?.id || "",
    })
  })

  const addPasskey = async () => {
    try {
      await authClient.passkey.addPasskey()
    } catch (error) {
      toast.error(handleErrorMsg(error))
    }
  }

  if (!user) return <Loader />

  const emailVerified = watch("emailVerified")
  const createdAgo = getTimeAgo(user.createdAt)
  const updatedAgo = getTimeAgo(user.updatedAt || "")

  return (
    <Tabs defaultValue="profile" className="mx-auto mt-4 w-full max-w-5xl">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-4">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register("name")} />
                </div>
                <div>
                  <Label htmlFor="roleId">Role</Label>
                  <Input id="roleId" value={userRoleName} disabled />
                </div>
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register("username")} />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="email"
                    disabled
                    {...register("email")}
                    className="flex-1"
                  />
                  {!emailVerified ? (
                    <button
                      type="button"
                      className="text-red-500"
                      title="Click to send verification email"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </button>
                  ) : (
                    <div className="text-green-600" title="Email is verified">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>

              <div>
                <Label htmlFor="sectionId">Section</Label>
                <Controller
                  name="sectionId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectiones?.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button type="button" onClick={addPasskey}>
                  Add Passkey
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>

              <p className="pt-4 text-muted-foreground text-xs">
                Profile created {createdAgo}
                {updatedAgo && <span> and updated {updatedAgo}.</span>}
              </p>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="admin">
        {isAdmin && <AdminTab userRoleName={userRoleName} />}
      </TabsContent>
    </Tabs>
  )
}
