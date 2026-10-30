import {createFileRoute} from "@tanstack/react-router";
import {handleTrackedClick} from "@/lib/disparo-click-tracking.server";

export const Route = createFileRoute("/track/click")({
  server: {
    handlers: {
      GET: ({request}) => handleTrackedClick(request)
    }
  }
});
