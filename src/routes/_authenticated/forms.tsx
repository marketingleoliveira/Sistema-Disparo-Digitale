import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/forms')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/forms"!</div>
}
