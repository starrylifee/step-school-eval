import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Copy, Check, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/integrations/firebase/config";

interface ReportSection {
  id: string;
  title: string;
  content: string;
}

interface ReportData {
  title: string;
  sections: ReportSection[];
  metadata?: {
    schoolName: string;
    year: number;
    projectTitle: string;
    generatedAt: string;
    stats: {
      totalResponses: number;
      byType: Record<string, number>;
      ratingAvg: Record<string, { avg: number; count: number }>;
    };
  };
}

interface ReportGeneratorProps {
  projectId: string;
}

export const ReportGenerator = ({ projectId }: ReportGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions(app, "asia-northeast3");
      const generateReportFn = httpsCallable(functions, "generateReport");

      const result = await generateReportFn({ projectId });
      const data = result.data as any;

      if (data.success && data.report) {
        const reportData = data.report;
        const schoolName = sessionStorage.getItem("school_name") || "학교";

        setReport({
          title: reportData.title || `${schoolName} 학교평가 보고서`,
          sections: (reportData.sections || []).map((s: any, index: number) => ({
            id: String(index + 1),
            title: s.title,
            content: s.content,
          })),
          metadata: {
            schoolName: schoolName,
            year: new Date().getFullYear(),
            projectTitle: "학교평가",
            generatedAt: reportData.generatedAt || new Date().toISOString(),
            stats: {
              totalResponses: reportData.statistics?.totalResponses || 0,
              byType: { teacher: 0, staff: 0, parent: 0, student: 0 },
              ratingAvg: {},
            },
          },
        });
        toast.success("보고서가 생성되었습니다!");
      } else {
        throw new Error("보고서 결과를 받지 못했습니다.");
      }
    } catch (err: any) {
      console.error("Report generation error:", err);
      const errorMessage = err.message || "보고서 생성 중 오류가 발생했습니다.";
      setError(errorMessage);

      // If Firebase Functions is not available, show demo data
      if (errorMessage.includes("not-found") || errorMessage.includes("permission-denied") || errorMessage.includes("unauthenticated")) {
        toast.error("Firebase Functions가 아직 배포되지 않았습니다. 데모 보고서를 표시합니다.");
        const schoolName = sessionStorage.getItem("school_name") || "테스트 학교";

        setReport({
          title: `${schoolName} 학교평가 보고서`,
          sections: [
            {
              id: "1",
              title: "1. 요약 (Executive Summary)",
              content:
                "본 보고서는 학교 평가를 위해 실시된 설문조사 결과를 종합적으로 분석한 것입니다. Firebase Cloud Functions 배포 후 실제 데이터 기반의 보고서가 생성됩니다.",
            },
            {
              id: "2",
              title: "2. 조사 개요",
              content:
                "조사 기간: 2025년\n조사 대상: 교원, 학부모, 학생\n조사 방법: 온라인 설문\n\n상세 응답 통계는 Functions 배포 후 확인 가능합니다.",
            },
            {
              id: "3",
              title: "3. 주요 발견사항",
              content:
                "설문조사 결과 분석을 통해 도출된 주요 발견사항입니다. AI 분석을 통해 주요 키워드, 긍정/부정 의견, 개선 필요사항 등이 자동으로 추출됩니다.",
            },
            {
              id: "4",
              title: "4. 영역별 분석",
              content:
                "교육과정, 학생생활지도, 교원역량, 학교운영 등 각 영역별 상세 분석 결과가 포함됩니다.",
            },
            {
              id: "5",
              title: "5. 강점과 개선점",
              content:
                "학교의 강점:\n- 교육과정 운영의 전문성\n- 학생 중심 교육 활동\n\n개선 필요 사항:\n- 행정업무 경감\n- 시설 현대화",
            },
            {
              id: "6",
              title: "6. 제언 및 결론",
              content:
                "설문 결과를 바탕으로 한 종합적인 제언과 향후 발전 방향을 제시합니다. Firebase Functions 배포 후 AI가 생성한 맞춤형 제언이 포함됩니다.",
            },
          ],
          metadata: {
            schoolName: schoolName,
            year: 2025,
            projectTitle: "학교평가",
            generatedAt: new Date().toISOString(),
            stats: {
              totalResponses: 0,
              byType: { teacher: 0, staff: 0, parent: 0, student: 0 },
              ratingAvg: {},
            },
          },
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const copySection = async (section: ReportSection) => {
    const text = `${section.title}\n\n${section.content}`;
    await navigator.clipboard.writeText(text);
    setCopiedSection(section.id);
    toast.success(`"${section.title}" 섹션이 복사되었습니다.`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAllReport = async () => {
    if (!report) return;

    const fullText = [
      report.title,
      "",
      `생성일: ${new Date(report.metadata?.generatedAt || "").toLocaleDateString("ko-KR")}`,
      `학교: ${report.metadata?.schoolName}`,
      `평가년도: ${report.metadata?.year}년`,
      "",
      "=".repeat(50),
      "",
      ...report.sections.map((s) => `${s.title}\n\n${s.content}\n`),
    ].join("\n");

    await navigator.clipboard.writeText(fullText);
    toast.success("전체 보고서가 복사되었습니다.");
  };

  const downloadAsText = () => {
    if (!report) return;

    const fullText = [
      report.title,
      "",
      `생성일: ${new Date(report.metadata?.generatedAt || "").toLocaleDateString("ko-KR")}`,
      `학교: ${report.metadata?.schoolName}`,
      `평가년도: ${report.metadata?.year}년`,
      "",
      "=".repeat(50),
      "",
      ...report.sections.map((s) => `${s.title}\n\n${s.content}\n\n`),
    ].join("\n");

    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.metadata?.schoolName || "학교"}_${report.metadata?.year || ""}년_평가보고서.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("보고서가 다운로드되었습니다.");
  };

  const downloadAsMarkdown = () => {
    if (!report) return;

    const markdown = [
      `# ${report.title}`,
      "",
      `> **생성일:** ${new Date(report.metadata?.generatedAt || "").toLocaleDateString("ko-KR")}`,
      `> **학교:** ${report.metadata?.schoolName}`,
      `> **평가년도:** ${report.metadata?.year}년`,
      "",
      "---",
      "",
      ...report.sections.map((s) => `## ${s.title}\n\n${s.content}\n`),
    ].join("\n");

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.metadata?.schoolName || "학교"}_${report.metadata?.year || ""}년_평가보고서.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("마크다운 보고서가 다운로드되었습니다.");
  };

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            보고서 생성
          </CardTitle>
          <CardDescription>
            설문 결과를 바탕으로 AI가 학교 평가 보고서를 자동 생성합니다. 각 섹션을 개별적으로 복사하거나 전체 보고서를 다운로드할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>생성 오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={generateReport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 보고서 생성 중...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                AI 보고서 생성
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>
                {report.metadata?.schoolName} · {report.metadata?.year}년 · 총{" "}
                {report.metadata?.stats?.totalResponses}건 응답
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={copyAllReport}>
                <Copy className="w-4 h-4 mr-2" />
                전체 복사
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAsText}>
                <Download className="w-4 h-4 mr-2" />
                TXT
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAsMarkdown}>
                <Download className="w-4 h-4 mr-2" />
                MD
              </Button>
              <Button variant="outline" size="sm" onClick={generateReport} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "다시 생성"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sections */}
      {report.sections.map((section) => (
        <Card key={section.id} className="relative group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copySection(section)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedSection === section.id ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-success" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    복사
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground">
              {section.content.split("\n").map(
                (paragraph, idx) =>
                  paragraph.trim() && (
                    <p key={idx} className="mb-3 text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  )
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Statistics Summary */}
      {report.metadata?.stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">응답 통계 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">대상별 응답</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {Object.entries(report.metadata.stats.byType).map(([type, count]) => (
                    <li key={type} className="flex justify-between">
                      <span>
                        {type === "teacher"
                          ? "교원"
                          : type === "staff"
                            ? "직원"
                            : type === "parent"
                              ? "학부모"
                              : "학생"}
                      </span>
                      <span className="font-medium">{count}건</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">영역별 평균</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {Object.entries(report.metadata.stats.ratingAvg).map(([area, data]) => (
                    <li key={area} className="flex justify-between">
                      <span>{area}</span>
                      <span className="font-medium">{data.avg}점</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
