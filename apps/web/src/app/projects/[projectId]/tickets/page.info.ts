import { z } from "zod";

export const Route = {
  name: "ProjectsProjectIdTickets",
  params: z.object({
    projectId: z.number(),
  })
};

