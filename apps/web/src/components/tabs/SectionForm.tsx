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
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  username: string | null
  phone: string | null
  email: string
}

type AdminTabProps = {
  userRoleName: string
}

const SectionForm = ({ userRoleName }: AdminTabProps) => {
  const isSuperAdmin = userRoleName === "SuperAdmin"
  const isChairman = userRoleName === "Chairman"
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
    },
  })

  const [selectedSectionId, setSelectedSectionId] = useState("")
  const [selectedSectionName, setSelectedSectionName] = useState("")

  const { data: sectiones, refetch } = useQuery(
    trpc.section.getAll.queryOptions(),
  )

  const createSection = useMutation(
    trpc.section.create.mutationOptions({
      onSuccess: () => {
        toast.success("Section created successfully!")
        reset()
        refetch()
      },
      onError: (err) => {
        toast.error(handleErrorMsg(err))
      },
    }),
  )

  const updateSection = useMutation(
    trpc.section.update.mutationOptions({
      onSuccess: () => {
        toast.success("Section name updated!")
        refetch()
      },
      onError: (err) => {
        toast.error(handleErrorMsg(err))
      },
    }),
  )

  const deleteSection = useMutation(
    trpc.section.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Section deleted successfully!")
        setSelectedSectionId("")
        setSelectedSectionName("")
        refetch()
      },
      onError: (err) => {
        toast.error(handleErrorMsg(err))
      },
    }),
  )

  const { data: users } = useQuery({
    ...trpc.user.getBySection.queryOptions({
      sectionId: selectedSectionId,
    }),
    enabled: !!selectedSectionId,
  })

  const onSubmit = handleSubmit((data) => {
    createSection.mutate(data)
  })

  const handleSectionSelect = async (value: string) => {
    const sectionId = value
    setSelectedSectionId(sectionId)

    const sectionName = sectiones?.find((b) => b.id === sectionId)?.name ?? ""
    setSelectedSectionName(sectionName)

    if (!sectionId) setSelectedSectionName("")
  }

  const handleSectionRename = () => {
    if (!selectedSectionId || !selectedSectionName.trim()) return
    updateSection.mutate({ id: selectedSectionId, name: selectedSectionName })
  }

  const handleSectionDelete = () => {
    if (!selectedSectionId) return
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this section?",
    )
    if (confirmDelete) {
      deleteSection.mutate({ id: selectedSectionId })
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {(isChairman || isSuperAdmin) && (
            <form onSubmit={onSubmit} className="">
              <Label htmlFor="name">Create New Section</Label>
              <Input id="name" {...register("name", { required: true })} />
              <Button type="submit" className="mt-2 w-full sm:w-auto">
                Create
              </Button>
            </form>
          )}

          <div>
            <Label htmlFor="section-select">Select Existing Section</Label>
            <Select
              value={selectedSectionId}
              onValueChange={(value) => handleSectionSelect(value)}
            >
              <SelectTrigger className="w-[200px] text-sm">
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
          </div>
        </div>

        {selectedSectionId && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="edit-section-name">Edit Section Name</Label>
              <Input
                id="edit-section-name"
                value={selectedSectionName}
                onChange={(e) => setSelectedSectionName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(isChairman || isSuperAdmin) && (
                <Button onClick={handleSectionRename}>Update</Button>
              )}
              {isSuperAdmin && (
                <Button variant="ghost" onClick={handleSectionDelete}>
                  <Trash2 className="text-red-500" />
                </Button>
              )}
            </div>
          </div>
        )}

        {Array.isArray(users) && users.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.username || "-"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SectionForm
