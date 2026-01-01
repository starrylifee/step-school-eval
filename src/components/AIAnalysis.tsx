import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, Lightbulb, Tag, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/integrations/firebase/config";

interface WordCloudItem {
  text: string;
  value: number;
}

interface AnalysisResult {
  wordCloud: WordCloudItem[];
  summary: string;
  themes: string[];
  positives: string[];
  negatives: string[];
  recommendations: string[];
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  statistics?: {
    totalResponses: number;
    textResponses: number;
    ratingResponses: number;
    averageRating: number;
  };
}

interface AIAnalysisProps {
  projectId: string;
}

export const AIAnalysis = ({ projectId }: AIAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions(app, "asia-northeast3");
      const analyzeResponses = httpsCallable(functions, "analyzeResponses");

      const result = await analyzeResponses({ projectId });
      const data = result.data as any;

      if (data.success && data.analysis) {
        // Transform the response to match the component's expected format
        const analysisData = data.analysis;
        setAnalysis({
          wordCloud: (analysisData.wordCloud || []).map((w: any) => ({
            text: w.word || w.text,
            value: w.count || w.value,
          })),
          summary: analysisData.summary || "",
          themes: analysisData.themes || [],
          positives: [], // Extract from sentiment if available
          negatives: [],
          recommendations: analysisData.recommendations || [],
          sentiment: analysisData.sentiment,
          statistics: analysisData.statistics,
        });
        toast.success("AI 분석이 완료되었습니다!");
      } else {
        throw new Error("분석 결과를 받지 못했습니다.");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      const errorMessage = err.message || "AI 분석 중 오류가 발생했습니다.";
      setError(errorMessage);

      // If Firebase Functions is not available, show demo data
      if (errorMessage.includes("not-found") || errorMessage.includes("permission-denied") || errorMessage.includes("unauthenticated")) {
        toast.error("Firebase Functions가 아직 배포되지 않았습니다. 데모 데이터를 표시합니다.");
        setAnalysis({
          wordCloud: [
            { text: "교육과정", value: 15 },
            { text: "학생지도", value: 12 },
            { text: "소통", value: 10 },
            { text: "행정업무", value: 8 },
            { text: "연수", value: 7 },
          ],
          summary: "Firebase Cloud Functions 배포 후 실제 AI 분석이 작동합니다. 현재는 데모 데이터입니다.",
          themes: ["교육과정 운영", "학생 생활지도", "교원 역량강화"],
          positives: ["학교 문화 개선", "협력적 분위기"],
          negatives: ["행정업무 과다", "시설 노후화"],
          recommendations: ["행정업무 경감 방안 마련", "시설 현대화 추진"],
          sentiment: { positive: 60, neutral: 30, negative: 10 },
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getWordSize = (value: number, maxValue: number) => {
    const minSize = 12;
    const maxSize = 36;
    return Math.max(minSize, (value / maxValue) * maxSize);
  };

  const getWordColor = (index: number) => {
    const colors = [
      "text-primary",
      "text-chart-1",
      "text-chart-2",
      "text-chart-3",
      "text-chart-4",
      "text-chart-5",
    ];
    return colors[index % colors.length];
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI 응답 분석
          </CardTitle>
          <CardDescription>
            텍스트 응답을 AI가 분석하여 주요 키워드, 테마, 개선 제안을 제공합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>분석 오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={runAnalysis}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI 분석 시작
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const maxWordValue = Math.max(...analysis.wordCloud.map(w => w.value), 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            분석 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{analysis.summary}</p>

          {/* Statistics */}
          {analysis.statistics && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{analysis.statistics.totalResponses}</div>
                <div className="text-xs text-muted-foreground">총 응답</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{analysis.statistics.textResponses}</div>
                <div className="text-xs text-muted-foreground">텍스트 응답</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{analysis.statistics.averageRating}</div>
                <div className="text-xs text-muted-foreground">평균 평점</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{analysis.statistics.ratingResponses}</div>
                <div className="text-xs text-muted-foreground">평점 응답</div>
              </div>
            </div>
          )}

          {/* Sentiment */}
          {analysis.sentiment && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">감성 분석</h4>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">{analysis.sentiment.positive}%</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Minus className="w-3 h-3 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{analysis.sentiment.neutral}%</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-400">{analysis.sentiment.negative}%</span>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            disabled={loading}
            className="mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "다시 분석"}
          </Button>
        </CardContent>
      </Card>

      {/* Word Cloud */}
      {analysis.wordCloud.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              키워드 클라우드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 justify-center p-4">
              {analysis.wordCloud.map((word, index) => (
                <span
                  key={word.text}
                  className={`${getWordColor(index)} font-medium hover:opacity-80 transition-opacity cursor-default`}
                  style={{ fontSize: `${getWordSize(word.value, maxWordValue)}px` }}
                  title={`${word.text}: ${word.value}회`}
                >
                  {word.text}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes */}
      {analysis.themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>주요 테마</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.themes.map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positives & Negatives */}
      <div className="grid md:grid-cols-2 gap-4">
        {analysis.positives?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <ThumbsUp className="w-5 h-5" />
                긍정적 의견
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.positives.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-success mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.negatives?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ThumbsDown className="w-5 h-5" />
                개선 필요 사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.negatives.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-chart-4">
              <Lightbulb className="w-5 h-5" />
              AI 추천 개선방안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((item, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-chart-4/20 text-chart-4 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
