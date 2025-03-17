import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import StoreList from "@/components/store-list";
import { Input } from "@/components/ui/input";
import PasswordUpdateForm from "@/components/password-update-form";
import UserRatings from "@/components/user-ratings";
import { useState } from "react";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UserDashboard() {
  const { user, logoutMutation } = useAuth();
  const [search, setSearch] = useState("");

  if (user?.role !== 'user') {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <Button onClick={() => logoutMutation.mutate()} variant="outline">
          Logout
        </Button>
      </div>

      <Tabs defaultValue="stores">
        <TabsList>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="ratings">My Ratings</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="stores">
          <div className="space-y-4">
            <Input
              placeholder="Search stores by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <StoreList searchTerm={search} showRatingForm />
          </div>
        </TabsContent>
        <TabsContent value="ratings">
          <UserRatings />
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