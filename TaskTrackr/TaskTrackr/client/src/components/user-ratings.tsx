import { useQuery } from "@tanstack/react-query";
import { Rating, Store } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface RatingWithStore extends Rating {
  store?: Store;
}

export default function UserRatings() {
  const { data: ratings } = useQuery<Rating[]>({
    queryKey: ["/api/ratings"],
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  if (!ratings?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No ratings yet</p>
        </CardContent>
      </Card>
    );
  }

  const ratingsWithStores: RatingWithStore[] = ratings.map(rating => ({
    ...rating,
    store: stores?.find(store => store.id === rating.storeId)
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Ratings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ratingsWithStores.map((rating) => (
          <Card key={rating.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{rating.store?.name || `Store #${rating.storeId}`}</span>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-1" />
                  <span className="font-bold">{rating.rating}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rating.store && (
                <p className="text-sm text-muted-foreground truncate">
                  {rating.store.address}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}