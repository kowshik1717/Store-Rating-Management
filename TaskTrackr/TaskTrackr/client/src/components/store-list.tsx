import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Rating } from "@shared/schema";
import { Loader2, MapPin, Star } from "lucide-react";
import RatingForm from "./rating-form";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StoreForm from "./store-form";

interface StoreWithRatings extends Store {
  averageRating: number;
  userRating?: number;
}

interface StoreListProps {
  searchTerm?: string;
  showRatingForm?: boolean;
  showActions?: boolean;
}

export default function StoreList({ searchTerm = "", showRatingForm = false, showActions = false }: StoreListProps) {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<"name" | "rating">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: stores, isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery<Rating[]>({
    queryKey: ["/api/ratings"],
    enabled: !!stores,
  });

  if (storesLoading || ratingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate average ratings and user ratings
  const storesWithRatings: StoreWithRatings[] = stores?.map(store => {
    const storeRatings = ratings?.filter(r => r.storeId === store.id) || [];
    const userRating = ratings?.find(r => r.storeId === store.id && r.userId === user?.id)?.rating;
    const totalRating = storeRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = storeRatings.length > 0 ? totalRating / storeRatings.length : 0;

    return {
      ...store,
      averageRating: Number(averageRating.toFixed(1)),
      userRating,
    };
  }) || [];

  // Filter stores
  const filteredStores = storesWithRatings.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort stores
  const sortedStores = [...filteredStores].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name") {
      return a.name.localeCompare(b.name) * factor;
    } else {
      return (a.averageRating - b.averageRating) * factor;
    }
  });

  return (
    <div className="space-y-4">
      {showActions && <StoreForm />}
      <div className="flex gap-4">
        <Select value={sortBy} onValueChange={(value: "name" | "rating") => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedStores.map((store) => (
          <Card key={store.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="truncate">{store.name}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-1" />
                    <span className="font-bold">{store.averageRating}</span>
                  </div>
                  {store.userRating && (
                    <div className="text-sm text-muted-foreground">
                      Your rating: {store.userRating}
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="truncate">{store.address}</span>
              </div>
              {showRatingForm && <RatingForm storeId={store.id} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}