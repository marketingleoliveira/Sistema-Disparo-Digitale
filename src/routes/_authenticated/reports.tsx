import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/reports"!</div>
}
