import { z } from "zod";

export const Route = {
  name: "ProjectsProjectIdTeam",
  params: z.object({
    projectId: z.number(),
  })
};

