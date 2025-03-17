import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PasswordUpdateForm from "@/components/password-update-form";
import { Store, Rating } from "@shared/schema";

type StoreWithRatings = Store & {
  ratings: Rating[];
  averageRating: number;
};

export default function StoreDashboard() {
  const { user, logoutMutation } = useAuth();
  const { data: stores, isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ["/api/owner/stores"],
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery<Rating[]>({
    queryKey: ["/api/ratings"],
    enabled: !!stores,
  });

  if (user?.role !== 'store_owner') {
    return <Redirect to="/" />;
  }

  if (storesLoading || ratingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const storesWithRatings: StoreWithRatings[] = stores?.map(store => {
    const storeRatings = ratings?.filter(r => r.storeId === store.id) || [];
    const totalRating = storeRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = storeRatings.length > 0 ? totalRating / storeRatings.length : 0;

    return {
      ...store,
      ratings: storeRatings,
      averageRating: Number(averageRating.toFixed(1)),
    };
  }) || [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Store Dashboard</h1>
        <Button onClick={() => logoutMutation.mutate()} variant="outline">
          Logout
        </Button>
      </div>

      <Tabs defaultValue="stores">
        <TabsList>
          <TabsTrigger value="stores">My Stores</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="stores">
          {storesWithRatings.map((store) => (
            <Card key={store.id} className="mb-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{store.name}</CardTitle>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-1" />
                  <span className="font-bold">{store.averageRating}</span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {store.ratings.map((rating) => (
                      <TableRow key={rating.id}>
                        <TableCell>{rating.userId}</TableCell>
                        <TableCell>{rating.rating}</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="settings">
          <div className="max-w-md mx-auto">
            <PasswordUpdateForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}