"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CompanyDetailView } from "@/components/settings/CompanyDetailView";
import { EditProjectForm } from "@/components/settings/EditProjectForm";

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

type ViewMode = "company-detail" | "edit-project";

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const companyId = params.companyId as string;

  const [viewMode, setViewMode] = useState<ViewMode>("company-detail");
  const [company, setCompany] = useState<Company | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Project state
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectMessage, setProjectMessage] = useState<string | null>(null);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

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
            `/api/companies?companyId=${companyId}&_t=${timestamp}`,
            {
              headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to load companies");
          }

          const data = await response.json();

          if (data.success && data.data && data.data.length > 0) {
            // When companyId is provided, API returns the specific company directly
            const rawCompany = data.data[0];

            // Transform the data to match the expected interface
            const company: Company = {
              ...rawCompany,
              projects: rawCompany.products || [], // Map products to projects
              projectCount: rawCompany._count?.products || 0, // Map _count.products to projectCount
            };

            if (company && company.id === companyId) {
              setCompany(company);
            } else {
              throw new Error("Company not found");
            }
          } else {
            throw new Error("Failed to load company data");
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

  const loadCompaniesData = useCallback(async () => {
    try {
        const timestamp = Date.now();
        const response = await fetch(
          `/api/companies?companyId=${companyId}&_t=${timestamp}`,
          {
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load companies");
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          // When companyId is provided, API returns the specific company directly
          const rawCompany = data.data[0];

          // Transform the data to match the expected interface
          const company: Company = {
            ...rawCompany,
            projects: rawCompany.products || [], // Map products to projects
            projectCount: rawCompany._count?.products || 0, // Map _count.products to projectCount
          };

          if (company && company.id === companyId) {
            setCompany(company);
          }
        }
    } catch (err) {
        console.error("Error refreshing company data:", err);
    }
  }, [companyId]);

  const navigateToCompanyList = () => {
    router.push("/settings");
  };

  const navigateToAddProject = () => {
    router.push(`/settings/add-project?companyId=${companyId}`);
  };

  const navigateToEditProject = (projectId: string) => {
    setEditingProject(projectId);
    setViewMode("edit-project");
  };

  const navigateToCompanyDetail = () => {
    setViewMode("company-detail");
    setEditingProject(null);
  };

  const updateProject = async (
    projectId: string,
    projectData: Partial<
        Omit<Project, "id" | "companyId" | "createdAt" | "updatedAt">
    >
  ) => {
    if (!companyId || !projectId) return;

    try {
        setProjectError(null);
        setIsUpdatingProject(true);

        // Convert project data to product format
        const productData = {
          name: projectData.name,
          description: projectData.description,
          category: projectData.type,
          targetAudience: projectData.targetAudience,
          keyBenefits: projectData.goals,
          priceRange: projectData.budgetRange,
          messageBody: projectData.requirements,
        };

        const response = await fetch(`/api/products/${projectId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to update project");
        }

        setProjectMessage("Project updated successfully!");

        // Refresh data and navigate back
        await loadCompaniesData();
        setTimeout(() => {
          setViewMode("company-detail");
          setEditingProject(null);
        }, 1000);
    } catch (err) {
        console.error("Error updating project:", err);
        setProjectError(
          err instanceof Error ? err.message : "Failed to update project"
        );
    } finally {
        setIsUpdatingProject(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!projectId) return;

    try {
        const response = await fetch(`/api/products/${projectId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to delete project");
        }

        // Refresh data
        await loadCompaniesData();
    } catch (err) {
        console.error("Error deleting project:", err);
        setProjectError(
          err instanceof Error ? err.message : "Failed to delete project"
        );
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

  if (viewMode === "edit-project" && editingProject) {
    const projectToEdit = company.projects.find((p) => p.id === editingProject);
    if (!projectToEdit) {
        return (
          <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                      {t("settings.projectNotFound")}
                    </h3>
                    <p className="text-red-600 mb-4">
                      {t("settings.theProjectCouldNotBeFound")}
                    </p>
                    <button
                      onClick={() => navigateToCompanyDetail()}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      {t("settings.backToCompany")}
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
            <EditProjectForm
              company={company}
              projectId={editingProject}
              onCancel={navigateToCompanyDetail}
              onUpdateProject={updateProject}
              isUpdating={isUpdatingProject}
              error={projectError}
              message={projectMessage}
            />
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
        <div className="max-w-7xl mx-auto">
          <CompanyDetailView
            company={{
              ...company,
              projects: company?.projects || [], // Ensure projects is always an array
            }}
            onNavigateToCompanyList={navigateToCompanyList}
            onNavigateToEditCompany={() => {
              // Could implement company editing here
              console.log("Edit company functionality not implemented yet");
            }}
            onNavigateToAddProject={navigateToAddProject}
            onNavigateToEditProject={navigateToEditProject}
            onDeleteProject={deleteProject}
          />
        </div>
    </div>
  );
}
