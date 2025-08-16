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
      brightcove_publications: {
        Row: {
          brightcove_master_url: string | null
          brightcove_response: Json | null
          created_at: string
          id: string
          is_published: boolean | null
          model_id: string | null
          model_name: string
          session_id: string
          transcription_url: string | null
          updated_at: string
          video_id: string
        }
        Insert: {
          brightcove_master_url?: string | null
          brightcove_response?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          model_id?: string | null
          model_name: string
          session_id: string
          transcription_url?: string | null
          updated_at?: string
          video_id: string
        }
        Update: {
          brightcove_master_url?: string | null
          brightcove_response?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          model_id?: string | null
          model_name?: string
          session_id?: string
          transcription_url?: string | null
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brightcove_publications_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "transcription_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brightcove_publications_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "transcriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brightcove_publications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "transcription_sessions"
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
      case_confidential_info: {
        Row: {
          ahmed_spending: number
          case_id: string | null
          case_name: string
          created_at: string | null
          id: string
          is_zakah: boolean
          refer_name: string
        }
        Insert: {
          ahmed_spending?: number
          case_id?: string | null
          case_name: string
          created_at?: string | null
          id?: string
          is_zakah?: boolean
          refer_name: string
        }
        Update: {
          ahmed_spending?: number
          case_id?: string | null
          case_name?: string
          created_at?: string | null
          id?: string
          is_zakah?: boolean
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
        ]
      }
      case_kids: {
        Row: {
          age: number
          case_id: string
          created_at: string
          description: string | null
          gender: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          age: number
          case_id: string
          created_at?: string
          description?: string | null
          gender: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          age?: number
          case_id?: string
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_private_spending: {
        Row: {
          amount: number
          case_id: string | null
          created_at: string | null
          description: string | null
          id: string
        }
        Insert: {
          amount: number
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_private_spending_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
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
          area: string | null
          city: string | null
          created_at: string
          description: string
          description_ar: string
          description_images: Json | null
          deserve_zakkah: boolean | null
          id: string
          is_published: boolean
          monthly_cost: number
          months_covered: number
          months_needed: number
          payment_code: string | null
          photo_url: string | null
          short_description: string
          short_description_ar: string
          status: string
          title: string
          title_ar: string
          total_secured_money: number | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          description: string
          description_ar: string
          description_images?: Json | null
          deserve_zakkah?: boolean | null
          id?: string
          is_published?: boolean
          monthly_cost: number
          months_covered?: number
          months_needed: number
          payment_code?: string | null
          photo_url?: string | null
          short_description: string
          short_description_ar: string
          status?: string
          title: string
          title_ar: string
          total_secured_money?: number | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          description?: string
          description_ar?: string
          description_images?: Json | null
          deserve_zakkah?: boolean | null
          id?: string
          is_published?: boolean
          monthly_cost?: number
          months_covered?: number
          months_needed?: number
          payment_code?: string | null
          photo_url?: string | null
          short_description?: string
          short_description_ar?: string
          status?: string
          title?: string
          title_ar?: string
          total_secured_money?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      cloud_storage_accounts: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expires_at: string | null
          id: string
          last_used: string | null
          name: string | null
          provider: string
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          last_used?: string | null
          name?: string | null
          provider: string
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          last_used?: string | null
          name?: string | null
          provider?: string
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
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
          id: string
          months_pledged: number
          payment_code: string
          payment_reference: string | null
          status: string
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
          id?: string
          months_pledged?: number
          payment_code: string
          payment_reference?: string | null
          status?: string
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
          id?: string
          months_pledged?: number
          payment_code?: string
          payment_reference?: string | null
          status?: string
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
      experiments: {
        Row: {
          age_group: string
          category: string
          created_at: string
          description: string
          difficulty: string
          duration: string
          id: string
          image_url: string | null
          material_images: Json | null
          materials: string[]
          price: number | null
          safety_tips: string[]
          scientific_concepts: string[]
          step_images: Json | null
          steps: string[]
          title: string
          updated_at: string
        }
        Insert: {
          age_group: string
          category: string
          created_at?: string
          description: string
          difficulty: string
          duration: string
          id?: string
          image_url?: string | null
          material_images?: Json | null
          materials: string[]
          price?: number | null
          safety_tips: string[]
          scientific_concepts: string[]
          step_images?: Json | null
          steps: string[]
          title: string
          updated_at?: string
        }
        Update: {
          age_group?: string
          category?: string
          created_at?: string
          description?: string
          difficulty?: string
          duration?: string
          id?: string
          image_url?: string | null
          material_images?: Json | null
          materials?: string[]
          price?: number | null
          safety_tips?: string[]
          scientific_concepts?: string[]
          step_images?: Json | null
          steps?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
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
        ]
      }
      olive_listings: {
        Row: {
          created_at: string
          custom_olive_type: string | null
          description: string | null
          farmer_id: string | null
          harvest_date: string | null
          id: string
          images: string[] | null
          location: string
          olive_types: string[]
          price_per_kg: number
          quantity_kg: number
          seller_location: string | null
          seller_name: string | null
          seller_phone: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_olive_type?: string | null
          description?: string | null
          farmer_id?: string | null
          harvest_date?: string | null
          id?: string
          images?: string[] | null
          location: string
          olive_types?: string[]
          price_per_kg: number
          quantity_kg: number
          seller_location?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_olive_type?: string | null
          description?: string | null
          farmer_id?: string | null
          harvest_date?: string | null
          id?: string
          images?: string[] | null
          location?: string
          olive_types?: string[]
          price_per_kg?: number
          quantity_kg?: number
          seller_location?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "olive_listings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "olive_user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      olive_transactions: {
        Row: {
          buyer_location: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          farmer_id: string | null
          id: string
          listing_id: string
          notes: string | null
          price_per_kg: number
          quantity_kg: number
          status: Database["public"]["Enums"]["transaction_status"]
          total_price: number
          trader_id: string | null
          transaction_date: string
          updated_at: string
        }
        Insert: {
          buyer_location?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          farmer_id?: string | null
          id?: string
          listing_id: string
          notes?: string | null
          price_per_kg: number
          quantity_kg: number
          status?: Database["public"]["Enums"]["transaction_status"]
          total_price: number
          trader_id?: string | null
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          buyer_location?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          farmer_id?: string | null
          id?: string
          listing_id?: string
          notes?: string | null
          price_per_kg?: number
          quantity_kg?: number
          status?: Database["public"]["Enums"]["transaction_status"]
          total_price?: number
          trader_id?: string | null
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "olive_transactions_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "olive_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "olive_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "olive_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "olive_transactions_trader_id_fkey"
            columns: ["trader_id"]
            isOneToOne: false
            referencedRelation: "olive_user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      olive_user_profiles: {
        Row: {
          created_at: string
          experience_years: number | null
          id: string
          location: string
          name: string
          phone: string
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          experience_years?: number | null
          id?: string
          location: string
          name: string
          phone: string
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          experience_years?: number | null
          id?: string
          location?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
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
      soulmate_user_profiles: {
        Row: {
          about_me: string | null
          age: number
          created_at: string
          education: string | null
          family_values: string | null
          gender: string
          id: string
          location: string
          name: string
          occupation: string | null
          religiosity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about_me?: string | null
          age: number
          created_at?: string
          education?: string | null
          family_values?: string | null
          gender: string
          id?: string
          location: string
          name: string
          occupation?: string | null
          religiosity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about_me?: string | null
          age?: number
          created_at?: string
          education?: string | null
          family_values?: string | null
          gender?: string
          id?: string
          location?: string
          name?: string
          occupation?: string | null
          religiosity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      create_default_categories: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      create_default_investment_categories: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      create_wise_partnership: {
        Args: { partner_email: string; partner_name: string }
        Returns: string
      }
      generate_payment_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_action_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          count: number
        }[]
      }
      get_daily_signups: {
        Args: { days_back: number }
        Returns: {
          count: number
          date: string
        }[]
      }
      get_gender_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          gender: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      track_user_action: {
        Args: { action_details: Json; action_type: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
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
