import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/campaigns')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/campaigns"!</div>
}
