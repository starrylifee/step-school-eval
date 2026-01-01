// TypeScript types for Firebase collections (mirroring Supabase schema)

export type ProjectStatus = 'draft' | 'active' | 'closed' | 'archived';
export type RespondentType = 'teacher' | 'staff' | 'parent' | 'student';
export type QuestionType = 'rating' | 'multiple_choice' | 'text' | 'priority';
export type UserRoleType = 'admin' | 'manager' | 'viewer';

export interface School {
    id: string;
    school_code: string;
    school_name: string;
    password_hash: string;
    region?: string;
    school_type?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Project {
    id: string;
    school_id: string;
    title: string;
    year: number;
    status: ProjectStatus;
    description?: string;
    start_date?: Date;
    end_date?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface Question {
    id: string;
    project_id: string;
    indicator_id?: string;
    respondent_type: RespondentType;
    question_type: QuestionType;
    question_text: string;
    description?: string;
    image_url?: string;
    options?: any;
    is_required: boolean;
    order_index: number;
    section_name?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Response {
    id: string;
    question_id: string;
    project_id: string;
    respondent_type: RespondentType;
    response_value?: string;
    response_data?: any;
    session_id: string;
    created_at: Date;
}

export interface SurveyLink {
    id: string;
    project_id: string;
    respondent_type: RespondentType;
    access_code: string;
    is_active: boolean;
    expires_at?: Date;
    created_at: Date;
}

export interface EvaluationDomain {
    id: string;
    code: string;
    name: string;
    description?: string;
    order_index: number;
    created_at: Date;
}

export interface EvaluationArea {
    id: string;
    domain_id: string;
    code: string;
    name: string;
    description?: string;
    order_index: number;
    created_at: Date;
}

export interface Indicator {
    id: string;
    area_id: string;
    code: string;
    name: string;
    description?: string;
    order_index: number;
    created_at: Date;
}
