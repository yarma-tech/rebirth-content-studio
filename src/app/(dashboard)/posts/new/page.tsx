import { PostEditor } from "@/components/post-editor"

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau post</h1>
        <p className="text-muted-foreground mt-1">
          Crée un nouveau post LinkedIn, assisté par l&apos;IA.
        </p>
      </div>
      <PostEditor mode="create" />
    </div>
  )
}
