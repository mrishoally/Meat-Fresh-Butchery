export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          role: string
          staff_id: string | null
          staff_name: string
          store_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          role?: string
          staff_id?: string | null
          staff_name: string
          store_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          role?: string
          staff_id?: string | null
          staff_name?: string
          store_id?: string
        }
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          phone: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          phone?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          phone?: string | null
          store_id?: string
          updated_at?: string
        }
      }
      category_thresholds: {
        Row: {
          category: string
          id: string
          store_id: string
          threshold: number
        }
        Insert: {
          category: string
          id?: string
          store_id: string
          threshold?: number
        }
        Update: {
          category?: string
          id?: string
          store_id?: string
          threshold?: number
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price_each: number
          product_id: string | null
          product_name: string
          qty: number
          subtotal: number | null
        }
        Insert: {
          id?: string
          order_id: string
          price_each: number
          product_id?: string | null
          product_name: string
          qty: number
          subtotal?: number | null
        }
        Update: {
          id?: string
          order_id?: string
          price_each?: number
          product_id?: string | null
          product_name?: string
          qty?: number
          subtotal?: number | null
        }
      }
      orders: {
        Row: {
          branch_id: string | null
          branch_name: string
          cancel_reason: string | null
          contact: string
          created_at: string
          created_by_staff: string | null
          customer_id: string | null
          customer_name: string
          id: string
          is_manual_order: boolean
          notes: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_paid: boolean
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          total: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          branch_name?: string
          cancel_reason?: string | null
          contact: string
          created_at?: string
          created_by_staff?: string | null
          customer_id?: string | null
          customer_name: string
          id: string
          is_manual_order?: boolean
          notes?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_paid?: boolean
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          total: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          branch_name?: string
          cancel_reason?: string | null
          contact?: string
          created_at?: string
          created_by_staff?: string | null
          customer_id?: string | null
          customer_name?: string
          id?: string
          is_manual_order?: boolean
          notes?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_paid?: boolean
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          total?: number
          updated_at?: string
        }
      }
      products: {
        Row: {
          branch_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          image_url: string
          is_active: boolean
          low_stock_threshold: number | null
          name: string
          price: number
          quantity: number
          store_id: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_active?: boolean
          low_stock_threshold?: number | null
          name: string
          price: number
          quantity?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_active?: boolean
          low_stock_threshold?: number | null
          name?: string
          price?: number
          quantity?: number
          store_id?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          pin_hash: string
          role: Database["public"]["Enums"]["staff_role"]
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          pin_hash?: string
          role?: Database["public"]["Enums"]["staff_role"]
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          pin_hash?: string
          role?: Database["public"]["Enums"]["staff_role"]
          store_id?: string
          updated_at?: string
          user_id?: string | null
        }
      }
      store_operating_hours: {
        Row: {
          close_time: string
          day_of_week: string
          id: string
          is_closed: boolean
          open_time: string
          store_id: string
        }
        Insert: {
          close_time?: string
          day_of_week: string
          id?: string
          is_closed?: boolean
          open_time?: string
          store_id: string
        }
        Update: {
          close_time?: string
          day_of_week?: string
          id?: string
          is_closed?: boolean
          open_time?: string
          store_id?: string
        }
      }
      store_payment_config: {
        Row: {
          airtel_enabled: boolean
          airtel_lipa: string | null
          cash_enabled: boolean
          created_at: string
          id: string
          mpesa_enabled: boolean
          mpesa_paybill: string | null
          mpesa_till: string | null
          store_id: string
          tigopesa_enabled: boolean
          tigopesa_lipa: string | null
          updated_at: string
        }
        Insert: {
          airtel_enabled?: boolean
          airtel_lipa?: string | null
          cash_enabled?: boolean
          created_at?: string
          id?: string
          mpesa_enabled?: boolean
          mpesa_paybill?: string | null
          mpesa_till?: string | null
          store_id: string
          tigopesa_enabled?: boolean
          tigopesa_lipa?: string | null
          updated_at?: string
        }
        Update: {
          airtel_enabled?: boolean
          airtel_lipa?: string | null
          cash_enabled?: boolean
          created_at?: string
          id?: string
          mpesa_enabled?: boolean
          mpesa_paybill?: string | null
          mpesa_till?: string | null
          store_id?: string
          tigopesa_enabled?: boolean
          tigopesa_lipa?: string | null
          updated_at?: string
        }
      }
      stores: {
        Row: {
          address: string | null
          auto_cancel_hours: number
          created_at: string
          currency: string
          cutoff_time: string
          email: string | null
          hold_time_hours: number
          id: string
          language: string
          logo_url: string | null
          low_stock_threshold: number
          min_order_amount: number
          min_order_kg: number
          name: string
          opening_hours: string | null
          phone: string | null
          receipt_format: string
          receipt_prefix: string
          snippe_api_key: string | null
          snippe_live_mode: boolean
          snippe_webhook_url: string | null
          tagline: string
          theme_color: string
          thermal_width: Database["public"]["Enums"]["thermal_width"]
          tin_number: string | null
          updated_at: string
          whatsapp: string | null
          whatsapp_template: string | null
        }
        Insert: {
          address?: string | null
          auto_cancel_hours?: number
          created_at?: string
          currency?: string
          cutoff_time?: string
          email?: string | null
          hold_time_hours?: number
          id?: string
          language?: string
          logo_url?: string | null
          low_stock_threshold?: number
          min_order_amount?: number
          min_order_kg?: number
          name?: string
          opening_hours?: string | null
          phone?: string | null
          receipt_format?: string
          receipt_prefix?: string
          snippe_api_key?: string | null
          snippe_live_mode?: boolean
          snippe_webhook_url?: string | null
          tagline?: string
          theme_color?: string
          thermal_width?: Database["public"]["Enums"]["thermal_width"]
          tin_number?: string | null
          updated_at?: string
          whatsapp?: string | null
          whatsapp_template?: string | null
        }
        Update: {
          address?: string | null
          auto_cancel_hours?: number
          created_at?: string
          currency?: string
          cutoff_time?: string
          email?: string | null
          hold_time_hours?: number
          id?: string
          language?: string
          logo_url?: string | null
          low_stock_threshold?: number
          min_order_amount?: number
          min_order_kg?: number
          name?: string
          opening_hours?: string | null
          phone?: string | null
          receipt_format?: string
          receipt_prefix?: string
          snippe_api_key?: string | null
          snippe_live_mode?: boolean
          snippe_webhook_url?: string | null
          tagline?: string
          theme_color?: string
          thermal_width?: Database["public"]["Enums"]["thermal_width"]
          tin_number?: string | null
          updated_at?: string
          whatsapp?: string | null
          whatsapp_template?: string | null
        }
      }
      users: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          metadata: Json | null
          phone: string | null
          role: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          metadata?: Json | null
          phone?: string | null
          role?: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          phone?: string | null
          role?: string
          store_id?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      v_low_stock_products: {
        Row: {
          branch_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          effective_threshold: number | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string | null
          price: number | null
          quantity: number | null
          stock_status: string | null
          store_id: string | null
          updated_at: string | null
        }
      }
      v_most_ordered_products: {
        Row: {
          order_count: number | null
          product_id: string | null
          product_name: string | null
          total_qty_ordered: number | null
          total_revenue: number | null
        }
      }
      v_order_summary: {
        Row: {
          branch_name: string | null
          cancel_reason: string | null
          contact: string | null
          created_at: string | null
          customer_name: string | null
          id: string | null
          is_manual_order: boolean | null
          item_count: number | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_paid: boolean | null
          status: Database["public"]["Enums"]["order_status"] | null
          store_id: string | null
          total: number | null
          updated_at: string | null
        }
      }
    }
    Enums: {
      order_status: "pending" | "ready" | "fulfilled" | "cancelled"
      payment_method: "Cash" | "M-Pesa" | "Tigo Pesa" | "Airtel Money" | "Card"
      staff_role: "owner" | "cashier" | "butcher" | "system"
      thermal_width: "58mm" | "80mm"
    }
  }
}
