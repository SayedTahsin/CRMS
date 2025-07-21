import { FileUploadCell } from "@/components/file-upload"
import Loader from "@/components/loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { trpc } from "@/utils/trpc"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ExternalLinkIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

function ResourcesTab() {
  const {
    data: files = [],
    isLoading,
    refetch,
  } = useQuery(trpc.supabase.listFiles.queryOptions())

  const [deletingFilePath, setDeletingFilePath] = useState<string | null>(null)

  const deleteFileMutation = useMutation(
    trpc.supabase.deleteFile.mutationOptions({
      onSuccess: () => {
        toast.success("File deleted successfully")
        setDeletingFilePath(null)
        refetch()
      },
      onError: (error: unknown) => {
        toast.error(
          `Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      },
    })
  )

  const handleDelete = (path: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      setDeletingFilePath(path)
      deleteFileMutation.mutate({ path } as any)
    }
  }

  return (
    <div className="max-full space-y-6 p-4">
      <Card>
        <CardContent className="space-y-4 py-4">
          <h2 className="font-semibold text-lg">Upload a new file</h2>
          <FileUploadCell
            accept="application/pdf,image/*"
            onUploaded={(url) => {
              console.log("Uploaded to:", url)
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-4">
          <h2 className="font-semibold text-lg">Your Uploaded Files</h2>

          {isLoading ? (
            <div className="space-y-2">
              <Loader />
            </div>
          ) : Array.isArray(files) && files.length === 0 ? (
            <div className="text-muted-foreground text-sm">No files found.</div>
          ) : (
            Array.isArray(files) && (
              <ScrollArea className="max-h-72 pr-2">
                <ul className="space-y-2">
                  {files.map((file) => (
                    <li
                      key={file.name}
                      className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <div className="flex items-center gap-2">
                        {file.signedUrl ? (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="ml-2"
                          >
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
                          <span className="text-red-500 text-xs">
                            Invalid URL
                          </span>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(file.path)}
                          disabled={deletingFilePath === file.path}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ResourcesTab
