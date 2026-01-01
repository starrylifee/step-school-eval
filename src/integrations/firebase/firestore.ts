// Firestore helper functions
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    DocumentData,
    QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import type { School, Project, Question, Response, SurveyLink } from './types';

// Collection names
export const COLLECTIONS = {
    SCHOOLS: 'schools',
    PROJECTS: 'projects',
    QUESTIONS: 'questions',
    RESPONSES: 'responses',
    SURVEY_LINKS: 'survey_links',
    EVALUATION_DOMAINS: 'evaluation_domains',
    EVALUATION_AREAS: 'evaluation_areas',
    INDICATORS: 'indicators',
} as const;

// Helper to convert Firestore Timestamp to Date
const convertTimestamp = (data: DocumentData): any => {
    const converted = { ...data };
    for (const key in converted) {
        if (converted[key] instanceof Timestamp) {
            converted[key] = converted[key].toDate();
        }
    }
    return converted;
};

// Schools
export const getSchoolByCode = async (schoolCode: string): Promise<School | null> => {
    const q = query(collection(db, COLLECTIONS.SCHOOLS), where('school_code', '==', schoolCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...convertTimestamp(doc.data()) } as School;
};

// Projects
export const getProjectsBySchoolId = async (schoolId: string): Promise<Project[]> => {
    const q = query(
        collection(db, COLLECTIONS.PROJECTS),
        where('school_id', '==', schoolId),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamp(doc.data()) })) as Project[];
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...convertTimestamp(snapshot.data()) } as Project;
};

export const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
        ...project,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
    });
    return docRef.id;
};

export const updateProject = async (projectId: string, data: Partial<Project>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
    await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now(),
    });
};

// Questions
export const getQuestionsByProjectId = async (
    projectId: string,
    respondentType?: string
): Promise<Question[]> => {
    const constraints: QueryConstraint[] = [
        where('project_id', '==', projectId),
        orderBy('order_index', 'asc'),
    ];
    if (respondentType) {
        constraints.push(where('respondent_type', '==', respondentType));
    }
    const q = query(collection(db, COLLECTIONS.QUESTIONS), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamp(doc.data()) })) as Question[];
};

export const createQuestion = async (question: Omit<Question, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.QUESTIONS), {
        ...question,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
    });
    return docRef.id;
};

export const updateQuestion = async (questionId: string, data: Partial<Question>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.QUESTIONS, questionId);
    await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now(),
    });
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.QUESTIONS, questionId);
    await deleteDoc(docRef);
};

// Responses
export const createResponse = async (response: Omit<Response, 'id' | 'created_at'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.RESPONSES), {
        ...response,
        created_at: Timestamp.now(),
    });
    return docRef.id;
};

export const createResponses = async (responses: Omit<Response, 'id' | 'created_at'>[]): Promise<void> => {
    const promises = responses.map(response =>
        addDoc(collection(db, COLLECTIONS.RESPONSES), {
            ...response,
            created_at: Timestamp.now(),
        })
    );
    await Promise.all(promises);
};

export const getResponsesByProjectId = async (projectId: string): Promise<Response[]> => {
    const q = query(collection(db, COLLECTIONS.RESPONSES), where('project_id', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamp(doc.data()) })) as Response[];
};

// Survey Links
export const getSurveyLinkByCode = async (accessCode: string): Promise<SurveyLink | null> => {
    const q = query(
        collection(db, COLLECTIONS.SURVEY_LINKS),
        where('access_code', '==', accessCode),
        where('is_active', '==', true)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = { id: doc.id, ...convertTimestamp(doc.data()) } as SurveyLink;

    // Check expiration
    if (data.expires_at && data.expires_at < new Date()) {
        return null;
    }
    return data;
};

export const getSurveyLinksByProjectId = async (projectId: string): Promise<SurveyLink[]> => {
    const q = query(collection(db, COLLECTIONS.SURVEY_LINKS), where('project_id', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamp(doc.data()) })) as SurveyLink[];
};

export const createSurveyLink = async (link: Omit<SurveyLink, 'id' | 'created_at'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.SURVEY_LINKS), {
        ...link,
        created_at: Timestamp.now(),
    });
    return docRef.id;
};

// Stats helpers
export const getResponseCountByProjectId = async (projectId: string): Promise<number> => {
    const q = query(collection(db, COLLECTIONS.RESPONSES), where('project_id', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.size;
};

export const getQuestionCountByProjectId = async (projectId: string): Promise<number> => {
    const q = query(collection(db, COLLECTIONS.QUESTIONS), where('project_id', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.size;
};
