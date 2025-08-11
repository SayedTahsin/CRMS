import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"
import type { User } from "../store/slices/userSlice"
import { DatePickerWithRange } from "./ui/date-picker-range"

type OverviewType = "section" | "teacher" | "room"

const ClassHistoryTable = ({ user }: { user: User }) => {
  const isSuperAdmin = user.roleName === "SuperAdmin"
  const isCR = user.roleName === "CR"
  const isTeacher = user.roleName === "Teacher"
  const isChairman = user.roleName === "Chairman"
  const canEdit = isSuperAdmin || isCR || isTeacher || isChairman
  const canCreate = isSuperAdmin || isTeacher || isChairman

  const [overview, setOverview] = useState<OverviewType>(
    isTeacher ? "teacher" : "section",
  )

  const { data: teachersResult = { data: [] } } = useQuery(
    trpc.user.getTeachers.queryOptions(),
  )
  const { data: coursesResult = { data: [] } } = useQuery(
    trpc.course.getAll.queryOptions(),
  )
  const { data: roomsResult = { data: [] } } = useQuery(
    trpc.room.getAll.queryOptions(),
  )
  const { data: sections = [] } = useQuery(trpc.section.getAll.queryOptions())
  const { data: slots = [] } = useQuery(trpc.slot.getAll.queryOptions())

  const teachers = teachersResult.data
  const courses = coursesResult.data
  const rooms = roomsResult.data

  const overviewList =
    overview === "section"
      ? sections
      : overview === "teacher"
        ? teachers
        : rooms

  const [selectedId, setSelectedId] = useState(() => {
    if (overview === "teacher") return user.id
    if (overview === "section" && user.sectionId) return user.sectionId
    if (overviewList.length > 0) return overviewList[0].id
    return ""
  })

  const today = new Date()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
  })

  const [editingCell, setEditingCell] = useState<{
    slotId: string
    sectionId: string
    date: string
    mode: "edit" | "create"
  } | null>(null)

  const [newClassData, setNewClassData] = useState<{
    courseId: string
    teacherId: string
    roomId: string
  }>({
    courseId: "",
    teacherId: "",
    roomId: "",
  })

  const from = dateRange?.from
    ? Math.floor(
        Date.UTC(
          dateRange.from.getFullYear(),
          dateRange.from.getMonth(),
          dateRange.from.getDate(),
          0,
          0,
          0,
          0,
        ) / 1000,
      ).toString()
    : undefined

  const to = dateRange?.to
    ? Math.floor(
        Date.UTC(
          dateRange.to.getFullYear(),
          dateRange.to.getMonth(),
          dateRange.to.getDate(),
          23,
          59,
          59,
          999,
        ) / 1000,
      ).toString()
    : undefined

  const {
    data: classHistory = [],
    isLoading,
    isError,
    refetch: refetchHistory,
  } = useQuery({
    ...trpc.classHistory.getByDate.queryOptions({ from, to }),
    enabled: !!from && !!selectedId,
  })

  const filteredHistory = selectedId
    ? classHistory.filter((item) => {
        if (overview === "section") return item.sectionId === selectedId
        if (overview === "teacher") return item.teacherId === selectedId
        if (overview === "room") return item.roomId === selectedId
        return true
      })
    : []

  const cellMap: Record<
    string,
    Array<{
      id: string
      slotId: string
      courseId: string
      teacherId: string
      sectionId: string
      roomId: string
      status: "delivered" | "notdelivered" | "rescheduled"
    }>
  > = {}

  for (const item of filteredHistory) {
    const date = item.date.split("T")[0]
    if (!cellMap[date]) cellMap[date] = []
    cellMap[date].push({
      id: item.id,
      slotId: item.slotId,
      courseId: item.courseId,
      teacherId: item.teacherId,
      sectionId: item.sectionId,
      roomId: item.roomId,
      status: item.status,
    })
  }

  const getName = (
    list: { id: string; name?: string; code?: string; title?: string }[],
    id?: string,
  ) =>
    list.find((x) => x.id === id)?.name ??
    list.find((x) => x.id === id)?.code ??
    list.find((x) => x.id === id)?.title ??
    ""

  const { mutate: updateClassHistoryStatus, isPending: isStatusUpdating } =
    useMutation(
      trpc.classHistory.update.mutationOptions({
        onSuccess: () => {
          toast.success("Status updated")
          setEditingCell(null)
          refetchHistory()
        },
        onError: (err) =>
          toast.error(
            handleErrorMsg(err, { fallbackMessage: "Failed to update status" }),
          ),
      }),
    )

  const { mutate: createClassHistory, isPending: isClassCreating } =
    useMutation(
      trpc.classHistory.create.mutationOptions({
        onSuccess: () => {
          toast.success("Class created")
          setEditingCell(null)
          refetchHistory()
        },
        onError: (err) =>
          toast.error(
            handleErrorMsg(err, { fallbackMessage: "Failed to create class" }),
          ),
      }),
    )

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />

          <div className="flex items-end gap-2">
            <Select
              value={overview}
              onValueChange={(newOverview: OverviewType) => {
                setOverview(newOverview)
                const newList =
                  newOverview === "section"
                    ? sections
                    : newOverview === "teacher"
                      ? teachers
                      : rooms
                setSelectedId(newList[0]?.id ?? "")
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select overview" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="section">Section</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="room">Room</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedId ?? ""}
              onValueChange={(value) => setSelectedId(value)}
            >
              <SelectTrigger className="w-[200px] text-sm">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {overviewList.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name ?? item.title ?? "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isError ? (
          <div className="text-center text-red-500 text-sm">
            Failed to load data.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 py-2">Date / Slot</TableHead>
                  {slots.map((slot) => (
                    <TableHead
                      key={slot.id}
                      className="whitespace-nowrap px-3 py-2"
                    >
                      {slot.startTime} - {slot.endTime}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {!selectedId || isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={slots.length + 1}
                      className="py-3 text-center text-muted-foreground"
                    >
                      {isLoading ? "Loading..." : "Select an item to view data"}
                    </TableCell>
                  </TableRow>
                ) : Object.entries(cellMap).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={slots.length + 1}
                      className="py-3 text-center"
                    >
                      No Data
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(cellMap).map(([date, entries]) => (
                    <TableRow key={date}>
                      <TableCell className="px-3 py-2 font-medium">
                        {date}
                      </TableCell>

                      {slots.map((slot) => {
                        const entry = entries.find((e) => e.slotId === slot.id)

                        const isCreating =
                          !entry &&
                          editingCell?.slotId === slot.id &&
                          editingCell?.sectionId === selectedId &&
                          editingCell?.date === date &&
                          editingCell?.mode === "create"

                        const isEditing =
                          entry &&
                          editingCell?.slotId === slot.id &&
                          editingCell?.sectionId === entry.sectionId &&
                          editingCell?.date === date &&
                          editingCell?.mode === "edit"

                        if (!entry) {
                          return (
                            <TableCell
                              key={slot.id}
                              className="cursor-pointer px-3 py-2 align-top text-muted-foreground text-sm"
                              onDoubleClick={() =>
                                canCreate &&
                                setEditingCell({
                                  slotId: slot.id,
                                  sectionId: selectedId,
                                  date,
                                  mode: "create",
                                })
                              }
                            >
                              {isCreating ? (
                                <div className="flex flex-col gap-1 text-sm">
                                  {/* Course */}
                                  <Select
                                    value={newClassData.courseId}
                                    onValueChange={(value) =>
                                      setNewClassData((prev) => ({
                                        ...prev,
                                        courseId: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-[200px] text-sm">
                                      <SelectValue placeholder="Select Course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {courses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                          {c.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {/* Teacher */}
                                  <Select
                                    value={newClassData.teacherId}
                                    onValueChange={(value) =>
                                      setNewClassData((prev) => ({
                                        ...prev,
                                        teacherId: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-[200px] text-sm">
                                      <SelectValue placeholder="Select Teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {teachers.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                          {t.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {/* Room */}
                                  <Select
                                    value={newClassData.roomId}
                                    onValueChange={(value) =>
                                      setNewClassData((prev) => ({
                                        ...prev,
                                        roomId: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-[200px] text-sm">
                                      <SelectValue placeholder="Select Room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {rooms.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                          {r.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      className="px-2 py-1"
                                      onClick={() => {
                                        if (
                                          newClassData.courseId &&
                                          newClassData.teacherId &&
                                          newClassData.roomId
                                        ) {
                                          createClassHistory({
                                            date,
                                            slotId: slot.id,
                                            sectionId: selectedId,
                                            ...newClassData,
                                          })
                                        } else {
                                          toast.error("All fields are required")
                                        }
                                      }}
                                      disabled={isClassCreating}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="px-2 py-1"
                                      onClick={() => setEditingCell(null)}
                                      disabled={isClassCreating}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          )
                        }

                        const course = getName(courses, entry.courseId)
                        const teacher = getName(teachers, entry.teacherId)
                        const section = getName(sections, entry.sectionId)
                        const room = getName(rooms, entry.roomId)

                        const statusBg: Record<typeof entry.status, string> = {
                          delivered: "bg-emerald-600 dark:bg-emerald-900",
                          rescheduled: "bg-orange-400 dark:bg-orange-700",
                          notdelivered: "bg-rose-400 dark:bg-rose-900",
                        }

                        return (
                          <TableCell
                            key={slot.id}
                            className={`px-3 py-2 text-sm text-white ${statusBg[entry.status]} cursor-pointer`}
                            onDoubleClick={() =>
                              canEdit &&
                              setEditingCell({
                                slotId: slot.id,
                                sectionId: entry.sectionId,
                                date,
                                mode: "edit",
                              })
                            }
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <Select
                                  value={entry.status}
                                  onValueChange={(
                                    value:
                                      | "delivered"
                                      | "notdelivered"
                                      | "rescheduled",
                                  ) =>
                                    updateClassHistoryStatus({
                                      id: entry.id,
                                      status: value,
                                      sectionId: entry.sectionId,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-[150px] text-sm">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="delivered">
                                      Delivered
                                    </SelectItem>
                                    <SelectItem value="notdelivered">
                                      Not Delivered
                                    </SelectItem>
                                    <SelectItem value="rescheduled">
                                      Rescheduled
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setEditingCell(null)}
                                  disabled={isStatusUpdating}
                                >
                                  Close
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div>{course}</div>
                                <div>{teacher}</div>
                                <div>{section}</div>
                                <div>{room}</div>
                              </div>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ClassHistoryTable
