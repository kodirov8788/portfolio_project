"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  FileText,
  MessageSquare,
  Eye,
  Plus,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase/client";

interface DashboardStats {
  totalProjects: number;
  totalBlogPosts: number;
  totalMessages: number;
  unreadMessages: number;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
}

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalBlogPosts: 0,
    totalMessages: 0,
    unreadMessages: 0,
  });
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const [projectsResult, blogPostsResult, messagesResult, unreadResult] =
          await Promise.all([
            supabase
              .from("projects")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("blog_posts")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("contact_messages")
              .select("*", { count: "exact", head: true })
              .eq("deleted", false),
            supabase
              .from("contact_messages")
              .select("*")
              .eq("read", false)
              .eq("deleted", false),
          ]);

        setStats({
          totalProjects: projectsResult.count || 0,
          totalBlogPosts: blogPostsResult.count || 0,
          totalMessages: messagesResult.count || 0,
          unreadMessages: unreadResult.data?.length || 0,
        });

        // Fetch recent messages
        const { data: messages } = await supabase
          .from("contact_messages")
          .select("*")
          .eq("deleted", false)
          .order("created_at", { ascending: false })
          .limit(3);

        setRecentMessages(messages || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const dashboardStats = [
    {
      name: "Total Projects",
      value: stats.totalProjects.toString(),
      change: "+2",
      changeType: "positive",
      icon: FolderOpen,
    },
    {
      name: "Blog Posts",
      value: stats.totalBlogPosts.toString(),
      change: "+5",
      changeType: "positive",
      icon: FileText,
    },
    {
      name: "Messages",
      value: stats.totalMessages.toString(),
      change: `${stats.unreadMessages} unread`,
      changeType: "positive",
      icon: MessageSquare,
    },
    {
      name: "Page Views",
      value: "2,847",
      change: "+18%",
      changeType: "positive",
      icon: Eye,
    },
  ];

  const recentActivity = [
    ...recentMessages.slice(0, 2).map((message) => ({
      id: `message-${message.id}`,
      type: "message",
      title: `New message from ${message.email}`,
      time: new Date(message.created_at).toLocaleDateString(),
    })),
    {
      id: 3,
      type: "blog",
      title: "Blog post published: Next.js 15 Features",
      time: "1 day ago",
    },
    {
      id: 4,
      type: "project",
      title: "Project updated: Task Management App",
      time: "2 days ago",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.email}! Here&apos;s what&apos;s happening with
            your portfolio.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/projects/new">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </Link>
              <Link href="/admin/blogs/new">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </Link>
              <Link href="/admin/messages">
                <Button className="w-full" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Messages
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>
            Key metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <div className="text-sm text-gray-600">Monthly Visitors</div>
              <div className="text-xs text-green-600 mt-1">
                +12% from last month
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">89%</div>
              <div className="text-sm text-gray-600">Bounce Rate</div>
              <div className="text-xs text-red-600 mt-1">
                -3% from last month
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2m 34s</div>
              <div className="text-sm text-gray-600">Avg. Session Duration</div>
              <div className="text-xs text-green-600 mt-1">
                +8% from last month
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
