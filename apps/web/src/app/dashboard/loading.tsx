import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex flex-col space-y-0.5">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-4 w-[250px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-[120px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[50px] mb-1" />
              <Skeleton className="h-4 w-[100px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-[60%]" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[80px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-[40%]" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}