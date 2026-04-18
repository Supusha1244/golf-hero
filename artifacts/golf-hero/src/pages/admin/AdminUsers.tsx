import { useState } from "react";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const { data, isLoading } = useListUsers(
    { search: debouncedSearch || undefined, limit: 50 },
    { query: { queryKey: getListUsersQueryKey({ search: debouncedSearch || undefined, limit: 50 }) } }
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">User Management</h1>
      <p className="text-muted-foreground mb-8">View and manage registered users.</p>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-9 bg-card border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
              </TableRow>
            ) : data?.users && data.users.length > 0 ? (
              data.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}` : 'No Name'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-primary text-primary-foreground' : ''}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
