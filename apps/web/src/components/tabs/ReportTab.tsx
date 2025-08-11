import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/utils/trpc"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { Card, CardContent } from "../ui/card"
import { DatePickerWithRange } from "../ui/date-picker-range"

type ReportType = "teacher" | "course" | "section"

const ReportTab = () => {
  const [reportType, setReportType] = useState<ReportType>("teacher")
  const [selectedId, setSelectedId] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const {
    data: teachersResult = { data: [], total: 0, hasNext: false },
    isLoading: isTeachersLoading,
    error: teachersError,
  } = useQuery({
    ...trpc.user.getTeachers.queryOptions(),
  })
  const teachers = teachersResult.data || []

  const {
    data: courseResult = { data: [], total: 0, hasNext: false },
    isLoading: isCoursesLoading,
    error: coursesError,
  } = useQuery({
    ...trpc.course.getAll.queryOptions(),
  })
  const courses = courseResult.data || []

  const {
    data: sections,
    isLoading: isSectionsLoading,
    error: sectionsError,
  } = useQuery(trpc.section.getAll.queryOptions())
  const {
    data: slots = [],
    isLoading: isSlotsLoading,
    error: slotsError,
  } = useQuery(trpc.slot.getAll.queryOptions())

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]))
  const sectionMap = Object.fromEntries(
    sections?.map((s) => [s.id, s.name]) || [],
  )
  const slotMap = Object.fromEntries(
    slots.map((slot) => [slot.id, `${slot.startTime} - ${slot.endTime}`]),
  )

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
    data: reportData = {
      list: [],
      deliveredCount: 0,
      notDeliveredCount: 0,
      rescheduledCount: 0,
    },
    isLoading: isReportLoading,
    error: reportError,
  } = useQuery({
    ...(() => {
      switch (reportType) {
        case "teacher":
          return trpc.classHistory.getByTeacherId.queryOptions({
            teacherId: selectedId,
            from,
            to,
          })
        case "course":
          return trpc.classHistory.getByCourseId.queryOptions({
            courseId: selectedId,
            from,
            to,
          })
        case "section":
          return trpc.classHistory.getBySectionId.queryOptions({
            sectionId: selectedId,
            from,
            to,
          })
        default:
          throw new Error("Invalid report type")
      }
    })(),
    enabled: !!selectedId,
  })

  const isLoadingData =
    isTeachersLoading || isCoursesLoading || isSectionsLoading || isSlotsLoading

  const dependencyError =
    teachersError || coursesError || sectionsError || slotsError

  const placeholderText =
    reportType === "teacher"
      ? "Select teacher"
      : reportType === "course"
        ? "Select course"
        : "Select section"

  const items =
    reportType === "teacher"
      ? teachers
      : reportType === "course"
        ? courses
        : sections

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Report Type Radios */}
        <div className="mb-3 flex flex-wrap gap-6 text-sm">
          {["teacher", "course", "section"].map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="radio"
                name="reportType"
                value={type}
                checked={reportType === type}
                onChange={() => {
                  setReportType(type as ReportType)
                  setSelectedId("")
                }}
                className="accent-primary"
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-[180px] flex-1">
            <Label className="mb-1 block font-medium text-sm">
              Select {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
            </Label>

            {isLoadingData ? (
              <p className="text-muted-foreground text-sm">
                Loading options...
              </p>
            ) : dependencyError ? (
              <p className="text-red-600 text-sm">Failed to load options.</p>
            ) : (
              <Select
                value={selectedId}
                onValueChange={(value) => setSelectedId(value)}
              >
                <SelectTrigger className="w-[350px] text-sm">
                  <SelectValue placeholder={placeholderText} />
                </SelectTrigger>
                <SelectContent>
                  {items?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {"name" in item
                        ? item.name
                        : "title" in item
                          ? item.title
                          : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="min-w-[220px] flex-1">
            <Label className="mb-1 block font-medium text-sm">
              Select Date Range
            </Label>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        {isReportLoading && (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Loading report...
          </p>
        )}
        {reportError && (
          <p className="py-6 text-center text-red-600 text-sm">
            Error loading report: {reportError.message}
          </p>
        )}

        {!isReportLoading && !reportError && reportData.list.length > 0 && (
          <section className="mt-4 space-y-2 text-sm">
            <Label className="font-semibold text-base">Summary Report</Label>
            <div className="flex flex-wrap gap-6">
              {(() => {
                const {
                  deliveredCount,
                  notDeliveredCount,
                  rescheduledCount,
                  list,
                } = reportData
                const total = list.length || 1
                const percent = (count: number) =>
                  ((count / total) * 100).toFixed(1)

                return (
                  <>
                    <div className="text-green-600">
                      Delivered: {deliveredCount} ({percent(deliveredCount)}%)
                    </div>
                    <div className="text-orange-500">
                      Not Delivered: {notDeliveredCount} (
                      {percent(notDeliveredCount)}%)
                    </div>
                    <div className="text-red-600">
                      Rescheduled: {rescheduledCount} (
                      {percent(rescheduledCount)}%)
                    </div>
                  </>
                )
              })()}
            </div>
          </section>
        )}

        {!isReportLoading && !reportError && reportData.list.length > 0 && (
          <div className="mt-4 overflow-hidden rounded border border-input">
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left font-medium">Date</th>
                    <th className="p-2 text-left font-medium">Slot</th>
                    <th className="p-2 text-left font-medium">Status</th>
                    <th className="p-2 text-left font-medium">Course</th>
                    <th className="p-2 text-left font-medium">Section</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.list.map((entry, i) => (
                    <tr
                      key={entry.id ?? i}
                      className="border-t even:bg-muted/50"
                    >
                      <td className="p-2">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {slotMap[entry.slotId] || entry.slotId}
                      </td>
                      <td className="p-2 capitalize">{entry.status}</td>
                      <td className="p-2">
                        {courseMap[entry.courseId] || entry.courseId}
                      </td>
                      <td className="p-2">
                        {sectionMap[entry.sectionId] || entry.sectionId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedId &&
          !isReportLoading &&
          !reportError &&
          reportData.list.length === 0 && (
            <p className="mt-6 text-center text-muted-foreground text-sm">
              No data found.
            </p>
          )}
      </CardContent>
    </Card>
  )
}

export default ReportTab
