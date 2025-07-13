"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AdminProjectCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Remove slug state and input field

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_categories")
      .select("id, name, description, color")
      .order("name", { ascending: true });
    if (error) setError(error.message);
    else setCategories(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const { error } = await supabase
      .from("project_categories")
      .insert([{ name, description, color }]);
    if (error) setError(error.message);
    else {
      setSuccess("Category added!");
      setName("");
      setDescription("");
      setColor("#3b82f6");
      fetchCategories();
    }
  };

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Project Categories</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {/* Slug field removed */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 p-0 border-none"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Category
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </form>
      <div>
        <h2 className="text-lg font-semibold mb-2">All Categories</h2>
        {loading ? (
          <div>Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-gray-500">No categories found.</div>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center space-x-3 p-2 border rounded"
              >
                <span
                  className="inline-block w-4 h-4 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-medium">{cat.name}</span>
                <span className="text-gray-500 text-sm">{cat.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
