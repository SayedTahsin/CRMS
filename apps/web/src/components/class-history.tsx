import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
            <label htmlFor="overview-select" className="font-medium text-sm">
              Overview of:
            </label>

            <select
              id="overview-select"
              value={overview}
              onChange={(e) => {
                const newOverview = e.target.value as OverviewType
                setOverview(newOverview)
                const newList =
                  newOverview === "section"
                    ? sections
                    : newOverview === "teacher"
                      ? teachers
                      : rooms
                setSelectedId(newList[0]?.id ?? "")
              }}
              className="rounded border bg-background px-2 py-1 text-foreground text-sm"
            >
              <option value="section">Section</option>
              <option value="teacher">Teacher</option>
              <option value="room">Room</option>
            </select>

            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded border bg-background px-2 py-1 text-foreground text-sm"
            >
              {overviewList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ?? item.title ?? "Unnamed"}
                </option>
              ))}
            </select>
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
                                <div className="flex max-w-[200px] flex-col gap-1 text-sm">
                                  {/* Course */}
                                  <select
                                    value={newClassData.courseId}
                                    onChange={(e) =>
                                      setNewClassData((prev) => ({
                                        ...prev,
                                        courseId: e.target.value,
                                      }))
                                    }
                                    className="rounded border bg-background px-2 py-1 text-foreground text-sm"
                                  >
                                    <option value="">Select Course</option>
                                    {courses.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.title}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Teacher */}
                                  <select
                                    value={newClassData.teacherId}
                                    onChange={(e) =>
                                      setNewClassData((prev) => ({
                                        ...prev,
                                        teacherId: e.target.value,
                                      }))
                                    }
                                    className="rounded border bg-background px-2 py-1 text-foreground text-sm"
                                  >
                                    <option value="">Select Teacher</option>
                                    {teachers.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.name}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Room */}
                                  <select
                                    value={newClassData.roomId}
                                    onChange={(e) =>
                                      setNewClassData((prev) => ({
                                        ...prev,
                                        roomId: e.target.value,
                                      }))
                                    }
                                    className="rounded border bg-background px-2 py-1 text-foreground text-sm"
                                  >
                                    <option value="">Select Room</option>
                                    {rooms.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.name}
                                      </option>
                                    ))}
                                  </select>

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
                          delivered: "bg-green-700",
                          rescheduled: "bg-yellow-700",
                          notdelivered: "bg-red-700",
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
                                <select
                                  value={entry.status}
                                  onChange={(e) =>
                                    updateClassHistoryStatus({
                                      id: entry.id,
                                      status: e.target.value as
                                        | "delivered"
                                        | "notdelivered"
                                        | "rescheduled",
                                      sectionId: entry.sectionId,
                                    })
                                  }
                                  className="rounded border bg-background px-2 py-1 text-foreground text-sm"
                                >
                                  <option value="delivered">Delivered</option>
                                  <option value="notdelivered">
                                    Not Delivered
                                  </option>
                                  <option value="rescheduled">
                                    Rescheduled
                                  </option>
                                </select>

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
