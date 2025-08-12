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
import { useDebounce } from "@uidotdev/usehooks"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

type Course = {
  id: string
  code: string
  title: string
  credits: number
}
type AdminTabProps = {
  userRoleName: string
}

const PAGE_LIMIT = 10

const CourseForm = ({ userRoleName }: AdminTabProps) => {
  const isSuperAdmin = userRoleName === "SuperAdmin"
  const isChairman = userRoleName === "Chairman"

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [creditFilter, setCreditFilter] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      code: "",
      title: "",
      credits: 1,
    },
  })

  const queryInput = {
    page,
    limit: PAGE_LIMIT,
  }

  const getCoursesQuery = () => {
    if (debouncedSearchTerm && creditFilter !== null) {
      return trpc.course.searchByCredits.queryOptions({
        q: debouncedSearchTerm,
        credits: creditFilter,
        ...queryInput,
      })
    }
    if (debouncedSearchTerm) {
      return trpc.course.search.queryOptions({
        q: debouncedSearchTerm,
        ...queryInput,
      })
    }
    if (creditFilter !== null) {
      return trpc.course.filterByCredits.queryOptions({
        credits: creditFilter,
        ...queryInput,
      })
    }
    return trpc.course.getAll.queryOptions(queryInput)
  }

  const {
    data: courseResult = { data: [], total: 0, hasNext: false },
    refetch,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...getCoursesQuery(),
  })
  const courses = courseResult.data || []
  const hasNext = courseResult.hasNext || false

  const createCourse = useMutation(
    trpc.course.create.mutationOptions({
      onSuccess: () => {
        toast.success("Course created!")
        reset()
        setPage(1)
        refetch()
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  const updateCourse = useMutation(
    trpc.course.update.mutationOptions({
      onSuccess: () => {
        toast.success("Course updated!")
        refetch()
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  const deleteCourse = useMutation(
    trpc.course.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Course deleted.")
        refetch()
      },
      onError: (err) => toast.error(handleErrorMsg(err)),
    }),
  )

  const [editingCell, setEditingCell] = useState<{
    id: string
    field: "code" | "title" | "credits"
  } | null>(null)

  const [editValue, setEditValue] = useState("")

  const onSubmit = handleSubmit((data) => {
    createCourse.mutate({
      code: data.code,
      title: data.title,
      credits: Number(data.credits),
    })
  })

  const handleDoubleClick = (
    course: Course,
    field: "code" | "title" | "credits",
  ) => {
    if (!isChairman && !isSuperAdmin) return

    setEditingCell({ id: course.id, field })
    setEditValue(course[field]?.toString() ?? "")
  }

  const handleEditBlur = () => {
    if (editingCell && editValue.trim() !== "") {
      const payload = {
        id: editingCell.id,
        [editingCell.field]:
          editingCell.field === "credits" ? Number(editValue) : editValue,
      }
      updateCourse.mutate(payload)
    }
    setEditingCell(null)
    setEditValue("")
  }

  const handleCreditFilterChange = (value: string) => {
    if (value === "") {
      setCreditFilter(null)
      setPage(1)
    } else {
      setCreditFilter(Number(value))
      setPage(1)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1)
  }
  const handleNextPage = () => {
    if (hasNext) setPage(page + 1)
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        {(isChairman || isSuperAdmin) && (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Label htmlFor="code">Course Code</Label>
                <Input id="code" {...register("code", { required: true })} />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title", { required: true })} />
              </div>
              <div>
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  min={1}
                  {...register("credits", {
                    required: true,
                    valueAsNumber: true,
                    min: 1,
                  })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-fit">
              Create Course
            </Button>
          </form>
        )}

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
          <Select
            value={creditFilter !== null ? creditFilter.toString() : "all"}
            onValueChange={(value) => {
              if (value === "all") {
                handleCreditFilterChange("")
              } else {
                handleCreditFilterChange(value)
              }
            }}
          >
            <SelectTrigger className="w-[250px] text-sm">
              <SelectValue placeholder="All Credits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Credits</SelectItem>
              {[1, 2, 3, 4].map((c) => (
                <SelectItem key={c} value={c.toString()}>
                  {c} Credit{c > 1 && "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Credits</TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            {isLoading && (
              <div className="py-4 text-center text-sm">Loading courses...</div>
            )}
            {isError && (
              <div className="py-4 text-center text-red-500 text-sm">
                Error loading courses: {error?.message}
              </div>
            )}

            {!isLoading && !isError && (
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    {["code", "title", "credits"].map((field) => (
                      <TableCell
                        key={field}
                        onDoubleClick={() =>
                          handleDoubleClick(
                            course,
                            field as "code" | "title" | "credits",
                          )
                        }
                        className="cursor-pointer text-sm"
                      >
                        {editingCell?.id === course.id &&
                        editingCell.field === field ? (
                          <Input
                            type={field === "credits" ? "number" : "text"}
                            value={editValue}
                            min={field === "credits" ? 1 : undefined}
                            autoFocus
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditBlur}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur()
                            }}
                            className="text-sm"
                          />
                        ) : (
                          course[field as keyof typeof course]
                        )}
                      </TableCell>
                    ))}

                    {isSuperAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCourse.mutate({ id: course.id })}
                        >
                          <Trash2 className="text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {courses.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isSuperAdmin ? 4 : 3}
                      className="text-center text-muted-foreground text-sm"
                    >
                      No courses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <Button size="sm" disabled={page === 1} onClick={handlePreviousPage}>
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm">Page</span>
            <Input
              type="number"
              min={1}
              value={page}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (val > 0) setPage(val)
              }}
              className="w-14 text-center text-sm"
            />
          </div>
          <Button
            size="sm"
            disabled={courses.length === 0 || !hasNext}
            onClick={handleNextPage}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CourseForm
