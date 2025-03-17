import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RatingFormProps {
  storeId: number;
}

export default function RatingForm({ storeId }: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitRating = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ratings", {
        storeId,
        rating,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                (hover || rating) >= value
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
      <Button
        onClick={() => submitRating.mutate()}
        disabled={!rating || submitRating.isPending}
        className="w-full"
      >
        {submitRating.isPending ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
}
