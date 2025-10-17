"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AddProjectForm } from "@/components/settings/AddProjectForm";

interface Company {
  id: string;
  name: string;
  description: string;
  website?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  projects: Project[];
  projectCount: number;
}

interface Project {
  id: string;
  companyId: string;
  name: string;
  type: string;
  description: string;
  targetAudience?: string;
  goals?: string;
  budgetRange?: string;
  timeline?: string;
  requirements?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function AddProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const companyId = searchParams.get("companyId");

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectMessage, setProjectMessage] = useState<string | null>(null);

  // Load company data
  useEffect(() => {
    if (!companyId) {
        setError("Company ID is required");
        setLoading(false);
        return;
    }

    const loadCompany = async () => {
        try {
          setLoading(true);
          const timestamp = Date.now();
          const response = await fetch(
            `/api/companies?companyId=${companyId}&_t=${timestamp}`
          );

          if (!response.ok) {
            throw new Error("Failed to load company");
          }

          const data = await response.json();

          if (data.success && data.data.length > 0) {
            setCompany(data.data[0]);
          } else {
            throw new Error("Company not found");
          }
        } catch (err) {
          console.error("Error loading company:", err);
          setError(err instanceof Error ? err.message : "Failed to load company");
        } finally {
          setLoading(false);
        }
    };

    loadCompany();
  }, [companyId]);

  const createProject = async (
    companyId: string,
    projectData: Omit<Project, "id" | "companyId" | "createdAt" | "updatedAt">
  ) => {
    if (!companyId) return;

    try {
        setProjectError(null);
        setIsCreatingProject(true);

        // Convert project data to product format with company association
        const productData = {
          name: projectData.name,
          description: projectData.description,
          category: projectData.type,
          targetAudience: projectData.targetAudience,
          keyBenefits: projectData.goals,
          priceRange: projectData.budgetRange,
          messageBody: projectData.requirements,
          companyId: companyId, // Associate project with company
        };

        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to create project");
        }

        setProjectMessage("Project created successfully!");

        // Navigate back to company detail view after successful creation
        setTimeout(() => {
          router.push(`/settings/company/${companyId}`);
        }, 1000);
    } catch (err) {
        console.error("Error creating project:", err);
        setProjectError(
          err instanceof Error ? err.message : "Failed to create project"
        );
    } finally {
        setIsCreatingProject(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-[var(--color-text-secondary)]">
                  {t("settings.loadingCompanyDetails")}
                </p>
              </div>
            </div>
          </div>
        </div>
    );
  }

  if (error || !company) {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    {t("settings.errorLoadingCompany")}
                  </h3>
                  <p className="text-red-600 mb-4">
                    {error || t("settings.companyNotFound")}
                  </p>
                  <button
                    onClick={() => router.push("/settings")}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    {t("settings.backToSettings")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
        <div className="max-w-4xl mx-auto">
          <AddProjectForm
            company={company}
            onCreateProject={createProject}
            isCreating={isCreatingProject}
            error={projectError}
            message={projectMessage}
          />
        </div>
    </div>
  );
}
