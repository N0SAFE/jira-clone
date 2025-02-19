import { z } from "zod";

export const Route = {
  name: "ProjectsProjectIdSettings",
  params: z.object({
    projectId: z.number(),
  })
};

