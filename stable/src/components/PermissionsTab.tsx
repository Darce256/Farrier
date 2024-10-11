import { useState, useEffect } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  is_admin: boolean;
}

export function PermissionsTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchProfiles();
  }, []);

  async function fetchCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching current user admin status:", error);
      } else {
        setIsCurrentUserAdmin(data.is_admin);
      }
    }
  }

  async function fetchProfiles() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to load user profiles");
    } finally {
      setLoading(false);
    }
  }

  const handleToggleAdmin = async (
    userId: string,
    currentAdminStatus: boolean
  ) => {
    if (!isCurrentUserAdmin) {
      toast.error("You don't have permission to change admin status.");
      return;
    }

    const newAdminStatus = !currentAdminStatus;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: newAdminStatus })
        .eq("id", userId);

      if (error) throw error;

      setProfiles(
        profiles.map((profile) =>
          profile.id === userId
            ? { ...profile, is_admin: newAdminStatus }
            : profile
        )
      );

      toast.success(`Admin status updated successfully`);
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Failed to update admin status");
    }
  };

  const filteredProfiles = profiles
    .filter((profile) => profile.id !== currentUserId)
    .filter(
      (profile) =>
        profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return <div>Loading profiles...</div>;
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">User Permissions</h2>
      <div className="mb-6 relative">
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
      <div className="grid gap-4">
        {filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex items-center">
              <User className="mr-3 text-gray-500" size={24} />
              <div>
                <h3 className="font-semibold">
                  {profile.name || "Unnamed User"}
                </h3>
                <p className="text-sm text-gray-500">
                  {profile.email || "No email"}
                </p>
              </div>
            </div>
            <div className="flex items-center ml-4">
              <Switch
                id={`admin-status-${profile.id}`}
                checked={profile.is_admin}
                onCheckedChange={() =>
                  handleToggleAdmin(profile.id, profile.is_admin)
                }
                disabled={!isCurrentUserAdmin}
              />
              <Label
                htmlFor={`admin-status-${profile.id}`}
                className="ml-2 whitespace-nowrap"
              >
                {profile.is_admin ? "Admin" : "Standard User"}
              </Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
