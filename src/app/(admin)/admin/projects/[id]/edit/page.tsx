"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    github_url: "",
    live_url: "",
    featured: false,
    technologies: [] as string[],
    category_id: null,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchProject();
    fetchCategories();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) setError(error.message);
    else setFormData({ ...data, technologies: data.technologies || [] });
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("project_categories")
      .select("id, name");
    if (!error) setCategories(data || []);
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTechChange = (i: number, value: string) => {
    setFormData((prev) => {
      const techs = [...prev.technologies];
      techs[i] = value;
      return { ...prev, technologies: techs };
    });
  };

  const addTech = () => {
    setFormData((prev) => ({
      ...prev,
      technologies: [...prev.technologies, ""],
    }));
  };

  const removeTech = (i: number) => {
    setFormData((prev) => {
      const techs = [...prev.technologies];
      techs.splice(i, 1);
      return { ...prev, technologies: techs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const { error } = await supabase
      .from("projects")
      .update({
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        github_url: formData.github_url,
        live_url: formData.live_url,
        featured: formData.featured,
        technologies: formData.technologies,
        category_id: formData.category_id,
      })
      .eq("id", id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setSuccess("Project updated!");
      setTimeout(() => router.push("/admin/projects"), 1200);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Image URL</label>
          <input
            className="w-full border rounded px-3 py-2"
            name="image_url"
            value={formData.image_url || ""}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">GitHub URL</label>
          <input
            className="w-full border rounded px-3 py-2"
            name="github_url"
            value={formData.github_url || ""}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Live URL</label>
          <input
            className="w-full border rounded px-3 py-2"
            name="live_url"
            value={formData.live_url || ""}
            onChange={handleChange}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="featured"
            checked={formData.featured}
            onChange={handleChange}
            id="featured"
          />
          <label htmlFor="featured">Featured</label>
        </div>
        <div>
          <label className="block font-medium mb-1">Technologies</label>
          {formData.technologies.map((tech, i) => (
            <div key={i} className="flex items-center mb-1">
              <input
                className="w-full border rounded px-3 py-2"
                value={tech}
                onChange={(e) => handleTechChange(i, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeTech(i)}
                className="ml-2 text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTech}
            className="mt-2 text-blue-600"
          >
            Add Technology
          </button>
        </div>
        <div>
          <label className="block font-medium mb-1">Category</label>
          <select
            className="w-full border rounded px-3 py-2"
            name="category_id"
            value={formData.category_id || ""}
            onChange={handleChange}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </form>
    </main>
  );
}
