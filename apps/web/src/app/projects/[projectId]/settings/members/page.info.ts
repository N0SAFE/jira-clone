import { z } from "zod";

export const Route = {
  name: "ProjectsProjectIdSettingsMembers",
  params: z.object({
    projectId: z.string(),
  })
};

