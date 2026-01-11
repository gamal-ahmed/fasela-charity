export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_standards: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          id: string
          standard_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          standard_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          standard_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_standards_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "curriculum_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submission: boolean | null
          assessment_criteria: string | null
          assessment_criteria_ar: string | null
          class_id: string | null
          created_at: string | null
          description: string
          description_ar: string | null
          difficulty: string | null
          due_date: string
          estimated_time: string | null
          grade: string
          id: string
          instructions: string
          instructions_ar: string | null
          is_group_work: boolean | null
          max_points: number | null
          status: string | null
          subject: string
          teacher_id: string | null
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          allow_late_submission?: boolean | null
          assessment_criteria?: string | null
          assessment_criteria_ar?: string | null
          class_id?: string | null
          created_at?: string | null
          description: string
          description_ar?: string | null
          difficulty?: string | null
          due_date: string
          estimated_time?: string | null
          grade: string
          id?: string
          instructions: string
          instructions_ar?: string | null
          is_group_work?: boolean | null
          max_points?: number | null
          status?: string | null
          subject: string
          teacher_id?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_late_submission?: boolean | null
          assessment_criteria?: string | null
          assessment_criteria_ar?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string
          description_ar?: string | null
          difficulty?: string | null
          due_date?: string
          estimated_time?: string | null
          grade?: string
          id?: string
          instructions?: string
          instructions_ar?: string | null
          is_group_work?: boolean | null
          max_points?: number | null
          status?: string | null
          subject?: string
          teacher_id?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      basket_items: {
        Row: {
          created_at: string | null
          currency: string
          experiment_id: string | null
          experiment_title: string
          id: string
          material_image_url: string | null
          material_name: string
          quantity: number
          session_id: string | null
          total_price: number | null
          unit_price: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          experiment_id?: string | null
          experiment_title: string
          id?: string
          material_image_url?: string | null
          material_name: string
          quantity?: number
          session_id?: string | null
          total_price?: number | null
          unit_price?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          experiment_id?: string | null
          experiment_title?: string
          id?: string
          material_image_url?: string | null
          material_name?: string
          quantity?: number
          session_id?: string | null
          total_price?: number | null
          unit_price?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "basket_items_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_with_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basket_items_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_uploads: {
        Row: {
          brightcove_response: Json | null
          brightcove_track_id: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string
          language: string
          s3_key: string
          s3_url: string
          video_id: string
        }
        Insert: {
          brightcove_response?: Json | null
          brightcove_track_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          language: string
          s3_key: string
          s3_url: string
          video_id: string
        }
        Update: {
          brightcove_response?: Json | null
          brightcove_track_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          language?: string
          s3_key?: string
          s3_url?: string
          video_id?: string
        }
        Relationships: []
      }
      carousel_items: {
        Row: {
          created_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
          tags: Json | null
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          tags?: Json | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          tags?: Json | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      case_charities: {
        Row: {
          case_id: string
          charity_id: string
          created_at: string
          id: string
          monthly_amount: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          case_id: string
          charity_id: string
          created_at?: string
          id?: string
          monthly_amount?: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          charity_id?: string
          created_at?: string
          id?: string
          monthly_amount?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_charities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_charities_charity_id_fkey"
            columns: ["charity_id"]
            isOneToOne: false
            referencedRelation: "charities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_charities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_confidential_info: {
        Row: {
          ahmed_spending: number
          case_id: string | null
          case_name: string
          created_at: string | null
          id: string
          is_zakah: boolean
          organization_id: string
          refer_name: string
        }
        Insert: {
          ahmed_spending?: number
          case_id?: string | null
          case_name: string
          created_at?: string | null
          id?: string
          is_zakah?: boolean
          organization_id: string
          refer_name: string
        }
        Update: {
          ahmed_spending?: number
          case_id?: string | null
          case_name?: string
          created_at?: string | null
          id?: string
          is_zakah?: boolean
          organization_id?: string
          refer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_confidential_info_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_confidential_info_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_kids: {
        Row: {
          age: number
          case_id: string
          certificates: Json | null
          created_at: string
          current_grade: string | null
          description: string | null
          education_progress: Json | null
          gender: string
          health_state: string | null
          hobbies: string[] | null
          id: string
          name: string
          ongoing_courses: Json | null
          organization_id: string
          school_name: string | null
          updated_at: string
        }
        Insert: {
          age: number
          case_id: string
          certificates?: Json | null
          created_at?: string
          current_grade?: string | null
          description?: string | null
          education_progress?: Json | null
          gender: string
          health_state?: string | null
          hobbies?: string[] | null
          id?: string
          name: string
          ongoing_courses?: Json | null
          organization_id: string
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          case_id?: string
          certificates?: Json | null
          created_at?: string
          current_grade?: string | null
          description?: string | null
          education_progress?: Json | null
          gender?: string
          health_state?: string | null
          hobbies?: string[] | null
          id?: string
          name?: string
          ongoing_courses?: Json | null
          organization_id?: string
          school_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_kids_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_kids_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_private_spending: {
        Row: {
          amount: number
          case_id: string | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
        }
        Insert: {
          amount: number
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
        }
        Update: {
          amount?: number
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_private_spending_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_private_spending_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tags: {
        Row: {
          case_id: string
          tag_id: string
        }
        Insert: {
          case_id: string
          tag_id: string
        }
        Update: {
          case_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_tags_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          admin_profile_picture_url: string | null
          area: string | null
          case_care_type: string
          city: string | null
          contact_phone: string | null
          created_at: string
          description: string
          description_ar: string
          description_images: Json | null
          deserve_zakkah: boolean | null
          education_level: string | null
          health_state: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          kids_number: number | null
          lifecycle_status: string
          min_custom_donation: number | null
          monthly_cost: number
          months_covered: number
          months_needed: number
          organization_id: string
          parent_age: number | null
          payment_code: string | null
          photo_url: string | null
          profile_notes: string | null
          rent_amount: number | null
          short_description: string
          short_description_ar: string
          show_custom_donation: boolean | null
          show_monthly_donation: boolean | null
          skills: string[] | null
          status: string
          title: string
          title_ar: string
          total_secured_money: number | null
          updated_at: string | null
          work_ability: string | null
        }
        Insert: {
          admin_profile_picture_url?: string | null
          area?: string | null
          case_care_type?: string
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          description_ar: string
          description_images?: Json | null
          deserve_zakkah?: boolean | null
          education_level?: string | null
          health_state?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          kids_number?: number | null
          lifecycle_status?: string
          min_custom_donation?: number | null
          monthly_cost: number
          months_covered?: number
          months_needed: number
          organization_id: string
          parent_age?: number | null
          payment_code?: string | null
          photo_url?: string | null
          profile_notes?: string | null
          rent_amount?: number | null
          short_description: string
          short_description_ar: string
          show_custom_donation?: boolean | null
          show_monthly_donation?: boolean | null
          skills?: string[] | null
          status?: string
          title: string
          title_ar: string
          total_secured_money?: number | null
          updated_at?: string | null
          work_ability?: string | null
        }
        Update: {
          admin_profile_picture_url?: string | null
          area?: string | null
          case_care_type?: string
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          description_ar?: string
          description_images?: Json | null
          deserve_zakkah?: boolean | null
          education_level?: string | null
          health_state?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          kids_number?: number | null
          lifecycle_status?: string
          min_custom_donation?: number | null
          monthly_cost?: number
          months_covered?: number
          months_needed?: number
          organization_id?: string
          parent_age?: number | null
          payment_code?: string | null
          photo_url?: string | null
          profile_notes?: string | null
          rent_amount?: number | null
          short_description?: string
          short_description_ar?: string
          show_custom_donation?: boolean | null
          show_monthly_donation?: boolean | null
          skills?: string[] | null
          status?: string
          title?: string
          title_ar?: string
          total_secured_money?: number | null
          updated_at?: string | null
          work_ability?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      charities: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          name: string
          name_ar: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          name: string
          name_ar: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          name?: string
          name_ar?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      charity_events: {
        Row: {
          collected_money: number
          contributors_count: number
          created_at: string
          date: string
          description: string
          description_ar: string
          id: string
          is_published: boolean
          name: string
          name_ar: string
          needed_money: number
          photo_url: string | null
        }
        Insert: {
          collected_money?: number
          contributors_count?: number
          created_at?: string
          date: string
          description: string
          description_ar: string
          id?: string
          is_published?: boolean
          name: string
          name_ar: string
          needed_money: number
          photo_url?: string | null
        }
        Update: {
          collected_money?: number
          contributors_count?: number
          created_at?: string
          date?: string
          description?: string
          description_ar?: string
          id?: string
          is_published?: boolean
          name?: string
          name_ar?: string
          needed_money?: number
          photo_url?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year: string
          created_at: string | null
          description: string | null
          description_ar: string | null
          grade: string
          id: string
          is_active: boolean | null
          max_students: number | null
          name: string
          name_ar: string | null
          subject: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          grade: string
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          name: string
          name_ar?: string | null
          subject: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          grade?: string
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          name?: string
          name_ar?: string | null
          subject?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_standards: {
        Row: {
          assessment_methods: Json | null
          assessment_methods_ar: Json | null
          code: string
          created_at: string | null
          description: string
          description_ar: string | null
          grade: string
          id: string
          is_active: boolean | null
          learning_outcomes: Json | null
          learning_outcomes_ar: Json | null
          required_resources: Json | null
          required_resources_ar: Json | null
          subject: string
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_methods?: Json | null
          assessment_methods_ar?: Json | null
          code: string
          created_at?: string | null
          description: string
          description_ar?: string | null
          grade: string
          id?: string
          is_active?: boolean | null
          learning_outcomes?: Json | null
          learning_outcomes_ar?: Json | null
          required_resources?: Json | null
          required_resources_ar?: Json | null
          subject: string
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_methods?: Json | null
          assessment_methods_ar?: Json | null
          code?: string
          created_at?: string | null
          description?: string
          description_ar?: string | null
          grade?: string
          id?: string
          is_active?: boolean | null
          learning_outcomes?: Json | null
          learning_outcomes_ar?: Json | null
          required_resources?: Json | null
          required_resources_ar?: Json | null
          subject?: string
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      donation_handovers: {
        Row: {
          case_id: string
          created_at: string
          donation_id: string
          handed_over_by: string | null
          handover_amount: number
          handover_date: string
          handover_notes: string | null
          id: string
          organization_id: string
          original_case_id: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          donation_id: string
          handed_over_by?: string | null
          handover_amount: number
          handover_date?: string
          handover_notes?: string | null
          id?: string
          organization_id: string
          original_case_id?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          donation_id?: string
          handed_over_by?: string | null
          handover_amount?: number
          handover_date?: string
          handover_notes?: string | null
          id?: string
          organization_id?: string
          original_case_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_handovers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_handovers_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_handovers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_handovers_original_case_id_fkey"
            columns: ["original_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          admin_notes: string | null
          amount: number
          case_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          donation_type: string
          donor_email: string | null
          donor_name: string | null
          handover_status: string | null
          id: string
          months_pledged: number
          organization_id: string
          payment_code: string
          payment_reference: string | null
          status: string
          total_handed_over: number | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          case_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          donation_type?: string
          donor_email?: string | null
          donor_name?: string | null
          handover_status?: string | null
          id?: string
          months_pledged?: number
          organization_id: string
          payment_code: string
          payment_reference?: string | null
          status?: string
          total_handed_over?: number | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          case_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          donation_type?: string
          donor_email?: string | null
          donor_name?: string | null
          handover_status?: string | null
          id?: string
          months_pledged?: number
          organization_id?: string
          payment_code?: string
          payment_reference?: string | null
          status?: string
          total_handed_over?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          budget: number
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      experiment_box_items: {
        Row: {
          box_id: string
          created_at: string | null
          experiment_id: string
          id: string
          sort_order: number | null
        }
        Insert: {
          box_id: string
          created_at?: string | null
          experiment_id: string
          id?: string
          sort_order?: number | null
        }
        Update: {
          box_id?: string
          created_at?: string | null
          experiment_id?: string
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "experiment_box_items_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "experiment_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_box_items_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_with_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_box_items_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_boxes: {
        Row: {
          age_group: string
          age_group_ar: string | null
          created_at: string | null
          description: string
          description_ar: string | null
          difficulty: string
          features: Json | null
          features_ar: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          learning_outcomes: Json | null
          learning_outcomes_ar: Json | null
          price: number
          scientific_value: Json | null
          show_on_homepage: boolean
          sort_order: number | null
          title: string
          title_ar: string | null
          total_duration: string
          total_duration_ar: string | null
          updated_at: string | null
        }
        Insert: {
          age_group: string
          age_group_ar?: string | null
          created_at?: string | null
          description: string
          description_ar?: string | null
          difficulty: string
          features?: Json | null
          features_ar?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          learning_outcomes?: Json | null
          learning_outcomes_ar?: Json | null
          price?: number
          scientific_value?: Json | null
          show_on_homepage?: boolean
          sort_order?: number | null
          title: string
          title_ar?: string | null
          total_duration: string
          total_duration_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string
          age_group_ar?: string | null
          created_at?: string | null
          description?: string
          description_ar?: string | null
          difficulty?: string
          features?: Json | null
          features_ar?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          learning_outcomes?: Json | null
          learning_outcomes_ar?: Json | null
          price?: number
          scientific_value?: Json | null
          show_on_homepage?: boolean
          sort_order?: number | null
          title?: string
          title_ar?: string | null
          total_duration?: string
          total_duration_ar?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      experiment_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      experiment_materials: {
        Row: {
          created_at: string
          experiment_id: string
          id: string
          material_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          experiment_id: string
          id?: string
          material_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          experiment_id?: string
          id?: string
          material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_materials_base_exp_fk"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_with_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_materials_base_exp_fk"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_materials_base_mat_fk"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_tags: {
        Row: {
          created_at: string | null
          experiment_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          experiment_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          experiment_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_tags_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiment_with_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_tags_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          age_group: string | null
          category: string
          category_id: string | null
          created_at: string
          description: string
          description_ar: string | null
          difficulty: string
          duration: string
          experiment_method:
            | Database["public"]["Enums"]["experiment_method_enum"]
            | null
          grade_level_id: number | null
          id: string
          image_url: string | null
          is_in_box: boolean | null
          material_images: Json | null
          materials: string[] | null
          materials_ar: string[] | null
          materials_count: number | null
          price: number | null
          safety_tips: string[]
          safety_tips_ar: string[] | null
          scientific_concepts: string[]
          scientific_concepts_ar: string[] | null
          shop_button_text: string | null
          shop_thumbnail_url: string | null
          shop_url: string | null
          show_materials: boolean | null
          show_shop_section: boolean | null
          step_images: Json | null
          steps: string[]
          steps_ar: string[] | null
          tags: Json | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          category: string
          category_id?: string | null
          created_at?: string
          description: string
          description_ar?: string | null
          difficulty: string
          duration: string
          experiment_method?:
            | Database["public"]["Enums"]["experiment_method_enum"]
            | null
          grade_level_id?: number | null
          id?: string
          image_url?: string | null
          is_in_box?: boolean | null
          material_images?: Json | null
          materials?: string[] | null
          materials_ar?: string[] | null
          materials_count?: number | null
          price?: number | null
          safety_tips: string[]
          safety_tips_ar?: string[] | null
          scientific_concepts: string[]
          scientific_concepts_ar?: string[] | null
          shop_button_text?: string | null
          shop_thumbnail_url?: string | null
          shop_url?: string | null
          show_materials?: boolean | null
          show_shop_section?: boolean | null
          step_images?: Json | null
          steps: string[]
          steps_ar?: string[] | null
          tags?: Json | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          category?: string
          category_id?: string | null
          created_at?: string
          description?: string
          description_ar?: string | null
          difficulty?: string
          duration?: string
          experiment_method?:
            | Database["public"]["Enums"]["experiment_method_enum"]
            | null
          grade_level_id?: number | null
          id?: string
          image_url?: string | null
          is_in_box?: boolean | null
          material_images?: Json | null
          materials?: string[] | null
          materials_ar?: string[] | null
          materials_count?: number | null
          price?: number | null
          safety_tips?: string[]
          safety_tips_ar?: string[] | null
          scientific_concepts?: string[]
          scientific_concepts_ar?: string[] | null
          shop_button_text?: string | null
          shop_thumbnail_url?: string | null
          shop_url?: string | null
          show_materials?: boolean | null
          show_shop_section?: boolean | null
          step_images?: Json | null
          steps?: string[]
          steps_ar?: string[] | null
          tags?: Json | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "experiment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fasela_program_feedbacks: {
        Row: {
          cohort: string | null
          created_at: string
          email: string
          feedback: string
          id: string
          name: string
          rating: number
        }
        Insert: {
          cohort?: string | null
          created_at?: string
          email: string
          feedback: string
          id?: string
          name: string
          rating: number
        }
        Update: {
          cohort?: string | null
          created_at?: string
          email?: string
          feedback?: string
          id?: string
          name?: string
          rating?: number
        }
        Relationships: []
      }
      followup_action_kid_answers: {
        Row: {
          answer_multi_choice: string | null
          answer_photos: Json | null
          answer_text: string | null
          answered_at: string
          answered_by: string | null
          created_at: string
          followup_action_id: string
          id: string
          kid_id: string
        }
        Insert: {
          answer_multi_choice?: string | null
          answer_photos?: Json | null
          answer_text?: string | null
          answered_at?: string
          answered_by?: string | null
          created_at?: string
          followup_action_id: string
          id?: string
          kid_id: string
        }
        Update: {
          answer_multi_choice?: string | null
          answer_photos?: Json | null
          answer_text?: string | null
          answered_at?: string
          answered_by?: string | null
          created_at?: string
          followup_action_id?: string
          id?: string
          kid_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_action_kid_answers_followup_action_id_fkey"
            columns: ["followup_action_id"]
            isOneToOne: false
            referencedRelation: "followup_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_action_kid_answers_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "case_kids"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_actions: {
        Row: {
          action_date: string
          answer_multi_choice: string | null
          answer_options: Json | null
          answer_photos: Json | null
          answer_text: string | null
          answer_type: string | null
          answered_at: string | null
          answered_by: string | null
          case_id: string
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          cost: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_recurring: boolean | null
          kid_ids: Json | null
          organization_id: string
          profile_field_mapping: string | null
          recurrence_interval: string | null
          requires_case_action: boolean
          requires_volunteer_action: boolean
          status: string
          task_level: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_date: string
          answer_multi_choice?: string | null
          answer_options?: Json | null
          answer_photos?: Json | null
          answer_text?: string | null
          answer_type?: string | null
          answered_at?: string | null
          answered_by?: string | null
          case_id: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          cost?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          kid_ids?: Json | null
          organization_id: string
          profile_field_mapping?: string | null
          recurrence_interval?: string | null
          requires_case_action?: boolean
          requires_volunteer_action?: boolean
          status?: string
          task_level?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_date?: string
          answer_multi_choice?: string | null
          answer_options?: Json | null
          answer_photos?: Json | null
          answer_text?: string | null
          answer_type?: string | null
          answered_at?: string | null
          answered_by?: string | null
          case_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          kid_ids?: Json | null
          organization_id?: string
          profile_field_mapping?: string | null
          recurrence_interval?: string | null
          requires_case_action?: boolean
          requires_volunteer_action?: boolean
          status?: string
          task_level?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_transactions: {
        Row: {
          created_at: string
          fees: number | null
          id: string
          investment_id: string
          notes: string | null
          price: number
          quantity: number
          total_amount: number
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          created_at?: string
          fees?: number | null
          id?: string
          investment_id: string
          notes?: string | null
          price: number
          quantity: number
          total_amount: number
          transaction_date: string
          transaction_type: string
        }
        Update: {
          created_at?: string
          fees?: number | null
          id?: string
          investment_id?: string
          notes?: string | null
          price?: number
          quantity?: number
          total_amount?: number
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          category_id: string | null
          created_at: string
          current_price: number | null
          id: string
          investment_type: string
          name: string
          notes: string | null
          purchase_date: string
          purchase_price: number
          quantity: number
          symbol: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_price?: number | null
          id?: string
          investment_type?: string
          name: string
          notes?: string | null
          purchase_date: string
          purchase_price: number
          quantity?: number
          symbol?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_price?: number | null
          id?: string
          investment_type?: string
          name?: string
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          symbol?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "investment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_shop_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_ar: string
          parent_id: string | null
          slug: string
          slug_ar: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_ar: string
          parent_id?: string | null
          slug: string
          slug_ar: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_ar?: string
          parent_id?: string | null
          slug?: string
          slug_ar?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_shop_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_shop_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_name_ar: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_name_ar: string
          product_sku?: string | null
          quantity: number
          total_price: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_name_ar?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_shop_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_shop_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_shop_orders: {
        Row: {
          billing_address: Json | null
          created_at: string | null
          currency: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lab_shop_product_reviews: {
        Row: {
          comment: string | null
          comment_ar: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string
          title: string | null
          title_ar: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          comment_ar?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name: string
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          comment_ar?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_shop_product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_shop_product_tags: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_shop_product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_shop_product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_shop_product_variants: {
        Row: {
          attributes: Json | null
          compare_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_ar: string
          price: number | null
          product_id: string
          sku: string | null
          sort_order: number | null
          stock_quantity: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          attributes?: Json | null
          compare_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_ar: string
          price?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          attributes?: Json | null
          compare_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_ar?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_shop_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_shop_products: {
        Row: {
          age_max: number | null
          age_min: number | null
          category_id: string | null
          compare_price: number | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          difficulty_level: string | null
          dimensions: Json | null
          estimated_duration: number | null
          gallery: Json | null
          id: string
          image_url: string | null
          instructions_url: string | null
          is_active: boolean | null
          is_digital: boolean | null
          is_featured: boolean | null
          learning_objectives: Json | null
          low_stock_threshold: number | null
          materials_included: Json | null
          meta_keywords: string | null
          meta_keywords_ar: string | null
          name: string
          name_ar: string
          price: number
          requires_shipping: boolean | null
          safety_notes: string | null
          safety_notes_ar: string | null
          seo_description: string | null
          seo_description_ar: string | null
          seo_title: string | null
          seo_title_ar: string | null
          short_description: string | null
          short_description_ar: string | null
          sku: string | null
          slug: string
          slug_ar: string
          sort_order: number | null
          stock_quantity: number | null
          updated_at: string | null
          video_url: string | null
          weight: number | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          category_id?: string | null
          compare_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty_level?: string | null
          dimensions?: Json | null
          estimated_duration?: number | null
          gallery?: Json | null
          id?: string
          image_url?: string | null
          instructions_url?: string | null
          is_active?: boolean | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          learning_objectives?: Json | null
          low_stock_threshold?: number | null
          materials_included?: Json | null
          meta_keywords?: string | null
          meta_keywords_ar?: string | null
          name: string
          name_ar: string
          price: number
          requires_shipping?: boolean | null
          safety_notes?: string | null
          safety_notes_ar?: string | null
          seo_description?: string | null
          seo_description_ar?: string | null
          seo_title?: string | null
          seo_title_ar?: string | null
          short_description?: string | null
          short_description_ar?: string | null
          sku?: string | null
          slug: string
          slug_ar: string
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          video_url?: string | null
          weight?: number | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          category_id?: string | null
          compare_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty_level?: string | null
          dimensions?: Json | null
          estimated_duration?: number | null
          gallery?: Json | null
          id?: string
          image_url?: string | null
          instructions_url?: string | null
          is_active?: boolean | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          learning_objectives?: Json | null
          low_stock_threshold?: number | null
          materials_included?: Json | null
          meta_keywords?: string | null
          meta_keywords_ar?: string | null
          name?: string
          name_ar?: string
          price?: number
          requires_shipping?: boolean | null
          safety_notes?: string | null
          safety_notes_ar?: string | null
          seo_description?: string | null
          seo_description_ar?: string | null
          seo_title?: string | null
          seo_title_ar?: string | null
          short_description?: string | null
          short_description_ar?: string | null
          sku?: string | null
          slug?: string
          slug_ar?: string
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          video_url?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_shop_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lab_shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_shop_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      lab_shop_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          name_ar: string | null
          price: number | null
          stock_quantity: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          name_ar?: string | null
          price?: number | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          name_ar?: string | null
          price?: number | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      monthly_budgets: {
        Row: {
          created_at: string
          id: string
          month: string
          total_budget: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          total_budget?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          total_budget?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      monthly_needs: {
        Row: {
          amount: number
          case_id: string
          category: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          case_id: string
          category: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          case_id?: string
          category?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          case_id: string
          category: string
          created_at: string
          description: string | null
          id: string
          images: Json | null
          organization_id: string
          report_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          case_id: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          organization_id: string
          report_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          organization_id?: string
          report_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_monthly_reports_case_id"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          currency: string
          experiment_category: string | null
          experiment_id: string | null
          experiment_title: string | null
          id: string
          image_url: string | null
          name: string
          order_id: string
          quantity: number
          unit_amount_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          experiment_category?: string | null
          experiment_id?: string | null
          experiment_title?: string | null
          id?: string
          image_url?: string | null
          name: string
          order_id: string
          quantity?: number
          unit_amount_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          experiment_category?: string | null
          experiment_id?: string | null
          experiment_title?: string | null
          id?: string
          image_url?: string | null
          name?: string
          order_id?: string
          quantity?: number
          unit_amount_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string
          id: string
          newsletter_subscription: boolean | null
          order_number: string
          order_status: string
          payment_method: string
          payment_status: string
          shipping_address: string
          shipping_city: string
          shipping_fee: number
          shipping_postal_code: string
          special_instructions: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string
          id?: string
          newsletter_subscription?: boolean | null
          order_number: string
          order_status?: string
          payment_method?: string
          payment_status?: string
          shipping_address: string
          shipping_city: string
          shipping_fee?: number
          shipping_postal_code: string
          special_instructions?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          customer_email?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_phone?: string
          id?: string
          newsletter_subscription?: boolean | null
          order_number?: string
          order_status?: string
          payment_method?: string
          payment_status?: string
          shipping_address?: string
          shipping_city?: string
          shipping_fee?: number
          shipping_postal_code?: string
          special_instructions?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      org_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pledges: {
        Row: {
          case_id: string
          cash_collected: boolean | null
          contributor_name: string
          email: string | null
          event_id: string | null
          generic_pledge: boolean | null
          id: string
          instapay_handle: string | null
          is_anonymous: boolean
          is_zakah: boolean | null
          money_collected: boolean | null
          months_pledged: number
          pledge_budget: number | null
          pledge_timestamp: string
        }
        Insert: {
          case_id: string
          cash_collected?: boolean | null
          contributor_name: string
          email?: string | null
          event_id?: string | null
          generic_pledge?: boolean | null
          id?: string
          instapay_handle?: string | null
          is_anonymous?: boolean
          is_zakah?: boolean | null
          money_collected?: boolean | null
          months_pledged: number
          pledge_budget?: number | null
          pledge_timestamp?: string
        }
        Update: {
          case_id?: string
          cash_collected?: boolean | null
          contributor_name?: string
          email?: string | null
          event_id?: string | null
          generic_pledge?: boolean | null
          id?: string
          instapay_handle?: string | null
          is_anonymous?: boolean
          is_zakah?: boolean | null
          money_collected?: boolean | null
          months_pledged?: number
          pledge_budget?: number | null
          pledge_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "pledges_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "charity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      program_stats: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          key: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      shared_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          owner_user_id: string
          permission_level: string
          shared_with_user_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          owner_user_id: string
          permission_level?: string
          shared_with_user_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          owner_user_id?: string
          permission_level?: string
          shared_with_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_lab_basket_items: {
        Row: {
          created_at: string | null
          id: string
          kit_id: string | null
          quantity: number
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kit_id?: string | null
          quantity?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kit_id?: string | null
          quantity?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simple_lab_basket_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "simple_lab_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_lab_experiments: {
        Row: {
          age_group: string | null
          category: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          difficulty: string | null
          duration: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
          title_ar: string | null
          updated_at: string | null
          youtube_url: string
        }
        Insert: {
          age_group?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
          youtube_url: string
        }
        Update: {
          age_group?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
          youtube_url?: string
        }
        Relationships: []
      }
      simple_lab_kit_items: {
        Row: {
          created_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          image_url: string | null
          kit_id: string | null
          name: string
          name_ar: string | null
          quantity: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          kit_id?: string | null
          name: string
          name_ar?: string | null
          quantity?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          kit_id?: string | null
          name?: string
          name_ar?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "simple_lab_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "simple_lab_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_lab_kits: {
        Row: {
          created_at: string | null
          description: string | null
          description_ar: string | null
          experiment_id: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          name_ar: string | null
          price: number
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          experiment_id?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          name_ar?: string | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          experiment_id?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          name_ar?: string | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simple_lab_kits_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "simple_lab_experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_lab_order_items: {
        Row: {
          created_at: string | null
          id: string
          kit_id: string | null
          kit_name: string
          order_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          kit_id?: string | null
          kit_name: string
          order_id?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          kit_id?: string | null
          kit_name?: string
          order_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "simple_lab_order_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "simple_lab_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_lab_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "simple_lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_lab_orders: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          order_number: string
          order_status: string | null
          payment_status: string | null
          shipping_address: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          order_number: string
          order_status?: string | null
          payment_status?: string | null
          shipping_address: string
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          order_number?: string
          order_status?: string | null
          payment_status?: string | null
          shipping_address?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      static_content: {
        Row: {
          content_ar: string | null
          created_at: string | null
          key: string
          title_ar: string
          updated_at: string | null
        }
        Insert: {
          content_ar?: string | null
          created_at?: string | null
          key: string
          title_ar: string
          updated_at?: string | null
        }
        Update: {
          content_ar?: string | null
          created_at?: string | null
          key?: string
          title_ar?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_assignments: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          feedback: string | null
          feedback_ar: string | null
          id: string
          is_late: boolean | null
          max_score: number | null
          score: number | null
          status: string | null
          student_id: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          feedback_ar?: string | null
          id?: string
          is_late?: boolean | null
          max_score?: number | null
          score?: number | null
          status?: string | null
          student_id?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          feedback_ar?: string | null
          id?: string
          is_late?: boolean | null
          max_score?: number | null
          score?: number | null
          status?: string | null
          student_id?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          areas_for_improvement: string[] | null
          assignments_completed: number | null
          attendance_percentage: number | null
          average_score: number | null
          class_id: string | null
          created_at: string | null
          id: string
          last_activity: string | null
          overall_progress: number | null
          participation_score: number | null
          strengths: string[] | null
          student_id: string | null
          total_assignments: number | null
          updated_at: string | null
        }
        Insert: {
          areas_for_improvement?: string[] | null
          assignments_completed?: number | null
          attendance_percentage?: number | null
          average_score?: number | null
          class_id?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          overall_progress?: number | null
          participation_score?: number | null
          strengths?: string[] | null
          student_id?: string | null
          total_assignments?: number | null
          updated_at?: string | null
        }
        Update: {
          areas_for_improvement?: string[] | null
          assignments_completed?: number | null
          attendance_percentage?: number | null
          average_score?: number | null
          class_id?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          overall_progress?: number | null
          participation_score?: number | null
          strengths?: string[] | null
          student_id?: string | null
          total_assignments?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string | null
          created_at: string | null
          email: string | null
          grade: string
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          email?: string | null
          grade: string
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          email?: string | null
          grade?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          payment_data: Json | null
          payment_provider: string
          status: string
          transaction_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_data?: Json | null
          payment_provider: string
          status?: string
          transaction_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_data?: Json | null
          payment_provider?: string
          status?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          cohort: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          story: string
          updated_at: string
        }
        Insert: {
          cohort?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          story: string
          updated_at?: string
        }
        Update: {
          cohort?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          story?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string | null
          email: string
          grade_levels: string[] | null
          id: string
          name: string
          name_ar: string | null
          phone: string | null
          school_name: string | null
          school_name_ar: string | null
          subject_specialization: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          grade_levels?: string[] | null
          id?: string
          name: string
          name_ar?: string | null
          phone?: string | null
          school_name?: string | null
          school_name_ar?: string | null
          subject_specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          grade_levels?: string[] | null
          id?: string
          name?: string
          name_ar?: string | null
          phone?: string | null
          school_name?: string | null
          school_name_ar?: string | null
          subject_specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          added_by_user_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_annual: boolean
          user_id: string
        }
        Insert: {
          added_by_user_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_annual?: boolean
          user_id: string
        }
        Update: {
          added_by_user_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_annual?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transcription_exports: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          format: string
          id: string
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          format: string
          id?: string
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          format?: string
          id?: string
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      transcription_integrations: {
        Row: {
          created_at: string | null
          id: string
          key_name: string
          key_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_name: string
          key_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_name?: string
          key_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transcription_sessions: {
        Row: {
          accepted_model_id: string | null
          audio_file_name: string | null
          created_at: string
          id: string
          last_updated: string
          prompt_config: Json | null
          prompt_text: string | null
          selected_model: string | null
          selected_models: string[]
          selected_transcription: string | null
          selected_transcription_url: string | null
          transcriptions: Json
          user_id: string
          video_id: string | null
          vtt_file_url: string | null
        }
        Insert: {
          accepted_model_id?: string | null
          audio_file_name?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          prompt_config?: Json | null
          prompt_text?: string | null
          selected_model?: string | null
          selected_models?: string[]
          selected_transcription?: string | null
          selected_transcription_url?: string | null
          transcriptions?: Json
          user_id: string
          video_id?: string | null
          vtt_file_url?: string | null
        }
        Update: {
          accepted_model_id?: string | null
          audio_file_name?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          prompt_config?: Json | null
          prompt_text?: string | null
          selected_model?: string | null
          selected_models?: string[]
          selected_transcription?: string | null
          selected_transcription_url?: string | null
          transcriptions?: Json
          user_id?: string
          video_id?: string | null
          vtt_file_url?: string | null
        }
        Relationships: []
      }
      transcriptions: {
        Row: {
          created_at: string
          error: string | null
          file_path: string
          id: string
          model: string
          prompt_text: string | null
          result: Json | null
          session_id: string | null
          status: string
          status_message: string | null
          updated_at: string
          user_id: string | null
          vtt_file_url: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          file_path: string
          id?: string
          model: string
          prompt_text?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string
          status_message?: string | null
          updated_at?: string
          user_id?: string | null
          vtt_file_url?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          file_path?: string
          id?: string
          model?: string
          prompt_text?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string
          status_message?: string | null
          updated_at?: string
          user_id?: string | null
          vtt_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "transcription_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_experiment_submissions: {
        Row: {
          created_at: string
          experiment_id: string
          id: string
          image_urls: Json | null
          is_approved: boolean | null
          submission_description: string | null
          submission_title: string | null
          updated_at: string
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          experiment_id: string
          id?: string
          image_urls?: Json | null
          is_approved?: boolean | null
          submission_description?: string | null
          submission_title?: string | null
          updated_at?: string
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          experiment_id?: string
          id?: string
          image_urls?: Json | null
          is_approved?: boolean | null
          submission_description?: string | null
          submission_title?: string | null
          updated_at?: string
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_blocked?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_super_admin: boolean
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_super_admin?: boolean
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_super_admin?: boolean
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wise_user_partners: {
        Row: {
          created_at: string
          id: string
          partner_email: string
          partner_name: string
          partner_user_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_email: string
          partner_name: string
          partner_user_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_email?: string
          partner_name?: string
          partner_user_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      worker_listings: {
        Row: {
          availability_end: string | null
          availability_start: string | null
          can_travel: boolean | null
          created_at: string
          description: string | null
          experience_years: number | null
          id: string
          images: string[] | null
          location: string
          max_travel_distance: number | null
          price_per_day: number | null
          price_per_hour: number | null
          service_type: string
          status: string
          team_size: number | null
          title: string
          tools_available: string[] | null
          updated_at: string
          worker_id: string | null
          worker_location: string | null
          worker_name: string | null
          worker_phone: string | null
        }
        Insert: {
          availability_end?: string | null
          availability_start?: string | null
          can_travel?: boolean | null
          created_at?: string
          description?: string | null
          experience_years?: number | null
          id?: string
          images?: string[] | null
          location: string
          max_travel_distance?: number | null
          price_per_day?: number | null
          price_per_hour?: number | null
          service_type: string
          status?: string
          team_size?: number | null
          title: string
          tools_available?: string[] | null
          updated_at?: string
          worker_id?: string | null
          worker_location?: string | null
          worker_name?: string | null
          worker_phone?: string | null
        }
        Update: {
          availability_end?: string | null
          availability_start?: string | null
          can_travel?: boolean | null
          created_at?: string
          description?: string | null
          experience_years?: number | null
          id?: string
          images?: string[] | null
          location?: string
          max_travel_distance?: number | null
          price_per_day?: number | null
          price_per_hour?: number | null
          service_type?: string
          status?: string
          team_size?: number | null
          title?: string
          tools_available?: string[] | null
          updated_at?: string
          worker_id?: string | null
          worker_location?: string | null
          worker_name?: string | null
          worker_phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      experiment_with_category: {
        Row: {
          age_group: string | null
          category: string | null
          category_color: string | null
          category_description: string | null
          category_description_ar: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          category_name_ar: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          difficulty: string | null
          duration: string | null
          id: string | null
          image_url: string | null
          material_images: Json | null
          materials: string[] | null
          materials_ar: string[] | null
          materials_count: number | null
          price: number | null
          safety_tips: string[] | null
          safety_tips_ar: string[] | null
          scientific_concepts: string[] | null
          scientific_concepts_ar: string[] | null
          step_images: Json | null
          steps: string[] | null
          steps_ar: string[] | null
          title: string | null
          title_ar: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "experiment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_experiments: {
        Row: {
          currency: string | null
          experiment_category: string | null
          experiment_id: string | null
          experiment_title: string | null
          item_count: number | null
          order_id: string | null
          subtotal_cents: number | null
          total_quantity: number | null
        }
        Relationships: []
      }
      transcription_jobs: {
        Row: {
          created_at: string | null
          error: string | null
          file_path: string | null
          id: string | null
          model: string | null
          prompt_text: string | null
          result: Json | null
          session_id: string | null
          status: string | null
          status_message: string | null
          updated_at: string | null
          user_id: string | null
          vtt_file_url: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          id?: string | null
          model?: string | null
          prompt_text?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string | null
          vtt_file_url?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          id?: string | null
          model?: string | null
          prompt_text?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string | null
          vtt_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "transcription_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_experiment_steps: {
        Args: { p_experiment_id: string; p_new_steps: Json }
        Returns: undefined
      }
      cleanup_old_basket_items: { Args: never; Returns: undefined }
      clear_basket: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: boolean
      }
      create_default_categories: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      create_default_investment_categories: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      create_order_with_items: {
        Args: {
          p_currency?: string
          p_customer_email: string
          p_customer_first_name: string
          p_customer_last_name: string
          p_customer_phone: string
          p_newsletter_subscription?: boolean
          p_order_number: string
          p_session_id?: string
          p_shipping_address: string
          p_shipping_city: string
          p_shipping_fee: number
          p_shipping_postal_code: string
          p_special_instructions?: string
          p_subtotal: number
          p_tax_amount: number
          p_total_amount: number
          p_user_id?: string
        }
        Returns: string
      }
      create_wise_partnership: {
        Args: { partner_email: string; partner_name: string }
        Returns: string
      }
      generate_payment_code: { Args: never; Returns: string }
      get_action_counts: {
        Args: never
        Returns: {
          action_type: string
          count: number
        }[]
      }
      get_basket_items: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: {
          created_at: string
          currency: string
          experiment_id: string
          experiment_title: string
          id: string
          material_image_url: string
          material_index: number
          material_name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }[]
      }
      get_box_with_experiments: {
        Args: { box_id_param: string }
        Returns: {
          box_age_group: string
          box_age_group_ar: string
          box_created_at: string
          box_description: string
          box_description_ar: string
          box_difficulty: string
          box_features: Json
          box_features_ar: Json
          box_id: string
          box_image_url: string
          box_is_active: boolean
          box_learning_outcomes: Json
          box_learning_outcomes_ar: Json
          box_price: number
          box_sort_order: number
          box_title: string
          box_title_ar: string
          box_total_duration: string
          box_total_duration_ar: string
          box_updated_at: string
          experiment_category: string
          experiment_difficulty: string
          experiment_duration: string
          experiment_id: string
          experiment_image_url: string
          experiment_title: string
          experiment_title_ar: string
          item_sort_order: number
        }[]
      }
      get_daily_signups: {
        Args: { days_back: number }
        Returns: {
          count: number
          date: string
        }[]
      }
      get_experiment_materials: {
        Args: { experiment_id_param: string }
        Returns: {
          description: string
          description_ar: string
          experiment_id: string
          image_url: string
          is_available: boolean
          material_id: string
          name: string
          name_ar: string
          price: number
          stock_quantity: number
          unit: string
        }[]
      }
      get_my_org_id: { Args: never; Returns: string }
      get_user_organizations: {
        Args: { check_user_id?: string }
        Returns: {
          is_super_admin: boolean
          organization_id: string
          organization_logo_url: string
          organization_name: string
          organization_slug: string
          user_role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_volunteer: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_org_admin: {
        Args: { check_org_id: string; check_user_id: string }
        Returns: boolean
      }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_super_admin: { Args: { check_user_id?: string }; Returns: boolean }
      make_user_admin: { Args: { user_email: string }; Returns: boolean }
      save_basket_item: {
        Args: {
          p_currency?: string
          p_experiment_id: string
          p_experiment_title: string
          p_material_image_url?: string
          p_material_name: string
          p_quantity?: number
          p_session_id?: string
          p_unit_price?: number
          p_user_id?: string
        }
        Returns: string
      }
      track_user_action: {
        Args: { action_details: Json; action_type: string }
        Returns: undefined
      }
      update_basket_item_quantity: {
        Args: { p_item_id: string; p_quantity: number }
        Returns: boolean
      }
      user_belongs_to_org: {
        Args: { check_org_id: string; check_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "volunteer"
      experiment_method_enum: "Engineering Design Process" | "Scientific Method"
      listing_status: "active" | "sold" | "cancelled"
      olive_type:
        | "agizy"
        | "cypriot"
        | "tafahi"
        | "baladi"
        | "manzanillo"
        | "kalamata"
        | "koroneiki"
        | "coratina"
        | "frantoio"
        | "arbequina"
        | "maraki"
        | "picual"
        | "wateqan"
        | "hamid"
        | "khudairi"
      transaction_status: "pending" | "completed" | "cancelled"
      user_role: "user" | "admin"
      user_type: "farmer" | "trader"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "volunteer"],
      experiment_method_enum: [
        "Engineering Design Process",
        "Scientific Method",
      ],
      listing_status: ["active", "sold", "cancelled"],
      olive_type: [
        "agizy",
        "cypriot",
        "tafahi",
        "baladi",
        "manzanillo",
        "kalamata",
        "koroneiki",
        "coratina",
        "frantoio",
        "arbequina",
        "maraki",
        "picual",
        "wateqan",
        "hamid",
        "khudairi",
      ],
      transaction_status: ["pending", "completed", "cancelled"],
      user_role: ["user", "admin"],
      user_type: ["farmer", "trader"],
    },
  },
} as const
