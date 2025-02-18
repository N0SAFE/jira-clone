import { z } from "zod";

export const Route = {
  name: "ProjectsProjectId",
  params: z.object({
    projectId: z.number(),
  })
};

