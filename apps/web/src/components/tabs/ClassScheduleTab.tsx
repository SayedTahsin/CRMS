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
import { useState } from "react"
import { toast } from "sonner"

const weekdays = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
]

type WeekDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"

const ClassScheduleTable = () => {
  const [editingCell, setEditingCell] = useState<{
    day: string
    slotId: string
    sectionId: string
  } | null>(null)

  const [editFormData, setEditFormData] = useState<{
    courseId: string
    teacherId: string
    roomId: string
  }>({ courseId: "", teacherId: "", roomId: "" })

  const [isNewSchedule, SetIsNewSchedule] = useState<boolean>(false)

  const { data: courseResult = { data: [], total: 0, hasNext: false } } =
    useQuery({
      ...trpc.course.getAll.queryOptions(),
    })

  const { data: teachersResult = { data: [], total: 0, hasNext: false } } =
    useQuery({
      ...trpc.user.getTeachers.queryOptions(),
    })

  const teachers = teachersResult.data || []
  const courses = courseResult.data || []
  const { data: roomResult = { data: [], total: 0, hasNext: false } } =
    useQuery({
      ...trpc.room.getAll.queryOptions(),
    })
  const rooms = roomResult.data || []

  const { data: sections = [] } = useQuery(trpc.section.getAll.queryOptions())
  const { data: slots = [] } = useQuery(trpc.slot.getAll.queryOptions())
  const { data: schedules = [], refetch } = useQuery(
    trpc.classSchedule.getAll.queryOptions(),
  )

  const { mutate: createSchedule, isPending: isCreating } = useMutation(
    trpc.classSchedule.create.mutationOptions({
      onSuccess: () => {
        toast.success("Schedule created!")
        refetch()
        setEditingCell(null)
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  const { mutate: deleteSchedule, isPending: isDeleting } = useMutation(
    trpc.classSchedule.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Schedule deleted!")
        refetch()
        setEditingCell(null)
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )
  const { mutate: updateSchedule, isPending: isUpdating } = useMutation(
    trpc.classSchedule.update.mutationOptions({
      onSuccess: () => {
        toast.success("Schedule updated!")
        setEditingCell(null)
        refetch()
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  const getScheduleItem = (day: string, slotId: string, sectionId: string) => {
    return schedules.find(
      (s) =>
        s.day.toLowerCase() === day.toLowerCase() &&
        s.slotId === slotId &&
        s.sectionId === sectionId,
    )
  }

  const handleEditStart = (day: string, slotId: string, sectionId: string) => {
    const item = getScheduleItem(day, slotId, sectionId)

    if (!item) SetIsNewSchedule(true)

    setEditingCell({ day, slotId, sectionId })
    setEditFormData({
      courseId: item?.courseId || "",
      teacherId: item?.teacherId || "",
      roomId: item?.roomId || "",
    })
  }

  const handleCellUpdate = () => {
    if (!editingCell) return
    const { day, slotId, sectionId } = editingCell
    if (isNewSchedule) {
      createSchedule({
        day: day.toLowerCase() as WeekDay,
        slotId,
        sectionId,
        courseId: editFormData.courseId,
        teacherId: editFormData.teacherId,
        roomId: editFormData.roomId,
      })
    } else {
      updateSchedule({
        day: day.toLowerCase() as WeekDay,
        slotId,
        sectionId,
        courseId: editFormData.courseId,
        teacherId: editFormData.teacherId,
        roomId: editFormData.roomId,
      })
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        <Label className="font-semibold text-xl">Weekly Routine</Label>

        {weekdays.map((day) => (
          <div key={day}>
            <div className="flex font-bold text-lg">{day.toUpperCase()}</div>
            <div className="flex-1 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap border border-gray-300 px-3 py-2">
                      Slot / Section
                    </TableHead>
                    {sections.map(({ id, name }) => (
                      <TableHead
                        key={id}
                        className="whitespace-nowrap border border-gray-300 px-3 py-2"
                      >
                        {name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {slots.map(({ id: slotId, startTime, endTime }) => (
                    <TableRow key={slotId}>
                      <TableCell className="whitespace-nowrap border border-gray-300 px-3 py-2 font-medium">
                        {startTime} - {endTime}
                      </TableCell>

                      {sections.map(({ id: sectionId }) => {
                        const item = getScheduleItem(day, slotId, sectionId)
                        const isEditing =
                          editingCell?.day === day &&
                          editingCell.slotId === slotId &&
                          editingCell.sectionId === sectionId

                        return (
                          <TableCell
                            key={sectionId}
                            className="cursor-pointer border border-gray-300 px-3 py-2"
                            onDoubleClick={() =>
                              handleEditStart(day, slotId, sectionId)
                            }
                            title={item ? undefined : "Double click to add"}
                          >
                            {isEditing ? (
                              <div className="flex min-w-[200px] flex-col space-y-1">
                                {/* Course */}
                                <Select
                                  value={editFormData.courseId}
                                  onValueChange={(value) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      courseId: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full min-w-[180px] text-sm">
                                    <SelectValue placeholder="Select course" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {courses.map(({ id, title }) => (
                                      <SelectItem key={id} value={id}>
                                        {title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {/* Teacher */}
                                <Select
                                  value={editFormData.teacherId}
                                  onValueChange={(value) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      teacherId: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full min-w-[180px] text-sm">
                                    <SelectValue placeholder="Select teacher" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers?.map(({ id, name }) => (
                                      <SelectItem key={id} value={id}>
                                        {name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {/* Room */}
                                <Select
                                  value={editFormData.roomId}
                                  onValueChange={(value) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      roomId: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full min-w-[180px] text-sm">
                                    <SelectValue placeholder="Select room" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {rooms.map(({ id, name }) => (
                                      <SelectItem key={id} value={id}>
                                        {name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="mt-1 flex min-w-[180px] flex-wrap justify-start gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleCellUpdate}
                                    disabled={isCreating || isUpdating}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingCell(null)
                                      SetIsNewSchedule(false)
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  {!isNewSchedule && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        if (!editingCell) return
                                        deleteSchedule({
                                          day: editingCell.day.toLowerCase() as WeekDay,
                                          slotId: editingCell.slotId,
                                        })
                                      }}
                                      disabled={isDeleting}
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : item ? (
                              <div className="space-y-0.5 whitespace-nowrap text-sm">
                                <div>
                                  {courses.find((c) => c.id === item.courseId)
                                    ?.title ?? "-"}
                                </div>
                                <div>
                                  {teachers.find((t) => t.id === item.teacherId)
                                    ?.name ?? "-"}
                                </div>
                                <div>
                                  {rooms.find((r) => r.id === item.roomId)
                                    ?.name ?? "-"}
                                </div>
                              </div>
                            ) : (
                              <span className="select-none text-muted-foreground text-xs">
                                Double click to add
                              </span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default ClassScheduleTable
