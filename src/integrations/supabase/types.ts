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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aanvragen_gekoppeld_voertuig_id_fkey"
            columns: ["gekoppeld_voertuig_id"]
            isOneToOne: false
            referencedRelation: "voertuigen"
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
      invoices: {
        Row: {
          bedrag: number
          contract_id: string
          created_at: string
          datum: string
          id: string
          organisatie_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          user_id: string
        }
        Insert: {
          bedrag?: number
          contract_id: string
          created_at?: string
          datum: string
          id?: string
          organisatie_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          user_id: string
        }
        Update: {
          bedrag?: number
          contract_id?: string
          created_at?: string
          datum?: string
          id?: string
          organisatie_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
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
          plaats?: string | null
          postcode?: string | null
          rijbewijs_nummer?: string | null
          rijbewijs_verloopt?: string | null
          telefoon?: string | null
          type?: string
          updated_at?: string
          voornaam?: string
        }
        Relationships: []
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
          naam: string
        }
        Insert: {
          created_at?: string
          eigenaar_id: string
          id?: string
          naam?: string
        }
        Update: {
          created_at?: string
          eigenaar_id?: string
          id?: string
          naam?: string
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
            referencedRelation: "voertuigen"
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
          categorie: string
          created_at: string
          dagprijs: number
          id: string
          kenteken: string
          kilometerstand: number
          kleur: string
          locatie: string | null
          merk: string
          model: string
          organisatie_id: string | null
          status: string
          updated_at: string
          user_id: string
          verzekering_vervaldatum: string | null
        }
        Insert: {
          apk_vervaldatum?: string | null
          bouwjaar: number
          brandstof?: string
          categorie?: string
          created_at?: string
          dagprijs?: number
          id?: string
          kenteken: string
          kilometerstand?: number
          kleur?: string
          locatie?: string | null
          merk: string
          model: string
          organisatie_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verzekering_vervaldatum?: string | null
        }
        Update: {
          apk_vervaldatum?: string | null
          bouwjaar?: number
          brandstof?: string
          categorie?: string
          created_at?: string
          dagprijs?: number
          id?: string
          kenteken?: string
          kilometerstand?: number
          kleur?: string
          locatie?: string | null
          merk?: string
          model?: string
          organisatie_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verzekering_vervaldatum?: string | null
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
      [_ in never]: never
    }
    Functions: {
      get_user_organisatie_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "beheerder" | "medewerker" | "chauffeur" | "klant"
      contract_status: "actief" | "verlopen" | "opgezegd" | "concept"
      contract_type: "lease" | "verhuur" | "fietslease" | "ev-lease"
      invoice_status:
        | "betaald"
        | "openstaand"
        | "te_laat"
        | "herinnering_verstuurd"
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
      app_role: ["beheerder", "medewerker", "chauffeur", "klant"],
      contract_status: ["actief", "verlopen", "opgezegd", "concept"],
      contract_type: ["lease", "verhuur", "fietslease", "ev-lease"],
      invoice_status: [
        "betaald",
        "openstaand",
        "te_laat",
        "herinnering_verstuurd",
      ],
    },
  },
} as const
