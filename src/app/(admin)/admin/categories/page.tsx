"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export default function AdminProjectCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("project_categories")
      .select("*")
      .order("name");
    if (error) console.error("Error fetching categories:", error);
    else setCategories(data || []);
  };

  const addCategory = async () => {
    if (!newCategory.name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("project_categories")
      .insert([newCategory]);
    if (error) console.error("Error adding category:", error);
    else {
      setNewCategory({ name: "", description: "", color: "#3B82F6" });
      fetchCategories();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Project Categories</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Category name"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Description"
            value={newCategory.description}
            onChange={(e) =>
              setNewCategory({ ...newCategory, description: e.target.value })
            }
            className="border rounded px-3 py-2"
          />
          <input
            type="color"
            value={newCategory.color}
            onChange={(e) =>
              setNewCategory({ ...newCategory, color: e.target.value })
            }
            className="border rounded px-3 py-2 h-10"
          />
          <button
            onClick={addCategory}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Category"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">All Categories</h2>
        {categories.length === 0 ? (
          <div className="text-gray-500">No categories found.</div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: cat.color }}
                  ></div>
                  <span className="font-medium">{cat.name}</span>
                  {cat.description && (
                    <span className="text-gray-500 text-sm">
                      {cat.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
