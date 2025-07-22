import Loader from "@/components/loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { authGuard } from "@/utils/auth-guard"
import { trpc } from "@/utils/trpc"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ExternalLinkIcon } from "lucide-react"
import { useRef, useState } from "react"

export const Route = createFileRoute("/resources")({
  component: RouteComponent,
  beforeLoad: async () => {
    await authGuard()
  },
})

type ResourceItem = {
  name: string
  path: string
  signedUrl: string | null
  uploadedBy: string
  course: string
  createdAt?: string | null
  size?: number | null
  error?: string | null
}

type ListAllResourcesResponse = {
  data: ResourceItem[]
  total: number
  page: number
  totalPages: number
}

function RouteComponent() {
  const [selectedCourse, setSelectedCourse] = useState<string>("")

  const { data: allResources = { data: [], total: 0 }, isLoading } =
    useQuery<ListAllResourcesResponse>(
      trpc.supabase.listAllResources.queryOptions({
        courseName: selectedCourse || undefined,
        page: 1,
        limit: 100,
      }),
    )

  const initialCourseNamesRef = useRef<string[] | null>(null)

  if (
    initialCourseNamesRef.current === null &&
    selectedCourse === "" &&
    allResources.data.length > 0
  ) {
    initialCourseNamesRef.current = Array.from(
      new Set(allResources.data.map((res) => res.course)),
    ).sort()
  }

  const courseNames = initialCourseNamesRef.current ?? []

  return (
    <div className=" max-full space-y-6 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="course-select" className="font-medium text-sm">
          Filter by Course:
        </label>

        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="rounded border bg-background px-2 py-1 text-foreground text-sm"
        >
          <option value="">All Courses</option>
          {courseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="space-y-4 py-4">
          <h2 className="font-semibold text-lg">All Uploaded Resources</h2>

          {isLoading ? (
            <Loader />
          ) : allResources.data.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No resources found.
            </div>
          ) : (
            <ScrollArea className="max-h-[500px] pr-2">
              <ul className="space-y-2">
                {allResources.data.map((file) => (
                  <li
                    key={file.path}
                    className="flex flex-col gap-1 rounded border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1 truncate">
                      <div className="truncate font-medium">{file.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {file.course}
                      </div>
                    </div>

                    {file.signedUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={file.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLinkIcon className="mr-1 h-4 w-4" />
                          View
                        </a>
                      </Button>
                    ) : (
                      <span className="text-red-500 text-xs">Invalid URL</span>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
