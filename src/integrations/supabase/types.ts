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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aanvragen: {
        Row: {
          ai_motivatie: string | null
          budget_max: number | null
          created_at: string
          gekoppeld_voertuig_id: string | null
          gewenst_type: string | null
          gewenste_brandstof: string | null
          gewenste_categorie: string | null
          gewenste_periode_eind: string | null
          gewenste_periode_start: string | null
          id: string
          klant_email: string | null
          klant_naam: string
          klant_telefoon: string | null
          notitie: string | null
          organisatie_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_motivatie?: string | null
          budget_max?: number | null
          created_at?: string
          gekoppeld_voertuig_id?: string | null
          gewenst_type?: string | null
          gewenste_brandstof?: string | null
          gewenste_categorie?: string | null
          gewenste_periode_eind?: string | null
          gewenste_periode_start?: string | null
          id?: string
          klant_email?: string | null
          klant_naam: string
          klant_telefoon?: string | null
          notitie?: string | null
          organisatie_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_motivatie?: string | null
          budget_max?: number | null
          created_at?: string
          gekoppeld_voertuig_id?: string | null
          gewenst_type?: string | null
          gewenste_brandstof?: string | null
          gewenste_categorie?: string | null
          gewenste_periode_eind?: string | null
          gewenste_periode_start?: string | null
          id?: string
          klant_email?: string | null
          klant_naam?: string
          klant_telefoon?: string | null
          notitie?: string | null
          organisatie_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aanvragen_gekoppeld_voertuig_id_fkey"
            columns: ["gekoppeld_voertuig_id"]
            isOneToOne: false
            referencedRelation: "portaal_voertuigen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aanvragen_gekoppeld_voertuig_id_fkey"
            columns: ["gekoppeld_voertuig_id"]
            isOneToOne: false
            referencedRelation: "voertuigen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aanvragen_gekoppeld_voertuig_id_fkey"
            columns: ["gekoppeld_voertuig_id"]
            isOneToOne: false
            referencedRelation: "voertuigen_publiek"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aanvragen_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      activiteiten_log: {
        Row: {
          actie: string
          beschrijving: string
          created_at: string
          entiteit_id: string | null
          entiteit_type: string | null
          id: string
          metadata: Json | null
          organisatie_id: string | null
          user_id: string
        }
        Insert: {
          actie: string
          beschrijving: string
          created_at?: string
          entiteit_id?: string | null
          entiteit_type?: string | null
          id?: string
          metadata?: Json | null
          organisatie_id?: string | null
          user_id: string
        }
        Update: {
          actie?: string
          beschrijving?: string
          created_at?: string
          entiteit_id?: string | null
          entiteit_type?: string | null
          id?: string
          metadata?: Json | null
          organisatie_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activiteiten_log_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      betaal_verificaties: {
        Row: {
          bedrag: number
          betaald_op: string | null
          contract_id: string | null
          created_at: string
          iban: string | null
          id: string
          klant_id: string | null
          naam_rekeninghouder: string | null
          organisatie_id: string
          status: Database["public"]["Enums"]["betaal_verificatie_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          token_expires_at: string
          updated_at: string
          upload_token: string
          valuta: string
        }
        Insert: {
          bedrag?: number
          betaald_op?: string | null
          contract_id?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          klant_id?: string | null
          naam_rekeninghouder?: string | null
          organisatie_id: string
          status?: Database["public"]["Enums"]["betaal_verificatie_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          token_expires_at?: string
          updated_at?: string
          upload_token?: string
          valuta?: string
        }
        Update: {
          bedrag?: number
          betaald_op?: string | null
          contract_id?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          klant_id?: string | null
          naam_rekeninghouder?: string | null
          organisatie_id?: string
          status?: Database["public"]["Enums"]["betaal_verificatie_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          token_expires_at?: string
          updated_at?: string
          upload_token?: string
          valuta?: string
        }
        Relationships: [
          {
            foreignKeyName: "betaal_verificaties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betaal_verificaties_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betaal_verificaties_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      chauffeur_beschikbaarheid: {
        Row: {
          chauffeur_id: string
          created_at: string
          eind_datum: string
          id: string
          notitie: string | null
          organisatie_id: string | null
          start_datum: string
          type: string
          user_id: string
        }
        Insert: {
          chauffeur_id: string
          created_at?: string
          eind_datum: string
          id?: string
          notitie?: string | null
          organisatie_id?: string | null
          start_datum: string
          type?: string
          user_id: string
        }
        Update: {
          chauffeur_id?: string
          created_at?: string
          eind_datum?: string
          id?: string
          notitie?: string | null
          organisatie_id?: string | null
          start_datum?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chauffeur_beschikbaarheid_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chauffeur_beschikbaarheid_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      chauffeurs: {
        Row: {
          achternaam: string
          adres: string | null
          created_at: string
          email: string | null
          geboortedatum: string | null
          heeft_trailer: boolean
          id: string
          notities: string | null
          organisatie_id: string | null
          plaats: string | null
          postcode: string | null
          rijbewijs_categorie: string
          rijbewijs_nummer: string | null
          rijbewijs_verloopt: string | null
          status: string
          telefoon: string | null
          trailer_plekken: number | null
          updated_at: string
          user_id: string
          voertuig_id: string | null
          voornaam: string
        }
        Insert: {
          achternaam: string
          adres?: string | null
          created_at?: string
          email?: string | null
          geboortedatum?: string | null
          heeft_trailer?: boolean
          id?: string
          notities?: string | null
          organisatie_id?: string | null
          plaats?: string | null
          postcode?: string | null
          rijbewijs_categorie?: string
          rijbewijs_nummer?: string | null
          rijbewijs_verloopt?: string | null
          status?: string
          telefoon?: string | null
          trailer_plekken?: number | null
          updated_at?: string
          user_id: string
          voertuig_id?: string | null
          voornaam: string
        }
        Update: {
          achternaam?: string
          adres?: string | null
          created_at?: string
          email?: string | null
          geboortedatum?: string | null
          heeft_trailer?: boolean
          id?: string
          notities?: string | null
          organisatie_id?: string | null
          plaats?: string | null
          postcode?: string | null
          rijbewijs_categorie?: string
          rijbewijs_nummer?: string | null
          rijbewijs_verloopt?: string | null
          status?: string
          telefoon?: string | null
          trailer_plekken?: number | null
          updated_at?: string
          user_id?: string
          voertuig_id?: string | null
          voornaam?: string
        }
        Relationships: [
          {
            foreignKeyName: "chauffeurs_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          bedrijf: string | null
          bedrijf_adres: string | null
          boeteclausule: string | null
          borg: number | null
          contract_nummer: string
          created_at: string
          eind_datum: string
          id: string
          inclusief: string[]
          klant_adres: string | null
          klant_email: string
          klant_naam: string
          klant_telefoon: string | null
          km_per_jaar: number | null
          kvk_nummer: string | null
          maandprijs: number
          notities: string | null
          ondertekend: boolean | null
          ondertekend_op: string | null
          organisatie_id: string | null
          start_datum: string
          status: Database["public"]["Enums"]["contract_status"]
          type: Database["public"]["Enums"]["contract_type"]
          updated_at: string
          user_id: string
          verlengbaar: boolean | null
          verlengings_termijn: string | null
          voertuig_id: string | null
        }
        Insert: {
          bedrijf?: string | null
          bedrijf_adres?: string | null
          boeteclausule?: string | null
          borg?: number | null
          contract_nummer: string
          created_at?: string
          eind_datum: string
          id?: string
          inclusief?: string[]
          klant_adres?: string | null
          klant_email: string
          klant_naam: string
          klant_telefoon?: string | null
          km_per_jaar?: number | null
          kvk_nummer?: string | null
          maandprijs?: number
          notities?: string | null
          ondertekend?: boolean | null
          ondertekend_op?: string | null
          organisatie_id?: string | null
          start_datum: string
          status?: Database["public"]["Enums"]["contract_status"]
          type: Database["public"]["Enums"]["contract_type"]
          updated_at?: string
          user_id: string
          verlengbaar?: boolean | null
          verlengings_termijn?: string | null
          voertuig_id?: string | null
        }
        Update: {
          bedrijf?: string | null
          bedrijf_adres?: string | null
          boeteclausule?: string | null
          borg?: number | null
          contract_nummer?: string
          created_at?: string
          eind_datum?: string
          id?: string
          inclusief?: string[]
          klant_adres?: string | null
          klant_email?: string
          klant_naam?: string
          klant_telefoon?: string | null
          km_per_jaar?: number | null
          kvk_nummer?: string | null
          maandprijs?: number
          notities?: string | null
          ondertekend?: boolean | null
          ondertekend_op?: string | null
          organisatie_id?: string | null
          start_datum?: string
          status?: Database["public"]["Enums"]["contract_status"]
          type?: Database["public"]["Enums"]["contract_type"]
          updated_at?: string
          user_id?: string
          verlengbaar?: boolean | null
          verlengings_termijn?: string | null
          voertuig_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      eigendom_historie: {
        Row: {
          created_at: string
          eigenaar_naam: string
          eigenaar_type: string
          eind_datum: string | null
          id: string
          notitie: string | null
          organisatie_id: string | null
          start_datum: string
          user_id: string
          voertuig_id: string
        }
        Insert: {
          created_at?: string
          eigenaar_naam: string
          eigenaar_type?: string
          eind_datum?: string | null
          id?: string
          notitie?: string | null
          organisatie_id?: string | null
          start_datum: string
          user_id: string
          voertuig_id: string
        }
        Update: {
          created_at?: string
          eigenaar_naam?: string
          eigenaar_type?: string
          eind_datum?: string | null
          id?: string
          notitie?: string | null
          organisatie_id?: string | null
          start_datum?: string
          user_id?: string
          voertuig_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eigendom_historie_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      goedkeuring_regels: {
        Row: {
          actie_type: string
          actief: boolean
          created_at: string
          drempel_bedrag: number | null
          id: string
          organisatie_id: string
          updated_at: string
        }
        Insert: {
          actie_type: string
          actief?: boolean
          created_at?: string
          drempel_bedrag?: number | null
          id?: string
          organisatie_id: string
          updated_at?: string
        }
        Update: {
          actie_type?: string
          actief?: boolean
          created_at?: string
          drempel_bedrag?: number | null
          id?: string
          organisatie_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goedkeuring_regels_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      goedkeuringen: {
        Row: {
          aangevraagd_door: string
          actie_type: string
          bedrag: number | null
          beoordeeld_door: string | null
          beoordeeld_op: string | null
          beschrijving: string
          created_at: string
          entiteit_id: string | null
          entiteit_type: string | null
          id: string
          organisatie_id: string
          payload: Json | null
          reden_afwijzing: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aangevraagd_door: string
          actie_type: string
          bedrag?: number | null
          beoordeeld_door?: string | null
          beoordeeld_op?: string | null
          beschrijving: string
          created_at?: string
          entiteit_id?: string | null
          entiteit_type?: string | null
          id?: string
          organisatie_id: string
          payload?: Json | null
          reden_afwijzing?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aangevraagd_door?: string
          actie_type?: string
          bedrag?: number | null
          beoordeeld_door?: string | null
          beoordeeld_op?: string | null
          beschrijving?: string
          created_at?: string
          entiteit_id?: string | null
          entiteit_type?: string | null
          id?: string
          organisatie_id?: string
          payload?: Json | null
          reden_afwijzing?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goedkeuringen_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          bedrag: number
          borg_verrekend: number
          contract_id: string
          created_at: string
          datum: string
          id: string
          omschrijving: string | null
          organisatie_id: string | null
          schade_rapport_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          type: string
          user_id: string
        }
        Insert: {
          bedrag?: number
          borg_verrekend?: number
          contract_id: string
          created_at?: string
          datum: string
          id?: string
          omschrijving?: string | null
          organisatie_id?: string | null
          schade_rapport_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          type?: string
          user_id: string
        }
        Update: {
          bedrag?: number
          borg_verrekend?: number
          contract_id?: string
          created_at?: string
          datum?: string
          id?: string
          omschrijving?: string | null
          organisatie_id?: string | null
          schade_rapport_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_schade_rapport_id_fkey"
            columns: ["schade_rapport_id"]
            isOneToOne: false
            referencedRelation: "schade_rapporten"
            referencedColumns: ["id"]
          },
        ]
      }
      kilometer_registraties: {
        Row: {
          contract_id: string
          created_at: string
          datum: string
          id: string
          kilometerstand: number
          notitie: string | null
          organisatie_id: string | null
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          datum: string
          id?: string
          kilometerstand: number
          notitie?: string | null
          organisatie_id?: string | null
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          datum?: string
          id?: string
          kilometerstand?: number
          notitie?: string | null
          organisatie_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kilometer_registraties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kilometer_registraties_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      klanten: {
        Row: {
          achternaam: string
          adres: string | null
          auth_user_id: string | null
          bedrijfsnaam: string | null
          created_at: string
          email: string
          id: string
          kvk_nummer: string | null
          notities: string | null
          organisatie_id: string | null
          plaats: string | null
          postcode: string | null
          rijbewijs_nummer: string | null
          rijbewijs_verloopt: string | null
          telefoon: string | null
          type: string
          updated_at: string
          voornaam: string
        }
        Insert: {
          achternaam: string
          adres?: string | null
          auth_user_id?: string | null
          bedrijfsnaam?: string | null
          created_at?: string
          email: string
          id?: string
          kvk_nummer?: string | null
          notities?: string | null
          organisatie_id?: string | null
          plaats?: string | null
          postcode?: string | null
          rijbewijs_nummer?: string | null
          rijbewijs_verloopt?: string | null
          telefoon?: string | null
          type?: string
          updated_at?: string
          voornaam: string
        }
        Update: {
          achternaam?: string
          adres?: string | null
          auth_user_id?: string | null
          bedrijfsnaam?: string | null
          created_at?: string
          email?: string
          id?: string
          kvk_nummer?: string | null
          notities?: string | null
          organisatie_id?: string | null
          plaats?: string | null
          postcode?: string | null
          rijbewijs_nummer?: string | null
          rijbewijs_verloopt?: string | null
          telefoon?: string | null
          type?: string
          updated_at?: string
          voornaam?: string
        }
        Relationships: [
          {
            foreignKeyName: "klanten_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      locaties: {
        Row: {
          created_at: string
          id: string
          naam: string
          organisatie_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          naam: string
          organisatie_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          naam?: string
          organisatie_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locaties_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      organisaties: {
        Row: {
          created_at: string
          eigenaar_id: string
          id: string
          is_active: boolean
          module_modus: string
          naam: string
          portaal_actief: boolean
          portaal_kleur: string | null
          portaal_logo_url: string | null
          portaal_naam: string | null
          portaal_welkomtekst: string | null
          slug: string | null
          trial_ends_at: string | null
        }
        Insert: {
          created_at?: string
          eigenaar_id: string
          id?: string
          is_active?: boolean
          module_modus?: string
          naam?: string
          portaal_actief?: boolean
          portaal_kleur?: string | null
          portaal_logo_url?: string | null
          portaal_naam?: string | null
          portaal_welkomtekst?: string | null
          slug?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          created_at?: string
          eigenaar_id?: string
          id?: string
          is_active?: boolean
          module_modus?: string
          naam?: string
          portaal_actief?: boolean
          portaal_kleur?: string | null
          portaal_logo_url?: string | null
          portaal_naam?: string | null
          portaal_welkomtekst?: string | null
          slug?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      overdrachten: {
        Row: {
          contract_id: string | null
          created_at: string
          datum: string
          handtekening: string | null
          id: string
          kilometerstand: number | null
          klant_email: string | null
          klant_naam: string
          ondertekend_op: string | null
          opmerkingen: string | null
          organisatie_id: string | null
          status: string
          type: string
          user_id: string
          voertuig_id: string
          voertuig_kenteken: string
          voertuig_naam: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          datum?: string
          handtekening?: string | null
          id?: string
          kilometerstand?: number | null
          klant_email?: string | null
          klant_naam: string
          ondertekend_op?: string | null
          opmerkingen?: string | null
          organisatie_id?: string | null
          status?: string
          type?: string
          user_id: string
          voertuig_id: string
          voertuig_kenteken: string
          voertuig_naam: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          datum?: string
          handtekening?: string | null
          id?: string
          kilometerstand?: number | null
          klant_email?: string | null
          klant_naam?: string
          ondertekend_op?: string | null
          opmerkingen?: string | null
          organisatie_id?: string | null
          status?: string
          type?: string
          user_id?: string
          voertuig_id?: string
          voertuig_kenteken?: string
          voertuig_naam?: string
        }
        Relationships: [
          {
            foreignKeyName: "overdrachten_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overdrachten_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      portaal_domeinen: {
        Row: {
          created_at: string
          hostname: string
          id: string
          organisatie_id: string
          status: string
          updated_at: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          organisatie_id: string
          status?: string
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          organisatie_id?: string
          status?: string
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portaal_domeinen_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      reserveringen: {
        Row: {
          created_at: string
          dagprijs: number
          eind_datum: string
          extras: string[]
          id: string
          klant_id: string
          notities: string | null
          start_datum: string
          status: string
          totaalprijs: number
          updated_at: string
          voertuig_id: string
        }
        Insert: {
          created_at?: string
          dagprijs?: number
          eind_datum: string
          extras?: string[]
          id?: string
          klant_id: string
          notities?: string | null
          start_datum: string
          status?: string
          totaalprijs?: number
          updated_at?: string
          voertuig_id: string
        }
        Update: {
          created_at?: string
          dagprijs?: number
          eind_datum?: string
          extras?: string[]
          id?: string
          klant_id?: string
          notities?: string | null
          start_datum?: string
          status?: string
          totaalprijs?: number
          updated_at?: string
          voertuig_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserveringen_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
        ]
      }
      rijbewijs_verificaties: {
        Row: {
          achterkant_pad: string | null
          ai_afgiftedatum: string | null
          ai_categorieen: string[] | null
          ai_confidence: number | null
          ai_geboortedatum: string | null
          ai_naam: string | null
          ai_rijbewijsnummer: string | null
          ai_ruwe_data: Json | null
          ai_vervaldatum: string | null
          beoordeeld_door: string | null
          beoordeeld_op: string | null
          contract_id: string | null
          created_at: string
          email_verzonden_op: string | null
          herinnering_verzonden_op: string | null
          id: string
          ingediend_op: string | null
          klant_id: string
          organisatie_id: string
          reden_afwijzing: string | null
          status: Database["public"]["Enums"]["rijbewijs_status"]
          token_expires_at: string
          updated_at: string
          upload_token: string
          validatie_notities: string | null
          voorkant_pad: string | null
        }
        Insert: {
          achterkant_pad?: string | null
          ai_afgiftedatum?: string | null
          ai_categorieen?: string[] | null
          ai_confidence?: number | null
          ai_geboortedatum?: string | null
          ai_naam?: string | null
          ai_rijbewijsnummer?: string | null
          ai_ruwe_data?: Json | null
          ai_vervaldatum?: string | null
          beoordeeld_door?: string | null
          beoordeeld_op?: string | null
          contract_id?: string | null
          created_at?: string
          email_verzonden_op?: string | null
          herinnering_verzonden_op?: string | null
          id?: string
          ingediend_op?: string | null
          klant_id: string
          organisatie_id: string
          reden_afwijzing?: string | null
          status?: Database["public"]["Enums"]["rijbewijs_status"]
          token_expires_at?: string
          updated_at?: string
          upload_token: string
          validatie_notities?: string | null
          voorkant_pad?: string | null
        }
        Update: {
          achterkant_pad?: string | null
          ai_afgiftedatum?: string | null
          ai_categorieen?: string[] | null
          ai_confidence?: number | null
          ai_geboortedatum?: string | null
          ai_naam?: string | null
          ai_rijbewijsnummer?: string | null
          ai_ruwe_data?: Json | null
          ai_vervaldatum?: string | null
          beoordeeld_door?: string | null
          beoordeeld_op?: string | null
          contract_id?: string | null
          created_at?: string
          email_verzonden_op?: string | null
          herinnering_verzonden_op?: string | null
          id?: string
          ingediend_op?: string | null
          klant_id?: string
          organisatie_id?: string
          reden_afwijzing?: string | null
          status?: Database["public"]["Enums"]["rijbewijs_status"]
          token_expires_at?: string
          updated_at?: string
          upload_token?: string
          validatie_notities?: string | null
          voorkant_pad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rijbewijs_verificaties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rijbewijs_verificaties_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "klanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rijbewijs_verificaties_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      ritten: {
        Row: {
          aankomst_tijd: string | null
          afstand_km: number | null
          chauffeur_id: string | null
          created_at: string
          datum: string
          id: string
          km_tarief: number | null
          kosten: number | null
          naar_locatie: string
          notitie: string | null
          organisatie_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          van_locatie: string
          vertrek_tijd: string | null
          voertuig_id: string | null
        }
        Insert: {
          aankomst_tijd?: string | null
          afstand_km?: number | null
          chauffeur_id?: string | null
          created_at?: string
          datum?: string
          id?: string
          km_tarief?: number | null
          kosten?: number | null
          naar_locatie: string
          notitie?: string | null
          organisatie_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
          van_locatie: string
          vertrek_tijd?: string | null
          voertuig_id?: string | null
        }
        Update: {
          aankomst_tijd?: string | null
          afstand_km?: number | null
          chauffeur_id?: string | null
          created_at?: string
          datum?: string
          id?: string
          km_tarief?: number | null
          kosten?: number | null
          naar_locatie?: string
          notitie?: string | null
          organisatie_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          van_locatie?: string
          vertrek_tijd?: string | null
          voertuig_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ritten_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritten_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritten_voertuig_id_fkey"
            columns: ["voertuig_id"]
            isOneToOne: false
            referencedRelation: "portaal_voertuigen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritten_voertuig_id_fkey"
            columns: ["voertuig_id"]
            isOneToOne: false
            referencedRelation: "voertuigen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritten_voertuig_id_fkey"
            columns: ["voertuig_id"]
            isOneToOne: false
            referencedRelation: "voertuigen_publiek"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      schade_rapporten: {
        Row: {
          created_at: string
          datum: string
          ernst: string
          fotos: string[] | null
          herstel_datum: string | null
          hersteld: boolean | null
          id: string
          kosten: number | null
          locatie_schade: string | null
          notitie: string | null
          omschrijving: string
          organisatie_id: string | null
          schade_punten: Json | null
          user_id: string
          verzekerd: boolean | null
          voertuig_id: string
        }
        Insert: {
          created_at?: string
          datum: string
          ernst?: string
          fotos?: string[] | null
          herstel_datum?: string | null
          hersteld?: boolean | null
          id?: string
          kosten?: number | null
          locatie_schade?: string | null
          notitie?: string | null
          omschrijving: string
          organisatie_id?: string | null
          schade_punten?: Json | null
          user_id: string
          verzekerd?: boolean | null
          voertuig_id: string
        }
        Update: {
          created_at?: string
          datum?: string
          ernst?: string
          fotos?: string[] | null
          herstel_datum?: string | null
          hersteld?: boolean | null
          id?: string
          kosten?: number | null
          locatie_schade?: string | null
          notitie?: string | null
          omschrijving?: string
          organisatie_id?: string | null
          schade_punten?: Json | null
          user_id?: string
          verzekerd?: boolean | null
          voertuig_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schade_rapporten_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      service_historie: {
        Row: {
          created_at: string
          datum: string
          garage: string | null
          id: string
          kilometerstand: number | null
          kosten: number | null
          notitie: string | null
          omschrijving: string
          organisatie_id: string | null
          type: string
          user_id: string
          voertuig_id: string
        }
        Insert: {
          created_at?: string
          datum: string
          garage?: string | null
          id?: string
          kilometerstand?: number | null
          kosten?: number | null
          notitie?: string | null
          omschrijving: string
          organisatie_id?: string | null
          type?: string
          user_id: string
          voertuig_id: string
        }
        Update: {
          created_at?: string
          datum?: string
          garage?: string | null
          id?: string
          kilometerstand?: number | null
          kosten?: number | null
          notitie?: string | null
          omschrijving?: string
          organisatie_id?: string | null
          type?: string
          user_id?: string
          voertuig_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_historie_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      terugmeldingen: {
        Row: {
          bon_url: string | null
          created_at: string
          datum: string
          fotos: string[] | null
          id: string
          kilometerstand: number
          medewerker_email: string | null
          notitie: string | null
          organisatie_id: string | null
          user_id: string
          voertuig_id: string
          voertuig_kenteken: string
          voertuig_naam: string
        }
        Insert: {
          bon_url?: string | null
          created_at?: string
          datum?: string
          fotos?: string[] | null
          id?: string
          kilometerstand: number
          medewerker_email?: string | null
          notitie?: string | null
          organisatie_id?: string | null
          user_id: string
          voertuig_id: string
          voertuig_kenteken: string
          voertuig_naam: string
        }
        Update: {
          bon_url?: string | null
          created_at?: string
          datum?: string
          fotos?: string[] | null
          id?: string
          kilometerstand?: number
          medewerker_email?: string | null
          notitie?: string | null
          organisatie_id?: string | null
          user_id?: string
          voertuig_id?: string
          voertuig_kenteken?: string
          voertuig_naam?: string
        }
        Relationships: [
          {
            foreignKeyName: "terugmeldingen_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      uitnodigingen: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          organisatie_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          uitgenodigd_door: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          organisatie_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          uitgenodigd_door: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          organisatie_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          uitgenodigd_door?: string
        }
        Relationships: [
          {
            foreignKeyName: "uitnodigingen_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organisatie_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organisatie_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organisatie_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      voertuigen: {
        Row: {
          apk_vervaldatum: string | null
          bouwjaar: number
          brandstof: string
          catalogusprijs: number | null
          categorie: string
          cilinderinhoud: number | null
          co2_uitstoot: number | null
          created_at: string
          dagprijs: number
          eerste_toelating: string | null
          id: string
          image_url: string | null
          kenteken: string
          kilometerstand: number
          kleur: string
          locatie: string | null
          massa_ledig: number | null
          merk: string
          model: string
          organisatie_id: string | null
          status: string
          updated_at: string
          user_id: string
          verzekering_vervaldatum: string | null
          voertuigsoort: string | null
        }
        Insert: {
          apk_vervaldatum?: string | null
          bouwjaar: number
          brandstof?: string
          catalogusprijs?: number | null
          categorie?: string
          cilinderinhoud?: number | null
          co2_uitstoot?: number | null
          created_at?: string
          dagprijs?: number
          eerste_toelating?: string | null
          id?: string
          image_url?: string | null
          kenteken: string
          kilometerstand?: number
          kleur?: string
          locatie?: string | null
          massa_ledig?: number | null
          merk: string
          model: string
          organisatie_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verzekering_vervaldatum?: string | null
          voertuigsoort?: string | null
        }
        Update: {
          apk_vervaldatum?: string | null
          bouwjaar?: number
          brandstof?: string
          catalogusprijs?: number | null
          categorie?: string
          cilinderinhoud?: number | null
          co2_uitstoot?: number | null
          created_at?: string
          dagprijs?: number
          eerste_toelating?: string | null
          id?: string
          image_url?: string | null
          kenteken?: string
          kilometerstand?: number
          kleur?: string
          locatie?: string | null
          massa_ledig?: number | null
          merk?: string
          model?: string
          organisatie_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verzekering_vervaldatum?: string | null
          voertuigsoort?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voertuigen_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      portaal_voertuigen: {
        Row: {
          bouwjaar: number | null
          brandstof: string | null
          categorie: string | null
          dagprijs: number | null
          id: string | null
          image_url: string | null
          kenteken: string | null
          kleur: string | null
          merk: string | null
          model: string | null
          organisatie_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voertuigen_organisatie_id_fkey"
            columns: ["organisatie_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      reserveringen_beschikbaarheid: {
        Row: {
          eind_datum: string | null
          start_datum: string | null
          status: string | null
          voertuig_id: string | null
        }
        Insert: {
          eind_datum?: string | null
          start_datum?: string | null
          status?: string | null
          voertuig_id?: string | null
        }
        Update: {
          eind_datum?: string | null
          start_datum?: string | null
          status?: string | null
          voertuig_id?: string | null
        }
        Relationships: []
      }
      voertuigen_publiek: {
        Row: {
          bouwjaar: number | null
          brandstof: string | null
          categorie: string | null
          dagprijs: number | null
          id: string | null
          image_url: string | null
          kleur: string | null
          locatie: string | null
          merk: string | null
          model: string | null
          status: string | null
        }
        Insert: {
          bouwjaar?: number | null
          brandstof?: string | null
          categorie?: string | null
          dagprijs?: number | null
          id?: string | null
          image_url?: string | null
          kleur?: string | null
          locatie?: string | null
          merk?: string | null
          model?: string | null
          status?: string | null
        }
        Update: {
          bouwjaar?: number | null
          brandstof?: string | null
          categorie?: string | null
          dagprijs?: number | null
          id?: string | null
          image_url?: string | null
          kleur?: string | null
          locatie?: string | null
          merk?: string | null
          model?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_organisatie: {
        Args: { _org_id: string }
        Returns: undefined
      }
      admin_get_organisatie: { Args: { _org_id: string }; Returns: Json }
      admin_grant_platform_admin: {
        Args: { _user_email: string }
        Returns: undefined
      }
      admin_invite_user_to_org: {
        Args: {
          _email: string
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      admin_list_organisaties: {
        Args: never
        Returns: {
          contract_count: number
          created_at: string
          eigenaar_email: string
          eigenaar_id: string
          eigenaar_last_sign_in_at: string
          id: string
          is_active: boolean
          klant_count: number
          laatste_activiteit: string
          laatste_inlog_org: string
          naam: string
          trial_ends_at: string
          user_count: number
          voertuig_count: number
        }[]
      }
      admin_list_platform_admins: {
        Args: never
        Returns: {
          created_at: string
          email: string
          last_sign_in_at: string
          user_id: string
        }[]
      }
      admin_remove_user_from_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: undefined
      }
      admin_revoke_platform_admin: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_set_module_modus: {
        Args: { _modus: string; _org_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _org_id: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_update_organisatie: {
        Args: {
          _is_active?: boolean
          _naam?: string
          _org_id: string
          _trial_ends_at?: string
        }
        Returns: undefined
      }
      convert_aanvraag_naar_klant: {
        Args: { _aanvraag_id: string }
        Returns: string
      }
      create_gast_aanvraag: {
        Args: {
          _eind_datum?: string
          _gewenste_brandstof?: string
          _gewenste_categorie?: string
          _klant_email: string
          _klant_naam: string
          _klant_telefoon?: string
          _notitie?: string
          _organisatie_id: string
          _start_datum?: string
          _voertuig_id?: string
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_betaal_verzoek: {
        Args: { _token: string }
        Returns: {
          bedrag: number
          expired: boolean
          id: string
          klant_achternaam: string
          klant_voornaam: string
          organisatie_kleur: string
          organisatie_logo: string
          organisatie_naam: string
          status: Database["public"]["Enums"]["betaal_verificatie_status"]
          valuta: string
        }[]
      }
      get_module_modus: { Args: never; Returns: string }
      get_portaal_by_host: {
        Args: { _host: string }
        Returns: {
          id: string
          naam: string
          portaal_kleur: string
          portaal_logo_url: string
          portaal_naam: string
          portaal_welkomtekst: string
          slug: string
        }[]
      }
      get_portaal_by_slug: {
        Args: { _slug: string }
        Returns: {
          id: string
          naam: string
          portaal_kleur: string
          portaal_logo_url: string
          portaal_naam: string
          portaal_welkomtekst: string
          slug: string
        }[]
      }
      get_portaal_voertuigen: {
        Args: { _host: string }
        Returns: {
          bouwjaar: number
          brandstof: string
          categorie: string
          dagprijs: number
          id: string
          image_url: string
          kleur: string
          merk: string
          model: string
        }[]
      }
      get_publiek_aanbod: {
        Args: { _organisatie_id: string }
        Returns: {
          bouwjaar: number
          brandstof: string
          categorie: string
          dagprijs: number
          id: string
          image_url: string
          kleur: string
          merk: string
          model: string
        }[]
      }
      get_rijbewijs_verzoek: {
        Args: { _token: string }
        Returns: {
          expired: boolean
          id: string
          klant_achternaam: string
          klant_voornaam: string
          organisatie_kleur: string
          organisatie_logo: string
          organisatie_naam: string
          status: Database["public"]["Enums"]["rijbewijs_status"]
        }[]
      }
      get_user_organisatie_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      markeer_betaal_verificatie_betaald: {
        Args: {
          _iban: string
          _naam: string
          _payment_intent_id: string
          _session_id: string
        }
        Returns: string
      }
      markeer_rijbewijs_ingediend: {
        Args: { _achterkant_pad: string; _token: string; _voorkant_pad: string }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      update_rijbewijs_ai_resultaat: {
        Args: {
          _ai_afgiftedatum: string
          _ai_categorieen: string[]
          _ai_confidence: number
          _ai_geboortedatum: string
          _ai_naam: string
          _ai_rijbewijsnummer: string
          _ai_ruwe_data: Json
          _ai_vervaldatum: string
          _auto_status: Database["public"]["Enums"]["rijbewijs_status"]
          _id: string
          _validatie_notities: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "beheerder"
        | "medewerker"
        | "chauffeur"
        | "klant"
        | "leidinggevende"
        | "platform_admin"
      betaal_verificatie_status:
        | "in_afwachting"
        | "betaald"
        | "mislukt"
        | "verlopen"
      contract_status: "actief" | "verlopen" | "opgezegd" | "concept"
      contract_type: "lease" | "verhuur" | "fietslease" | "ev-lease"
      invoice_status:
        | "betaald"
        | "openstaand"
        | "te_laat"
        | "herinnering_verstuurd"
      rijbewijs_status:
        | "in_afwachting"
        | "ingediend"
        | "goedgekeurd"
        | "afgewezen"
        | "verlopen"
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
      app_role: [
        "beheerder",
        "medewerker",
        "chauffeur",
        "klant",
        "leidinggevende",
        "platform_admin",
      ],
      betaal_verificatie_status: [
        "in_afwachting",
        "betaald",
        "mislukt",
        "verlopen",
      ],
      contract_status: ["actief", "verlopen", "opgezegd", "concept"],
      contract_type: ["lease", "verhuur", "fietslease", "ev-lease"],
      invoice_status: [
        "betaald",
        "openstaand",
        "te_laat",
        "herinnering_verstuurd",
      ],
      rijbewijs_status: [
        "in_afwachting",
        "ingediend",
        "goedgekeurd",
        "afgewezen",
        "verlopen",
      ],
    },
  },
} as const
