import directus from '@/lib/directus'
import { toUseMutation, toUseQuery } from '@/utils/tanstack-query'

export const useProjectsQuery = toUseQuery(
    directus.Projects.query.bind(directus.Projects)
).addQueryKey(['projects'])

export const useProjectsMutation = toUseMutation(
    (v: Parameters<typeof directus.Projects.create>[0]) =>
        directus.Projects.create.bind(directus.Projects)(v)
)

export const useProjectQuery = toUseQuery(
    directus.Project.get.bind(directus.Projects)
)

export const useProjectMutation = toUseMutation(
    (v: Parameters<typeof directus.Project.create>[0]) =>
        directus.Project.create.bind(directus.Projects)(v)
)
