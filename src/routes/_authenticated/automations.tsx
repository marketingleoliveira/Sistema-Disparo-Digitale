import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/automations')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/automations"!</div>
}
