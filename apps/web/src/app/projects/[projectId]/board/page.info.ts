import { z } from "zod";

export const Route = {
  name: "ProjectsProjectIdBoard",
  params: z.object({
    projectId: z.number(),
  })
};

