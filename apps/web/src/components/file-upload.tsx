import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { handleErrorMsg } from "@/utils/error-msg"
import { trpc } from "@/utils/trpc"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

type FileUploadCellProps = {
  label?: string
  accept?: string
  onUploaded?: (url: string) => void
}

export const FileUploadCell = ({
  label = "Select File",
  accept = "application/pdf,image/png,image/jpeg",
  onUploaded,
}: FileUploadCellProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [ExplicitFileName, setExplicitFileName] = useState<string>("")
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")

  const { data: coursesResult = { data: [] } } = useQuery(
    trpc.course.getAll.queryOptions()
  )

  const uploadFileMutation = useMutation(
    trpc.supabase.uploadFile.mutationOptions({
      onSuccess: (data: { url: string }) => {
        toast.success("File uploaded successfully")
        setPreview(data.url)
        onUploaded?.(data.url)
      },
      onError: (err: unknown) => {
        toast.error(handleErrorMsg(err, { fallbackMessage: "Upload failed" }))
      },
    })
  )

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first")
    if (!selectedCourse) return toast.error("Please select a course")
    const fileName = ExplicitFileName || file.name
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        setUploading(true)
        const base64 = reader.result as string

        await uploadFileMutation.mutateAsync({
          name: fileName,
          type: file.type,
          base64,
          courseName: selectedCourse,
        } as any)
      } catch (err) {
        console.error(err)
      } finally {
        setUploading(false)
      }
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor="fileTitle" className="font-medium text-sm">
            Filename
          </label>
          <Input
            id="fileTitle"
            value={ExplicitFileName}
            onChange={(e) => setExplicitFileName(e.target.value)}
          />
        </div>

        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor="upload" className="font-medium text-sm">
            {label}
          </label>
          <Input
            id="upload"
            type="file"
            accept={accept}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
        </div>

        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor="course-select" className="font-medium text-sm">
            Select Course
          </label>
          <select
            id="course-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded border bg-background px-2 py-2 text-foreground text-sm"
          >
            <option value="" disabled>
              -- Select a course --
            </option>
            <option value="random">Random</option>
            {coursesResult.data.map((course: { id: string; title: string }) => (
              <option key={course.id} value={course.title}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        size="sm"
        onClick={handleUpload}
        disabled={!file || uploading || !selectedCourse}
        className="w-fit"
      >
        {uploading ? "Uploading..." : "Upload"}
      </Button>

      {preview && (
        <a
          href={preview}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 text-xs hover:underline"
        >
          View Uploaded File
        </a>
      )}
    </div>
  )
}
