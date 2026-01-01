import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Lazy load Gemini AI to avoid initialization timeout
let genAI: any = null;
const getGenAI = async () => {
    if (!genAI) {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        genAI = new GoogleGenerativeAI(
            functions.config().gemini?.api_key || process.env.GEMINI_API_KEY || ""
        );
    }
    return genAI;
};

interface AnalysisResult {
    summary: string;
    themes: string[];
    recommendations: string[];
    wordCloud: { word: string; count: number }[];
    sentiment: {
        positive: number;
        neutral: number;
        negative: number;
    };
}

/**
 * AI 응답 분석 Cloud Function
 * 설문 응답 데이터를 분석하여 요약, 주제, 추천사항 등을 생성합니다.
 */
export const analyzeResponses = functions
    .region("asia-northeast3")
    .runWith({ timeoutSeconds: 120, memory: "512MB" })
    .https.onCall(async (data, context) => {
        const { projectId } = data;

        if (!projectId) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "프로젝트 ID가 필요합니다."
            );
        }

        try {
            // 프로젝트 정보 조회
            const projectDoc = await db.collection("projects").doc(projectId).get();
            if (!projectDoc.exists) {
                throw new functions.https.HttpsError(
                    "not-found",
                    "프로젝트를 찾을 수 없습니다."
                );
            }

            // 응답 데이터 조회
            const responsesSnapshot = await db
                .collection("responses")
                .where("project_id", "==", projectId)
                .get();

            if (responsesSnapshot.empty) {
                throw new functions.https.HttpsError(
                    "not-found",
                    "분석할 응답이 없습니다."
                );
            }

            // 응답 데이터 정리
            const responses = responsesSnapshot.docs.map((doc) => doc.data());
            const textResponses = responses
                .filter((r) => r.text_response)
                .map((r) => r.text_response);
            const ratingResponses = responses
                .filter((r) => r.rating_response !== null)
                .map((r) => r.rating_response);

            // Gemini AI로 분석
            const ai = await getGenAI();
            const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const prompt = `
당신은 학교 평가 설문 분석 전문가입니다. 다음 설문 응답 데이터를 분석해주세요.

## 텍스트 응답 (${textResponses.length}개):
${textResponses.slice(0, 50).join("\n---\n")}

## 분석 요청:
1. 전체 요약 (3-5문장)
2. 주요 주제 5가지 (키워드 형태)
3. 개선 추천사항 3가지
4. 감성 분석 (긍정/중립/부정 비율)
5. 자주 언급되는 단어 TOP 10

JSON 형식으로 응답해주세요:
{
  "summary": "전체 요약 내용",
  "themes": ["주제1", "주제2", "주제3", "주제4", "주제5"],
  "recommendations": ["추천1", "추천2", "추천3"],
  "sentiment": { "positive": 60, "neutral": 30, "negative": 10 },
  "wordCloud": [{"word": "단어", "count": 10}, ...]
}
`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // JSON 파싱
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("AI 응답에서 JSON을 추출할 수 없습니다.");
            }

            const analysis: AnalysisResult = JSON.parse(jsonMatch[0]);

            // 평균 평점 계산
            const averageRating =
                ratingResponses.length > 0
                    ? ratingResponses.reduce((a, b) => a + b, 0) / ratingResponses.length
                    : 0;

            return {
                success: true,
                analysis: {
                    ...analysis,
                    statistics: {
                        totalResponses: responses.length,
                        textResponses: textResponses.length,
                        ratingResponses: ratingResponses.length,
                        averageRating: Math.round(averageRating * 10) / 10,
                    },
                },
            };
        } catch (error) {
            console.error("분석 오류:", error);
            throw new functions.https.HttpsError(
                "internal",
                `분석 중 오류가 발생했습니다: ${error}`
            );
        }
    });

/**
 * 보고서 생성 Cloud Function
 * 설문 결과를 바탕으로 종합 보고서를 생성합니다.
 */
export const generateReport = functions
    .region("asia-northeast3")
    .runWith({ timeoutSeconds: 180, memory: "512MB" })
    .https.onCall(async (data, context) => {
        const { projectId } = data;

        if (!projectId) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "프로젝트 ID가 필요합니다."
            );
        }

        try {
            // 프로젝트 정보 조회
            const projectDoc = await db.collection("projects").doc(projectId).get();
            if (!projectDoc.exists) {
                throw new functions.https.HttpsError(
                    "not-found",
                    "프로젝트를 찾을 수 없습니다."
                );
            }
            const project = projectDoc.data();

            // 학교 정보 조회
            const schoolDoc = await db
                .collection("schools")
                .doc(project?.school_id)
                .get();
            const school = schoolDoc.exists ? schoolDoc.data() : null;

            // 질문 조회
            const questionsSnapshot = await db
                .collection("questions")
                .where("project_id", "==", projectId)
                .get();
            const questions = questionsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // 응답 조회
            const responsesSnapshot = await db
                .collection("responses")
                .where("project_id", "==", projectId)
                .get();
            const responses = responsesSnapshot.docs.map((doc) => doc.data());

            // 응답자 유형별 통계
            const respondentStats: Record<string, number> = {};
            responses.forEach((r) => {
                const type = r.respondent_type || "unknown";
                respondentStats[type] = (respondentStats[type] || 0) + 1;
            });

            // 질문별 평균 평점
            const questionStats = questions.map((q: any) => {
                const qResponses = responses.filter((r) => r.question_id === q.id);
                const ratings = qResponses
                    .filter((r) => r.rating_response !== null)
                    .map((r) => r.rating_response);
                const avgRating =
                    ratings.length > 0
                        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
                        : null;
                return {
                    question: q.question_text,
                    responseCount: qResponses.length,
                    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
                };
            });

            // Gemini AI로 보고서 생성
            const ai = await getGenAI();
            const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const textResponses = responses
                .filter((r) => r.text_response)
                .map((r) => `[${r.respondent_type}] ${r.text_response}`);

            const prompt = `
당신은 학교 평가 보고서 작성 전문가입니다. 다음 데이터를 바탕으로 종합 평가 보고서를 작성해주세요.

## 프로젝트 정보
- 프로젝트명: ${project?.name || "학교 평가"}
- 학교명: ${school?.school_name || "미지정"}
- 총 응답 수: ${responses.length}

## 응답자 유형별 통계
${Object.entries(respondentStats)
                    .map(([type, count]) => `- ${type}: ${count}명`)
                    .join("\n")}

## 질문별 통계
${questionStats
                    .slice(0, 20)
                    .map(
                        (q) =>
                            `- ${q.question}: 응답 ${q.responseCount}개, 평균 ${q.averageRating || "N/A"}점`
                    )
                    .join("\n")}

## 주요 텍스트 응답 (최대 30개)
${textResponses.slice(0, 30).join("\n---\n")}

## 보고서 작성 요청:
다음 섹션을 포함한 종합 평가 보고서를 작성해주세요:
1. 요약 (Executive Summary)
2. 조사 개요
3. 주요 발견사항
4. 영역별 분석
5. 강점과 개선점
6. 제언 및 결론

JSON 형식으로 응답해주세요:
{
  "title": "보고서 제목",
  "sections": [
    {"title": "섹션 제목", "content": "마크다운 형식의 내용"}
  ]
}
`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // JSON 파싱
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("AI 응답에서 JSON을 추출할 수 없습니다.");
            }

            const reportData = JSON.parse(jsonMatch[0]);

            return {
                success: true,
                report: {
                    title: reportData.title || `${school?.school_name || ""} 학교 평가 보고서`,
                    generatedAt: new Date().toISOString(),
                    sections: reportData.sections || [],
                    statistics: {
                        totalResponses: responses.length,
                        averageRating:
                            questionStats
                                .filter((q) => q.averageRating !== null)
                                .reduce((sum, q) => sum + (q.averageRating || 0), 0) /
                            questionStats.filter((q) => q.averageRating !== null).length || 0,
                        completionRate: Math.round(
                            (responses.length / (questions.length * 10)) * 100
                        ),
                    },
                },
            };
        } catch (error) {
            console.error("보고서 생성 오류:", error);
            throw new functions.https.HttpsError(
                "internal",
                `보고서 생성 중 오류가 발생했습니다: ${error}`
            );
        }
    });
