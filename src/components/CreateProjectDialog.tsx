import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/integrations/firebase/firestore";
import { toast } from "sonner";
import type { ProjectStatus } from "@/integrations/firebase/types";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  onSuccess: () => void;
}

export const CreateProjectDialog = ({ open, onOpenChange, schoolId, onSuccess }: CreateProjectDialogProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    year: new Date().getFullYear(),
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Create project with Firebase
      await createProject({
        school_id: schoolId,
        title: formData.title,
        year: formData.year,
        description: formData.description,
        status: "draft" as ProjectStatus,
      });

      toast.success("프로젝트가 생성되었습니다! 문항 관리 탭에서 설문 문항을 추가하세요.");

      setFormData({ title: "", year: new Date().getFullYear(), description: "" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Project creation error:", error);
      toast.error("프로젝트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">새 프로젝트 만들기</DialogTitle>
          <DialogDescription>
            학교평가 및 교육계획 수립을 위한 프로젝트를 생성합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">프로젝트 제목 *</Label>
            <Input
              id="title"
              placeholder="예: 2025학년도 학교평가 및 교육계획 수립"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">학년도 *</Label>
            <Input
              id="year"
              type="number"
              min={2020}
              max={2099}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              취소
            </Button>
            <Button type="submit" disabled={isCreating} className="gradient-primary text-white">
              {isCreating ? "생성 중..." : "프로젝트 생성"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
